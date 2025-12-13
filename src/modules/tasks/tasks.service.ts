import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreatePhaseDto,
  CreateTaskDto,
  PhaseResponseDto,
  PhaseTaskFilters,
  TaskPositionDto,
  TaskResponseDto,
  UpdatePhaseDto,
  UpdateTaskDto,
} from '../../common/interfaces/task.interface';
import { TaskPhaseEntity } from './entities/task-phase.entity';
import { TaskEntity } from './entities/task.entity';
import { TaskStatus } from '../../common/enums/task.enum';
import {
  TASK_STATUS_IDS,
  TASK_STATUS_REFERENCE,
} from './constants/task-status.reference';
import { resolveAssigneeProfile } from './reference/task-assignees.reference';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(TaskPhaseEntity)
    private readonly phaseRepository: Repository<TaskPhaseEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) {
    this.logger.log('TasksService initialized');
  }

  async listPhases(includeTasks = false): Promise<PhaseResponseDto[]> {
    const phases = await this.phaseRepository.find({
      order: { order: 'ASC', createdAt: 'ASC' },
      relations: includeTasks ? ['tasks'] : [],
    });

    const taskCounts = await this.getPhaseTaskCountMap();

    return phases.map((phase) =>
      this.mapPhaseToResponseDto(
        phase,
        includeTasks
          ? this.sortTasksByStatusAndOrder(phase.tasks ?? [], phase.statuses)
          : undefined,
        taskCounts.get(phase.id) ?? 0,
      ),
    );
  }

  async createPhase(dto: CreatePhaseDto): Promise<PhaseResponseDto> {
    this.ensureStatusesValid(dto.statuses);

    const existing = await this.phaseRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(
        `Phase with name ${dto.name} already exists`,
      );
    }

    const nextOrder = dto.order ?? (await this.getNextPhaseOrder());

    const phase = this.phaseRepository.create({
      ...dto,
      order: nextOrder,
    });

    const saved = await this.phaseRepository.save(phase);

    return this.mapPhaseToResponseDto(saved, undefined, 0);
  }

  async updatePhase(
    phaseId: string,
    dto: UpdatePhaseDto,
  ): Promise<PhaseResponseDto> {
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId },
    });

    if (!phase) {
      throw new NotFoundException(`Phase ${phaseId} was not found`);
    }

    if (dto.statuses) {
      this.ensureStatusesValid(dto.statuses);
    }

    if (dto.order !== undefined && dto.order !== phase.order) {
      await this.shiftPhaseOrders(dto.order, phaseId);
    }

    Object.assign(phase, dto);

    const saved = await this.phaseRepository.save(phase);
    const taskCounts = await this.getPhaseTaskCountMap();

    return this.mapPhaseToResponseDto(
      saved,
      undefined,
      taskCounts.get(saved.id) ?? 0,
    );
  }

  async removePhase(phaseId: string, reassignPhaseId?: string): Promise<void> {
    if (phaseId === reassignPhaseId) {
      throw new BadRequestException('Cannot reassign tasks to the same phase');
    }

    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId },
    });
    if (!phase) {
      throw new NotFoundException(`Phase ${phaseId} not found`);
    }

    const taskCount = await this.taskRepository.count({
      where: { phase: { id: phaseId } },
    });

    if (taskCount > 0) {
      if (!reassignPhaseId) {
        throw new BadRequestException(
          'Phase has tasks. Provide reassignPhaseId to move tasks before deleting.',
        );
      }

      const targetPhase = await this.phaseRepository.findOne({
        where: { id: reassignPhaseId },
      });
      if (!targetPhase) {
        throw new NotFoundException(
          `Target phase ${reassignPhaseId} not found`,
        );
      }

      await this.ensurePhaseCanAcceptTasks(targetPhase, phaseId);

      await this.taskRepository
        .createQueryBuilder()
        .update(TaskEntity)
        .set({ phase: targetPhase })
        .where('phase_id = :phaseId', { phaseId })
        .execute();
    }

    await this.phaseRepository.delete({ id: phaseId });
  }

  async getPhaseTasks(
    phaseId: string,
    filters: PhaseTaskFilters,
  ): Promise<{
    phaseId: string;
    filters: PhaseTaskFilters;
    data: TaskResponseDto[];
  }> {
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId },
    });

    if (!phase) {
      throw new NotFoundException(`Phase ${phaseId} not found`);
    }

    if (filters.status) {
      this.ensureStatusesValid(filters.status);
      filters.status.forEach((status) => {
        if (!phase.statuses.includes(status)) {
          throw new BadRequestException(
            `Status ${status} is not allowed for phase ${phase.name}`,
          );
        }
      });
    }

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .where('task.phase_id = :phaseId', { phaseId });

    if (filters.status && filters.status.length > 0) {
      qb.andWhere('task.status IN (:...status)', {
        status: filters.status,
      });
    }

    if (filters.dateFrom) {
      qb.andWhere('task.due_date >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      qb.andWhere('task.due_date <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    if (filters.search) {
      qb.andWhere(
        '(task.task LIKE :search OR task.task_id LIKE :search OR task.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const tasks = await qb
      .orderBy(this.buildStatusOrderExpression(phase.statuses), 'ASC')
      .addOrderBy('task.order_index', 'ASC')
      .getMany();

    return {
      phaseId,
      filters,
      data: tasks.map((task) => this.mapTaskToResponseDto(task)),
    };
  }

  async createTask(dto: CreateTaskDto): Promise<TaskResponseDto> {
    this.logger.log(`createTask - Starting task creation`);
    this.logger.debug(`createTask - DTO: ${JSON.stringify(dto, null, 2)}`);

    try {
      // Generate taskId if not provided
      let taskId = dto.taskId;
      if (!taskId) {
        taskId = this.generateTaskId();
        this.logger.log(`createTask - Auto-generated taskId: ${taskId}`);
      } else {
        this.logger.debug(`createTask - Using provided taskId: ${taskId}`);
      }

      // Validate status
      this.logger.debug(`createTask - Validating status: ${dto.status}`);
      this.ensureStatusesValid([dto.status]);

      // Check if taskId already exists and generate unique one if needed
      this.logger.debug(`createTask - Checking if taskId exists: ${taskId}`);
      
      // If taskId was provided by user, check if it exists and throw error if it does
      if (dto.taskId) {
        const existingTaskId = await this.taskRepository.findOne({
          where: { taskId },
        });
        if (existingTaskId) {
          this.logger.warn(`createTask - Task with taskId ${taskId} already exists`);
          throw new BadRequestException(
            `Task with taskId ${taskId} already exists`,
          );
        }
      } else {
        // If taskId was auto-generated, ensure it's unique
        let retries = 0;
        let existingTask = await this.taskRepository.findOne({
          where: { taskId },
        });
        
        while (existingTask && retries < 10) {
          this.logger.warn(
            `createTask - Generated taskId ${taskId} already exists, generating new one (retry ${retries + 1}/10)`,
          );
          taskId = this.generateTaskId();
          existingTask = await this.taskRepository.findOne({
            where: { taskId },
          });
          retries++;
        }
        
        if (existingTask) {
          this.logger.error(
            `createTask - Unable to generate unique taskId after ${retries} retries`,
          );
          throw new BadRequestException(
            'Unable to generate unique taskId. Please try again.',
          );
        }
        
        if (retries > 0) {
          this.logger.log(
            `createTask - Generated unique taskId after ${retries} retries: ${taskId}`,
          );
        }
      }

      // Find phase
      this.logger.debug(`createTask - Finding phase: ${dto.phaseId}`);
      const phase = await this.findPhaseOrThrow(dto.phaseId);
      this.logger.log(`createTask - Phase found: ${phase.name} (${phase.id})`);

      // Validate status is allowed in phase
      this.logger.debug(`createTask - Validating status ${dto.status} is allowed in phase`);
      this.ensureStatusInPhase(dto.status, phase);

      // Parse due date
      const dueDate = this.parseDate(dto.dueDate);
      if (dueDate) {
        this.logger.debug(`createTask - Due date parsed: ${dueDate.toISOString()}`);
      }

      // Get order
      const order =
        dto.order ?? (await this.getNextTaskOrder(phase.id, dto.status));
      this.logger.debug(`createTask - Task order: ${order}`);

      // Shift task orders
      this.logger.debug(`createTask - Shifting task orders for phase ${phase.id}, status ${dto.status}, order ${order}`);
      await this.shiftTaskOrders(phase.id, dto.status, order);

      // Resolve assignee profile
      this.logger.debug(`createTask - Resolving assignee: ${dto.assignee || 'none'}`);
      const assigneeProfile = resolveAssigneeProfile(dto.assignee ?? undefined);
      if (assigneeProfile) {
        this.logger.debug(`createTask - Assignee resolved: ${assigneeProfile.name} (${assigneeProfile.id})`);
      }

      // Create task entity
      this.logger.debug(`createTask - Creating task entity with taskId: ${taskId}`);
      const task = this.taskRepository.create({
        taskId,
        task: dto.task,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate,
        order,
        comments: dto.comments ?? 0,
        views: dto.views ?? 0,
        phase,
        assigneeId: assigneeProfile?.id,
        assigneeName: assigneeProfile?.name,
        assigneeAvatar: assigneeProfile?.avatar,
        assigneeRole: assigneeProfile?.role,
        updatedBy: dto.updatedBy,
      });

      // Save task
      this.logger.debug(`createTask - Saving task to database`);
      const saved = await this.taskRepository.save(task);
      this.logger.log(`createTask - Task created successfully with ID: ${saved.id}, taskId: ${saved.taskId}`);

      const response = this.mapTaskToResponseDto(saved);
      this.logger.debug(`createTask - Task response mapped: ${JSON.stringify(response, null, 2)}`);
      
      return response;
    } catch (error) {
      this.logger.error(`createTask - Error creating task: ${error.message}`, error.stack);
      this.logger.error(`createTask - DTO that caused error: ${JSON.stringify(dto, null, 2)}`);
      throw error;
    }
  }

  async updateTask(
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.findTaskByTaskIdOrThrow(taskId);

    let phase = task.phase;
    if (dto.phaseId && dto.phaseId !== task.phaseId) {
      phase = await this.findPhaseOrThrow(dto.phaseId);
    }

    const status = dto.status ?? task.status;
    this.ensureStatusesValid([status]);
    this.ensureStatusInPhase(status, phase);

    const shouldMovePhase = phase.id !== task.phaseId;
    const shouldMoveStatus = status !== task.status;
    const orderChanged = dto.order !== undefined && dto.order !== task.order;

    if (shouldMovePhase || shouldMoveStatus || orderChanged) {
      const destinationPhaseId = phase.id;
      const destinationOrder =
        dto.order ?? (await this.getNextTaskOrder(destinationPhaseId, status));
      await this.shiftTaskOrders(
        destinationPhaseId,
        status,
        destinationOrder,
        task.id,
      );
      task.order = destinationOrder;
    }

    task.phase = phase;
    task.status = status;

    if (dto.task) {
      task.task = dto.task;
    }
    if (dto.description !== undefined) {
      task.description = dto.description;
    }
    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }
    if (dto.comments !== undefined) {
      task.comments = dto.comments;
    }
    if (dto.views !== undefined) {
      task.views = dto.views;
    }
    if (dto.updatedBy !== undefined) {
      task.updatedBy = dto.updatedBy;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = this.parseDate(dto.dueDate);
    }
    if (dto.assignee !== undefined) {
      if (dto.assignee === null || dto.assignee === '') {
        task.assigneeId = undefined;
        task.assigneeName = undefined;
        task.assigneeAvatar = undefined;
        task.assigneeRole = undefined;
      } else {
        const assigneeProfile = resolveAssigneeProfile(dto.assignee);
        task.assigneeId = assigneeProfile?.id;
        task.assigneeName = assigneeProfile?.name;
        task.assigneeAvatar = assigneeProfile?.avatar;
        task.assigneeRole = assigneeProfile?.role;
      }
    }

    const saved = await this.taskRepository.save(task);
    return this.mapTaskToResponseDto(saved);
  }

  async deleteTask(identifier: string): Promise<void> {
    this.logger.debug(`deleteTask - Deleting task with identifier: ${identifier}`);
    
    // Check if it's a UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

    let result;

    if (isUuid) {
      // Try to delete by UUID id first
      this.logger.debug(`deleteTask - Attempting to delete by UUID id: ${identifier}`);
      result = await this.taskRepository.delete({ id: identifier });
    } else {
      // Try to delete by taskId
      this.logger.debug(`deleteTask - Attempting to delete by taskId: ${identifier}`);
      result = await this.taskRepository.delete({ taskId: identifier });
    }

    // If not found, try the other method
    if (result.affected === 0 && isUuid) {
      this.logger.debug(`deleteTask - Not found by UUID, trying taskId: ${identifier}`);
      result = await this.taskRepository.delete({ taskId: identifier });
    } else if (result.affected === 0 && !isUuid) {
      this.logger.debug(`deleteTask - Not found by taskId, trying UUID: ${identifier}`);
      result = await this.taskRepository.delete({ id: identifier });
    }

    if (result.affected === 0) {
      this.logger.warn(`deleteTask - Task not found with identifier: ${identifier}`);
      throw new NotFoundException(`Task ${identifier} not found`);
    }

    this.logger.log(`deleteTask - Task deleted successfully: ${identifier}`);
  }

  async updateTaskPosition(
    taskId: string,
    dto: TaskPositionDto,
  ): Promise<TaskResponseDto> {
    this.logger.debug(`updateTaskPosition - Finding task with identifier: ${taskId}`);
    const task = await this.findTaskByTaskIdOrThrow(taskId);
    this.logger.debug(`updateTaskPosition - Task found: ${task.id} (taskId: ${task.taskId})`);
    const phase = await this.findPhaseOrThrow(dto.phaseId);
    this.ensureStatusesValid([dto.status]);
    this.ensureStatusInPhase(dto.status, phase);

    await this.shiftTaskOrders(phase.id, dto.status, dto.order, task.id);

    task.phase = phase;
    task.status = dto.status;
    task.order = dto.order;
    if (dto.updatedBy) {
      task.updatedBy = dto.updatedBy;
    }

    const saved = await this.taskRepository.save(task);
    return this.mapTaskToResponseDto(saved);
  }

  getStatusReference() {
    return TASK_STATUS_REFERENCE;
  }

  private async getPhaseTaskCountMap(): Promise<Map<string, number>> {
    const countsRaw = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.phase_id', 'phaseId')
      .addSelect('COUNT(task.id)', 'count')
      .groupBy('task.phase_id')
      .getRawMany<{ phaseId: string; count: string }>();

    return new Map(
      countsRaw.map((row) => [row.phaseId, parseInt(row.count, 10)]),
    );
  }

  private sortTasksByStatusAndOrder(
    tasks: TaskEntity[],
    statuses: TaskStatus[],
  ): TaskEntity[] {
    const statusOrderMap = new Map<TaskStatus, number>();
    statuses.forEach((status, index) => statusOrderMap.set(status, index));

    return [...tasks].sort((a, b) => {
      const statusWeightA =
        statusOrderMap.get(a.status) ?? Number.MAX_SAFE_INTEGER;
      const statusWeightB =
        statusOrderMap.get(b.status) ?? Number.MAX_SAFE_INTEGER;

      if (statusWeightA === statusWeightB) {
        return a.order - b.order;
      }

      return statusWeightA - statusWeightB;
    });
  }

  private mapPhaseToResponseDto(
    phase: TaskPhaseEntity,
    tasks?: TaskEntity[],
    taskCount?: number,
  ): PhaseResponseDto {
    return {
      id: phase.id,
      name: phase.name,
      color: phase.color,
      description: phase.description,
      order: phase.order,
      statuses: phase.statuses,
      taskCount: taskCount ?? tasks?.length ?? 0,
      createdAt: phase.createdAt,
      updatedAt: phase.updatedAt,
      tasks: tasks
        ? tasks.map((task) => this.mapTaskToResponseDto(task, phase.id))
        : undefined,
    };
  }

  private mapTaskToResponseDto(
    task: TaskEntity,
    phaseOverrideId?: string,
  ): TaskResponseDto {
    const fallbackProfile = resolveAssigneeProfile(task.assigneeId);
    const hasStoredProfileData = !!(
      task.assigneeId ||
      task.assigneeName ||
      task.assigneeAvatar ||
      task.assigneeRole
    );

    const profile = hasStoredProfileData
      ? {
          id: task.assigneeId ?? fallbackProfile?.id ?? '',
          name: task.assigneeName ?? fallbackProfile?.name ?? '',
          avatar: task.assigneeAvatar ?? fallbackProfile?.avatar,
          role: task.assigneeRole ?? fallbackProfile?.role,
        }
      : fallbackProfile;

    const phaseId = phaseOverrideId ?? task.phaseId ?? task.phase?.id ?? '';

    return {
      id: task.id,
      taskId: task.taskId,
      phaseId,
      status: task.status,
      order: task.order,
      task: task.task,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: profile,
      comments: task.comments,
      views: task.views,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      updatedBy: task.updatedBy,
    };
  }

  private ensureStatusesValid(statuses?: TaskStatus[]) {
    if (!statuses || statuses.length === 0) {
      throw new BadRequestException('At least one status is required');
    }

    statuses.forEach((status) => {
      if (!TASK_STATUS_IDS.has(status)) {
        throw new BadRequestException(`Unsupported status: ${status}`);
      }
    });
  }

  private ensureStatusInPhase(status: TaskStatus, phase: TaskPhaseEntity) {
    if (!phase.statuses.includes(status)) {
      throw new BadRequestException(
        `Status ${status} is not allowed in phase ${phase.name}`,
      );
    }
  }

  private async findPhaseOrThrow(id: string): Promise<TaskPhaseEntity> {
    const phase = await this.phaseRepository.findOne({
      where: { id },
    });
    if (!phase) {
      throw new NotFoundException(`Phase ${id} not found`);
    }
    return phase;
  }

  /**
   * Find task by either UUID id or taskId string
   * Tries UUID first, then falls back to taskId field
   */
  private async findTaskByTaskIdOrThrow(identifier: string): Promise<TaskEntity> {
    // Check if it's a UUID format (contains hyphens and is 36 chars)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

    let task: TaskEntity | null = null;

    if (isUuid) {
      // Try to find by UUID id first
      this.logger.debug(`findTaskByTaskIdOrThrow - Searching by UUID id: ${identifier}`);
      task = await this.taskRepository.findOne({
        where: { id: identifier },
        relations: ['phase'],
      });
    }

    // If not found by UUID or not a UUID, try by taskId
    if (!task) {
      this.logger.debug(
        `findTaskByTaskIdOrThrow - Searching by taskId: ${identifier}`,
      );
      task = await this.taskRepository.findOne({
        where: { taskId: identifier },
        relations: ['phase'],
      });
    }

    if (!task) {
      this.logger.warn(
        `findTaskByTaskIdOrThrow - Task not found with identifier: ${identifier}`,
      );
      throw new NotFoundException(`Task ${identifier} not found`);
    }

    this.logger.debug(
      `findTaskByTaskIdOrThrow - Task found: ${task.id} (taskId: ${task.taskId})`,
    );
    return task;
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date value "${value}"`);
    }
    return parsed;
  }

  /**
   * Generate a unique taskId in format: TASK-{timestamp}-{randomString}
   */
  private generateTaskId(): string {
    const timestamp = Date.now();
    const randomString = Math.random()
      .toString(36)
      .substring(2, 11)
      .toUpperCase();
    return `TASK-${timestamp}-${randomString}`;
  }

  private async getNextPhaseOrder(): Promise<number> {
    const result = await this.phaseRepository
      .createQueryBuilder('phase')
      .select('MAX(phase.order_index)', 'max')
      .getRawOne<{ max: string | null }>();
    const currentMax =
      result?.max !== null && result?.max !== undefined
        ? Number(result.max)
        : -1;
    return currentMax + 1;
  }

  private async shiftPhaseOrders(newOrder: number, excludePhaseId: string) {
    await this.phaseRepository
      .createQueryBuilder()
      .update(TaskPhaseEntity)
      .set({ order: () => '`order_index` + 1' })
      .where('order_index >= :newOrder', { newOrder })
      .andWhere('id != :excludePhaseId', { excludePhaseId })
      .execute();
  }

  private async getNextTaskOrder(
    phaseId: string,
    status: TaskStatus,
  ): Promise<number> {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .select('MAX(task.order_index)', 'max')
      .where('task.phase_id = :phaseId', { phaseId })
      .andWhere('task.status = :status', { status })
      .getRawOne<{ max: string | null }>();
    const currentMax =
      result?.max !== null && result?.max !== undefined
        ? Number(result.max)
        : -1;
    return currentMax + 1;
  }

  private async shiftTaskOrders(
    phaseId: string,
    status: TaskStatus,
    startingOrder: number,
    excludeTaskId?: string,
  ) {
    const qb = this.taskRepository
      .createQueryBuilder()
      .update(TaskEntity)
      .set({ order: () => '`order_index` + 1' })
      .where('phase_id = :phaseId', { phaseId })
      .andWhere('status = :status', { status })
      .andWhere('order_index >= :startingOrder', { startingOrder });

    if (excludeTaskId) {
      qb.andWhere('task_id != :excludeTaskId', { excludeTaskId });
    }

    await qb.execute();
  }

  private buildStatusOrderExpression(statuses: TaskStatus[]) {
    const orderedStatuses = statuses.map((status) => `'${status}'`).join(', ');
    return `FIELD(task.status, ${orderedStatuses})`;
  }

  private async ensurePhaseCanAcceptTasks(
    targetPhase: TaskPhaseEntity,
    sourcePhaseId: string,
  ) {
    const distinctStatuses = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .where('task.phase_id = :phaseId', { phaseId: sourcePhaseId })
      .groupBy('task.status')
      .getRawMany<{ status: TaskStatus }>();

    const mismatched = distinctStatuses.filter(
      (row) => !targetPhase.statuses.includes(row.status),
    );

    if (mismatched.length > 0) {
      throw new BadRequestException(
        `Target phase ${targetPhase.name} does not allow statuses: ${mismatched
          .map((row) => row.status)
          .join(', ')}`,
      );
    }
  }
}
