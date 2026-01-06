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
import { TaskCommentEntity } from './entities/task-comment.entity';
import { TaskMovementHistoryEntity } from './entities/task-movement-history.entity';
import { TaskStatus } from '../../common/enums/task.enum';
import {
  TASK_STATUS_IDS,
  TASK_STATUS_REFERENCE,
} from './constants/task-status.reference';
import { resolveAssigneeProfile } from './reference/task-assignees.reference';
import { User } from '../users/user.entity';
import { CostingEntity } from '../costing/entities/costing.entity';
import {
  CreateTaskCommentDto,
  TaskCommentResponseDto,
  MoveTaskDto,
  TaskMovementHistoryResponseDto,
} from '../../common/interfaces/task.interface';
import { TaskDetailResponseDto } from '../../common/interfaces/task-detail.interface';
import { CostingService } from '../costing/costing.service';
import { RecipesService } from '../recipes/recipes.service';
import { RecipeExecutionService } from './recipe-execution.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(TaskPhaseEntity)
    private readonly phaseRepository: Repository<TaskPhaseEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(TaskCommentEntity)
    private readonly commentRepository: Repository<TaskCommentEntity>,
    @InjectRepository(TaskMovementHistoryEntity)
    private readonly movementHistoryRepository: Repository<TaskMovementHistoryEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CostingEntity)
    private readonly costingRepository: Repository<CostingEntity>,
    private readonly costingService: CostingService,
    private readonly recipesService: RecipesService,
    private readonly recipeExecutionService: RecipeExecutionService,
  ) {
    this.logger.log('TasksService initialized');
  }

  async listPhases(includeTasks = false, currentUser?: any): Promise<PhaseResponseDto[]> {
    this.logger.log(`listPhases - includeTasks: ${includeTasks}, User: ${currentUser?.userId || 'N/A'}`);
    
    const phases = await this.phaseRepository.find({
      order: { order: 'ASC', createdAt: 'ASC' },
      relations: includeTasks
        ? [
            'tasks',
            'tasks.assignedUser',
            'tasks.costing',
          ]
        : [],
    });

    // Apply role-based filtering to tasks if includeTasks is true
    if (includeTasks) {
      const canViewAllTasks = this.canUserViewAllTasks(currentUser);
      const userId = currentUser?.userId || currentUser?.sub;

      this.logger.log(`listPhases - Can view all tasks: ${canViewAllTasks}, User ID: ${userId || 'N/A'}`);

      phases.forEach((phase) => {
        if (phase.tasks && phase.tasks.length > 0) {
          if (!canViewAllTasks && userId) {
            // Filter tasks to only show those assigned to the current user
            phase.tasks = phase.tasks.filter(
              (task) => task.assignedUserId === userId,
            );
            this.logger.log(`listPhases - Filtered tasks for phase ${phase.id}: ${phase.tasks.length} tasks`);
          } else if (canViewAllTasks) {
            // Show all tasks for Super Admin, Admin, or Manager
            this.logger.log(`listPhases - Showing all tasks for phase ${phase.id}: ${phase.tasks.length} tasks`);
          }
        }
      });
    }

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
    currentUser?: any,
  ): Promise<{
    phaseId: string;
    filters: PhaseTaskFilters;
    data: TaskResponseDto[];
  }> {
    this.logger.log(`getPhaseTasks - Starting for phase: ${phaseId}`);
    
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

    // Check if user can view all tasks (Super Admin, Admin, or Manager)
    const canViewAllTasks = this.canUserViewAllTasks(currentUser);
    const userId = currentUser?.userId || currentUser?.sub;

    this.logger.log(`getPhaseTasks - User ID: ${userId || 'N/A'}, Role: ${currentUser?.role || 'N/A'}, Can view all tasks: ${canViewAllTasks}`);

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .where('task.phase_id = :phaseId', { phaseId });

    // Apply role-based filtering
    if (!canViewAllTasks && userId) {
      // Staff or other users: only show tasks assigned to them
      this.logger.log(`getPhaseTasks - Filtering tasks for user: ${userId}`);
      qb.andWhere('task.assigned_user_id = :userId', { userId });
    } else if (canViewAllTasks) {
      // Super Admin, Admin, or Manager: show all tasks (no additional filter)
      this.logger.log(`getPhaseTasks - User has elevated role, showing all tasks`);
    } else {
      // No user info or no userId: show all tasks (fallback for backward compatibility)
      this.logger.warn(`getPhaseTasks - No user info provided, showing all tasks (fallback)`);
    }

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
      .leftJoinAndSelect('task.assignedUser', 'assignedUser')
      .leftJoinAndSelect('task.costing', 'costing')
      .orderBy(this.buildStatusOrderExpression(phase.statuses), 'ASC')
      .addOrderBy('task.order_index', 'ASC')
      .getMany();

    this.logger.log(`getPhaseTasks - Found ${tasks.length} tasks for phase ${phaseId}`);

    return {
      phaseId,
      filters,
      data: tasks.map((task) => this.mapTaskToResponseDto(task)),
    };
  }

  /**
   * Check if user can view all tasks (Super Admin, Admin, or Manager)
   * @param currentUser - Current user object from JWT token
   * @returns true if user can view all tasks, false otherwise
   */
  private canUserViewAllTasks(currentUser?: any): boolean {
    if (!currentUser) {
      return false;
    }

    // Get role from user object (can be from 'role' or 'roles' array)
    const userRole = currentUser.role || (currentUser.roles && currentUser.roles[0]) || '';
    const normalizedRole = typeof userRole === 'string' ? userRole.toLowerCase() : '';

    this.logger.log(`canUserViewAllTasks - Checking role: ${normalizedRole}`);

    // Check if role is Super Admin, Admin, or Manager
    const elevatedRoles = ['super_admin', 'admin', 'manager'];
    const canViewAll = elevatedRoles.includes(normalizedRole);

    this.logger.log(`canUserViewAllTasks - Role ${normalizedRole} can view all tasks: ${canViewAll}`);

    return canViewAll;
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

      // Validate and load assigned user if provided
      let assignedUser: User | undefined;
      if (dto.assignedUserId) {
        this.logger.debug(`createTask - Validating assigned user: ${dto.assignedUserId}`);
        const user = await this.userRepository.findOne({
          where: { id: dto.assignedUserId },
        });
        if (!user) {
          throw new NotFoundException(`User with ID ${dto.assignedUserId} not found`);
        }
        if (!user.isActive) {
          throw new BadRequestException(`User ${dto.assignedUserId} is not active`);
        }
        assignedUser = user;
        this.logger.debug(`createTask - Assigned user validated: ${assignedUser.userName} (${assignedUser.id})`);
      }

      // Validate and load costing if provided
      let costing: CostingEntity | undefined;
      if (dto.costingId) {
        this.logger.debug(`createTask - Validating costing: ${dto.costingId}`);
        const costingEntity = await this.costingRepository.findOne({
          where: { id: dto.costingId },
        });
        if (!costingEntity) {
          throw new NotFoundException(`Costing with ID ${dto.costingId} not found`);
        }
        if (!costingEntity.isActive) {
          throw new BadRequestException(`Costing ${dto.costingId} is not active`);
        }
        costing = costingEntity;
        this.logger.debug(`createTask - Costing validated: ${costing.itemName} (${costing.id})`);
      }

      // Resolve assignee profile (legacy support)
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
        assignedUser,
        assignedUserId: assignedUser?.id,
        costing,
        costingId: costing?.id,
        batchSize: dto.batchSize,
        rawMaterials: dto.rawMaterials,
        // Legacy assignee fields (populated from User if assignedUserId provided, otherwise from assignee profile)
        assigneeId: assignedUser?.id || assigneeProfile?.id,
        assigneeName: assignedUser?.userName || assigneeProfile?.name,
        assigneeRole: assignedUser?.role?.code || assigneeProfile?.role,
        updatedBy: dto.updatedBy,
      });

      // Save task
      this.logger.debug(`createTask - Saving task to database`);
      const saved = await this.taskRepository.save(task);
      this.logger.log(`createTask - Task created successfully with ID: ${saved.id}, taskId: ${saved.taskId}`);

      // Auto-bind recipe execution if task has a costing
      if (saved.costingId) {
        try {
          this.logger.debug(`createTask - Auto-binding recipe for task ${saved.taskId}`);
          await this.recipeExecutionService.findOrCreateExecution(saved.taskId);
          this.logger.log(`createTask - Recipe execution auto-bound for task ${saved.taskId}`);
        } catch (error: any) {
          // Log warning but don't fail task creation if recipe binding fails
          this.logger.warn(
            `createTask - Failed to auto-bind recipe for task ${saved.taskId}: ${error.message}`,
          );
        }
      }

      // Reload task with relations for response
      const taskWithRelations = await this.taskRepository.findOne({
        where: { id: saved.id },
        relations: ['phase', 'assignedUser', 'costing', 'recipeExecution'],
      });

      const response = this.mapTaskToResponseDto(taskWithRelations!);
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
    // Handle assigned user update
    if (dto.assignedUserId !== undefined) {
      if (dto.assignedUserId === null || dto.assignedUserId === '') {
        task.assignedUser = undefined;
        task.assignedUserId = undefined;
        task.assigneeId = undefined;
        task.assigneeName = undefined;
        task.assigneeRole = undefined;
      } else {
        const assignedUser = await this.userRepository.findOne({
          where: { id: dto.assignedUserId },
        });
        if (!assignedUser) {
          throw new NotFoundException(`User with ID ${dto.assignedUserId} not found`);
        }
        if (!assignedUser.isActive) {
          throw new BadRequestException(`User ${dto.assignedUserId} is not active`);
        }
        task.assignedUser = assignedUser;
        task.assignedUserId = assignedUser.id;
        task.assigneeId = assignedUser.id;
        task.assigneeName = assignedUser.userName;
        task.assigneeRole = assignedUser.role?.code;
      }
    }

    // Handle costing update
    if (dto.costingId !== undefined) {
      if (dto.costingId === null || dto.costingId === '') {
        task.costing = undefined;
        task.costingId = undefined;
      } else {
        const costing = await this.costingRepository.findOne({
          where: { id: dto.costingId },
        });
        if (!costing) {
          throw new NotFoundException(`Costing with ID ${dto.costingId} not found`);
        }
        if (!costing.isActive) {
          throw new BadRequestException(`Costing ${dto.costingId} is not active`);
        }
        task.costing = costing;
        task.costingId = costing.id;
      }
    }

    // Handle legacy assignee (for backward compatibility)
    if (dto.assignee !== undefined) {
      if (dto.assignee === null || dto.assignee === '') {
        // Only clear if assignedUserId is not set
        if (!dto.assignedUserId) {
          task.assigneeId = undefined;
          task.assigneeName = undefined;
          task.assigneeRole = undefined;
        }
      } else {
        const assigneeProfile = resolveAssigneeProfile(dto.assignee);
        // Only update legacy fields if assignedUserId is not set
        if (!dto.assignedUserId) {
          task.assigneeId = assigneeProfile?.id;
          task.assigneeName = assigneeProfile?.name;
          task.assigneeRole = assigneeProfile?.role;
        }
      }
    }

    const saved = await this.taskRepository.save(task);
    
    // Reload task with relations for response
    const taskWithRelations = await this.taskRepository.findOne({
      where: { id: saved.id },
      relations: ['phase', 'assignedUser', 'costing'],
    });
    
    return this.mapTaskToResponseDto(taskWithRelations!);
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

  // ========== COMMENT OPERATIONS ==========

  /**
   * Add a comment to a task
   */
  async addComment(
    taskId: string,
    createCommentDto: CreateTaskCommentDto,
  ): Promise<TaskCommentResponseDto> {
    this.logger.log(`addComment - Adding comment to task: ${taskId}`);

    // Find task - use task.id for the comment relation
    const task = await this.findTaskByTaskIdOrThrow(taskId);

    // Validate and load owner if ownerId is provided
    let owner: User | undefined;
    if (createCommentDto.ownerId) {
      const foundUser = await this.userRepository.findOne({
        where: { id: createCommentDto.ownerId },
      });
      if (!foundUser) {
        throw new NotFoundException(
          `User with ID ${createCommentDto.ownerId} not found`,
        );
      }
      owner = foundUser;
    }

    // Create comment - use task.id (UUID) for taskId
    const comment = this.commentRepository.create({
      taskId: task.id,
      task,
      comment: createCommentDto.comment,
      owner,
      ownerId: owner?.id,
      ownerName: owner?.userName || createCommentDto.ownerName,
      ownerEmail: owner?.email || createCommentDto.ownerEmail,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Update task comment count
    const commentCount = await this.commentRepository.count({
      where: { taskId: task.id },
    });
    await this.taskRepository.update(task.id, { comments: commentCount });

    this.logger.log(
      `addComment - Comment added successfully: ${savedComment.id}`,
    );

    // Reload comment with owner relation
    const commentWithOwner = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['owner'],
    });

    return this.mapCommentToResponseDto(commentWithOwner!);
  }

  /**
   * Get all comments for a task
   */
  async getTaskComments(taskId: string): Promise<TaskCommentResponseDto[]> {
    this.logger.log(`getTaskComments - Getting comments for task: ${taskId}`);

    // Verify task exists and get its UUID
    const task = await this.findTaskByTaskIdOrThrow(taskId);

    const comments = await this.commentRepository.find({
      where: { taskId: task.id },
      relations: ['owner'],
      order: { commentedDate: 'DESC' },
    });

    return comments.map((comment) => this.mapCommentToResponseDto(comment));
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    this.logger.log(`deleteComment - Deleting comment: ${commentId}`);

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['task'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    const taskId = comment.taskId;

    await this.commentRepository.remove(comment);

    // Update task comment count
    const commentCount = await this.commentRepository.count({
      where: { taskId },
    });
    await this.taskRepository.update(taskId, { comments: commentCount });

    this.logger.log(`deleteComment - Comment deleted successfully: ${commentId}`);
  }

  /**
   * Map comment entity to response DTO
   */
  private mapCommentToResponseDto(
    comment: TaskCommentEntity,
  ): TaskCommentResponseDto {
    return {
      id: comment.id,
      taskId: comment.taskId,
      comment: comment.comment,
      ownerId: comment.ownerId,
      owner: comment.owner
        ? {
            id: comment.owner.id,
            userName: comment.owner.userName,
            email: comment.owner.email,
          }
        : undefined,
      ownerName: comment.ownerName,
      ownerEmail: comment.ownerEmail,
      commentedDate: comment.commentedDate,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  // ========== TASK MOVEMENT OPERATIONS ==========

  /**
   * Move a task from one phase to another
   * This creates a history record and updates the task
   */
  async moveTaskToPhase(
    taskId: string,
    moveTaskDto: MoveTaskDto,
  ): Promise<TaskResponseDto> {
    this.logger.log(`moveTaskToPhase - Moving task ${taskId} to phase ${moveTaskDto.toPhaseId}`);

    // Find the task with current phase
    const task = await this.findTaskByTaskIdOrThrow(taskId);
    const fromPhaseId = task.phaseId;
    const fromStatus = task.status;

    // Validate target phase exists
    const toPhase = await this.findPhaseOrThrow(moveTaskDto.toPhaseId);

    if (fromPhaseId === moveTaskDto.toPhaseId) {
      throw new BadRequestException(
        `Task is already in phase ${toPhase.name}. Cannot move to the same phase.`,
      );
    }

    // Determine target status - use provided status or default to first status of target phase
    const toStatus = moveTaskDto.toStatus || toPhase.statuses[0];
    this.ensureStatusesValid([toStatus]);
    this.ensureStatusInPhase(toStatus, toPhase);

    // Determine target order - use provided order or calculate next available
    const targetOrder =
      moveTaskDto.order ?? (await this.getNextTaskOrder(moveTaskDto.toPhaseId, toStatus));

    // Get user who initiated the movement (if provided)
    let movedByUser: User | undefined;
    let movedByName: string | undefined;

    if (moveTaskDto.movedBy) {
      // Check if it's a UUID (user ID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        moveTaskDto.movedBy,
      );

      if (isUUID) {
        const foundUser = await this.userRepository.findOne({
          where: { id: moveTaskDto.movedBy },
        });
        movedByUser = foundUser ?? undefined;
        movedByName = movedByUser?.userName;
      } else {
        movedByName = moveTaskDto.movedBy;
      }
    }

    // Shift task orders in target phase/status
    await this.shiftTaskOrders(moveTaskDto.toPhaseId, toStatus, targetOrder, task.id);

    // Create movement history record
    const movementHistory = this.movementHistoryRepository.create({
      taskId: task.id,
      task,
      fromPhaseId,
      fromPhase: task.phase,
      toPhaseId: moveTaskDto.toPhaseId,
      toPhase,
      fromStatus,
      toStatus,
      movedByUser,
      movedByUserId: movedByUser?.id,
      movedByName,
      reason: moveTaskDto.reason,
    });

    await this.movementHistoryRepository.save(movementHistory);
    this.logger.log(
      `moveTaskToPhase - Movement history created: ${movementHistory.id}`,
    );

    // Update task: change phase, status, and order
    task.phase = toPhase;
    task.phaseId = moveTaskDto.toPhaseId;
    task.status = toStatus;
    task.order = targetOrder;

    const savedTask = await this.taskRepository.save(task);

    this.logger.log(
      `moveTaskToPhase - Task ${taskId} moved from phase ${fromPhaseId} to phase ${moveTaskDto.toPhaseId}`,
    );

    // Reload task with all relations for response
    const taskWithRelations = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['phase', 'assignedUser', 'costing', 'commentList', 'commentList.owner'],
    });

    return this.mapTaskToResponseDto(taskWithRelations!);
  }

  /**
   * Get movement history for a task
   */
  async getTaskMovementHistory(
    taskId: string,
  ): Promise<TaskMovementHistoryResponseDto[]> {
    this.logger.log(`getTaskMovementHistory - Getting movement history for task ${taskId}`);

    // Verify task exists
    const task = await this.taskRepository.findOne({
      where: [{ id: taskId }, { taskId }],
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const movements = await this.movementHistoryRepository.find({
      where: { taskId: task.id },
      relations: ['fromPhase', 'toPhase', 'movedByUser'],
      order: { movedAt: 'DESC' },
    });

    return movements.map((movement) => this.mapMovementHistoryToResponseDto(movement));
  }

  /**
   * Map movement history entity to response DTO
   */
  private mapMovementHistoryToResponseDto(
    movement: TaskMovementHistoryEntity,
  ): TaskMovementHistoryResponseDto {
    return {
      id: movement.id,
      taskId: movement.taskId,
      fromPhaseId: movement.fromPhaseId,
      fromPhaseName: movement.fromPhase?.name,
      toPhaseId: movement.toPhaseId,
      toPhaseName: movement.toPhase?.name,
      fromStatus: movement.fromStatus,
      toStatus: movement.toStatus,
      movedByUserId: movement.movedByUserId,
      movedByName: movement.movedByName,
      movedByUser: movement.movedByUser
        ? {
            id: movement.movedByUser.id,
            userName: movement.movedByUser.userName,
            email: movement.movedByUser.email,
          }
        : undefined,
      reason: movement.reason,
      movedAt: movement.movedAt,
    };
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
    // Handle legacy assignee profile
    const fallbackProfile = resolveAssigneeProfile(task.assigneeId);
    const hasStoredProfileData = !!(
      task.assigneeId ||
      task.assigneeName ||
      task.assigneeRole
    );

    const profile = hasStoredProfileData
      ? {
          id: task.assigneeId ?? fallbackProfile?.id ?? '',
          name: task.assigneeName ?? fallbackProfile?.name ?? '',
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
      assignedUserId: task.assignedUserId,
      assignedUser: task.assignedUser
        ? {
            id: task.assignedUser.id,
            userName: task.assignedUser.userName,
            email: task.assignedUser.email,
          }
        : undefined,
      costingId: task.costingId,
      costing: task.costing
        ? {
            id: task.costing.id,
            itemName: task.costing.itemName,
            itemCode: task.costing.itemCode,
            version: task.costing.version,
            isActive: task.costing.isActive,
          }
        : undefined,
      batchSize: task.batchSize,
      rawMaterials: task.rawMaterials,
      comments: task.comments,
      commentList: task.commentList
        ? task.commentList
            .sort(
              (a, b) =>
                b.commentedDate.getTime() - a.commentedDate.getTime(),
            )
            .map((comment) => this.mapCommentToResponseDto(comment))
        : undefined,
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
        relations: ['phase', 'assignedUser', 'costing', 'commentList', 'commentList.owner', 'recipeExecution'],
      });
    }

    // If not found by UUID or not a UUID, try by taskId
    if (!task) {
      this.logger.debug(
        `findTaskByTaskIdOrThrow - Searching by taskId: ${identifier}`,
      );
      task = await this.taskRepository.findOne({
        where: { taskId: identifier },
        relations: ['phase', 'assignedUser', 'costing', 'commentList', 'commentList.owner', 'recipeExecution'],
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

  /**
   * Get detailed task information including comments, costing, and recipe
   */
  async getTaskDetails(taskId: string): Promise<TaskDetailResponseDto> {
    this.logger.log(`getTaskDetails - Fetching details for taskId: ${taskId}`);

    // Find task with all relations
    const task = await this.findTaskByTaskIdOrThrow(taskId);

    // Map task to response DTO
    const taskResponse = this.mapTaskToResponseDto(task);

    // Get comments
    const comments = (task.commentList || []).map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      comment: comment.comment,
      ownerId: comment.ownerId,
      owner: comment.owner
        ? {
            id: comment.owner.id,
            userName: comment.owner.userName,
            email: comment.owner.email,
          }
        : undefined,
      ownerName: comment.ownerName,
      ownerEmail: comment.ownerEmail,
      commentedDate: comment.commentedDate,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    let costedProduct: any = null;
    let recipe: any = null;

    // Get costing and product details if costingId exists
    if (task.costingId && task.costing) {
      try {
        // Get the itemId from the costing
        const itemId = task.costing.itemId;

        // Get costed product details
        const costedProductData = await this.costingService.getCostedProducts(
          1,
          1,
          undefined,
          undefined,
          itemId,
        );

        if (costedProductData && !('data' in costedProductData)) {
          costedProduct = costedProductData;

          // Get active recipe for this product
          if (costedProduct && costedProduct.itemId) {
            try {
              // Get all active recipes for this product
              const activeRecipes = await this.recipesService.findAll({
                productId: costedProduct.itemId,
                status: 'active' as any,
                includeVersions: 'false',
                page: 1,
                limit: 100,
              });

              // Find the recipe with isActiveVersion = true (selected version)
              if (activeRecipes.data && activeRecipes.data.length > 0) {
                const selectedRecipe = activeRecipes.data.find(
                  (r: any) => r.isActiveVersion === true,
                );
                if (selectedRecipe) {
                  // Get full recipe details
                  recipe = await this.recipesService.findOne(selectedRecipe.id, false);
                } else if (activeRecipes.data.length > 0) {
                  // If no active version, get the first one
                  recipe = await this.recipesService.findOne(activeRecipes.data[0].id, false);
                }
              }
            } catch (error: any) {
              this.logger.warn(
                `getTaskDetails - No recipe found for item ${costedProduct.itemId}: ${error.message}`,
              );
            }
          }
        }
      } catch (error: any) {
        this.logger.warn(
          `getTaskDetails - Error fetching costed product: ${error.message}`,
        );
      }
    }

    // Get recipe execution status if exists
    let recipeExecution: any = undefined;
    if (task.recipeExecutionId) {
      try {
        recipeExecution = await this.recipeExecutionService.getExecutionStatus(
          task.taskId,
        );
      } catch (error: any) {
        this.logger.warn(
          `getTaskDetails - Error fetching recipe execution: ${error.message}`,
        );
      }
    }

    return {
      task: taskResponse,
      comments,
      costedProduct: costedProduct || undefined,
      recipe: recipe || undefined,
      recipeExecution: recipeExecution || undefined,
    };
  }

  /**
   * Get enhanced task details with all related data for frontend
   * Returns data in the exact structure expected by frontend
   */
  async getTaskDetailsEnhanced(taskId: string): Promise<any> {
    this.logger.log(`getTaskDetailsEnhanced - Fetching enhanced details for taskId: ${taskId}`);

    // Find task with all relations
    const task = await this.findTaskByTaskIdOrThrow(taskId);

    // Map task to response DTO with all fields
    const taskResponse = this.mapTaskToResponseDto(task);

    // Get all phases
    const phases = await this.phaseRepository.find({
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    // Get comments
    const comments = (task.commentList || []).map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.ownerId,
      user: comment.owner
        ? {
            id: comment.owner.id,
            userName: comment.owner.userName,
            email: comment.owner.email,
            avatar: undefined, // Add if available
          }
        : undefined,
      content: comment.comment,
      createdAt: comment.commentedDate || comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    let costedProduct: any = null;
    let recipe: any = null;

    // Get costing and product details if costingId exists
    if (task.costingId && task.costing) {
      try {
        // Get the itemId from the costing
        const itemId = task.costing.itemId;

        // Get costed product details
        const costedProductData = await this.costingService.getCostedProducts(
          1,
          1,
          undefined,
          undefined,
          itemId,
        );

        if (costedProductData && !('data' in costedProductData)) {
          costedProduct = costedProductData;

          // Get active recipe for this product
          if (costedProduct && costedProduct.itemId) {
            try {
              // Get all active recipes for this product
              const activeRecipes = await this.recipesService.findAll({
                productId: costedProduct.itemId,
                status: 'active' as any,
                includeVersions: 'false',
                page: 1,
                limit: 100,
              });

              // Find the recipe with isActiveVersion = true (selected version)
              if (activeRecipes.data && activeRecipes.data.length > 0) {
                const selectedRecipe = activeRecipes.data.find(
                  (r: any) => r.isActiveVersion === true,
                );
                if (selectedRecipe) {
                  // Get full recipe details with versions
                  recipe = await this.recipesService.findOne(selectedRecipe.id, false);
                } else if (activeRecipes.data.length > 0) {
                  // If no active version, get the first one
                  recipe = await this.recipesService.findOne(activeRecipes.data[0].id, false);
                }
              }
            } catch (error: any) {
              this.logger.warn(
                `getTaskDetailsEnhanced - No recipe found for item ${costedProduct.itemId}: ${error.message}`,
              );
            }
          }
        }
      } catch (error: any) {
        this.logger.warn(
          `getTaskDetailsEnhanced - Error fetching costed product: ${error.message}`,
        );
      }
    }

    // Get recipe execution status if exists
    let recipeExecution: any = null;
    if (task.recipeExecutionId) {
      try {
        const executionStatus = await this.recipeExecutionService.getExecutionStatus(
          task.taskId,
        );
        
        // Get full recipe for recipeExecution.recipe
        const fullRecipe = executionStatus.recipe || recipe;
        
        // Format recipeExecution to match frontend expectations
        recipeExecution = {
          id: executionStatus.id,
          taskId: task.id,
          recipeId: fullRecipe?.id,
          status: executionStatus.status,
          currentStep: executionStatus.currentStep
            ? {
                stepOrder: executionStatus.currentStep.stepOrder,
                startedAt: executionStatus.currentStep.startedAt,
                progress: executionStatus.currentStep.progress,
                elapsedTime: executionStatus.currentStep.elapsedTime,
              }
            : null,
          overallProgress: executionStatus.overallProgress,
          elapsedTime: executionStatus.elapsedTime,
          startedAt: executionStatus.startedAt || null,
          pausedAt: executionStatus.pausedAt || null,
          resumedAt: executionStatus.resumedAt || null,
          completedAt: executionStatus.completedAt || null,
          cancelledAt: null,
          stepExecutions: executionStatus.stepExecutions.map((se) => ({
            id: se.id,
            stepOrder: se.stepOrder,
            status: se.status,
            startedAt: se.startedAt || null,
            completedAt: se.completedAt || null,
            progress: se.progress,
            elapsedTime: se.actualDuration || null,
            actualDuration: se.actualDuration || null,
            actualTemperature: se.actualTemperature || null,
            notes: se.notes || null,
          })),
          recipe: fullRecipe
            ? {
                id: fullRecipe.id,
                name: fullRecipe.name,
                steps: (fullRecipe.steps || [])
                  .sort((a, b) => a.order - b.order)
                  .map((step) => ({
                    id: step.id,
                    order: step.order,
                    instruction: step.instruction,
                    temperature: step.temperature,
                    duration: step.duration,
                  })),
                totalTime: fullRecipe.totalTime,
              }
            : null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      } catch (error: any) {
        this.logger.warn(
          `getTaskDetailsEnhanced - Error fetching recipe execution: ${error.message}`,
        );
      }
    } else if (recipe) {
      // If no execution but recipe exists, create a not_started execution object
      // with stepExecutions for all recipe steps (pending status)
      const sortedSteps = (recipe.steps || []).sort((a, b) => a.order - b.order);
      
      recipeExecution = {
        id: null,
        taskId: task.id,
        recipeId: recipe.id,
        status: 'not_started',
        currentStep: null,
        overallProgress: 0,
        elapsedTime: 0,
        startedAt: null,
        pausedAt: null,
        resumedAt: null,
        completedAt: null,
        cancelledAt: null,
        stepExecutions: sortedSteps.map((step) => ({
          id: null,
          stepOrder: step.order,
          status: 'pending',
          startedAt: null,
          completedAt: null,
          progress: 0,
          elapsedTime: null,
          actualDuration: null,
          actualTemperature: null,
          notes: null,
        })),
        recipe: {
          id: recipe.id,
          name: recipe.name,
          steps: sortedSteps.map((step) => ({
            id: step.id,
            order: step.order,
            instruction: step.instruction,
            temperature: step.temperature,
            duration: step.duration,
          })),
          totalTime: recipe.totalTime,
        },
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    }

    // Format recipe steps to be sorted by order
    if (recipe && recipe.steps) {
      recipe.steps = recipe.steps.sort((a, b) => a.order - b.order);
    }

    return {
      task: {
        ...taskResponse,
        commentList: [], // Empty array as per frontend expectation
      },
      recipe: recipe || null,
      costedProduct: costedProduct || null,
      recipeExecution: recipeExecution,
      comments: comments,
      phases: phases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || null,
        order: phase.order,
        createdAt: phase.createdAt,
        updatedAt: phase.updatedAt,
      })),
    };
  }
}
