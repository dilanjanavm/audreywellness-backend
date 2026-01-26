import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
  UseInterceptors,
  SetMetadata,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import * as taskInterface from '../../common/interfaces/task.interface';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { TaskStatus } from '../../common/enums/task.enum';

// Decorator to mark endpoints as public (skip authentication)
const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('tasks')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(TransformInterceptor)
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {
    this.logger.log('TasksController initialized');
  }

  @Get('phases')
  async listPhases(@Query('includeTasks') includeTasks?: string) {
    this.logger.log(`GET /tasks/phases - includeTasks: ${includeTasks}`);
    try {
      const data = await this.tasksService.listPhases(
        this.parseBoolean(includeTasks),
      );
      this.logger.log(
        `GET /tasks/phases - Success: ${data.length} phases found`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `GET /tasks/phases - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('phases')
  async createPhase(@Body() dto: taskInterface.CreatePhaseDto) {
    this.logger.log(
      `POST /tasks/phases - Request body: ${JSON.stringify(dto)}`,
    );
    try {
      const data = await this.tasksService.createPhase(dto);
      this.logger.log(
        `POST /tasks/phases - Success: Phase created with ID ${data.id}`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `POST /tasks/phases - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Put('phases/:phaseId')
  async updatePhase(
    @Param('phaseId') phaseId: string,
    @Body() dto: taskInterface.UpdatePhaseDto,
  ) {
    this.logger.log(
      `PUT /tasks/phases/${phaseId} - Request body: ${JSON.stringify(dto)}`,
    );
    try {
      const data = await this.tasksService.updatePhase(phaseId, dto);
      this.logger.log(`PUT /tasks/phases/${phaseId} - Success: Phase updated`);
      return { data };
    } catch (error) {
      this.logger.error(
        `PUT /tasks/phases/${phaseId} - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete('phases/:phaseId')
  async removePhase(
    @Param('phaseId') phaseId: string,
    @Query('reassignPhaseId') reassignPhaseId?: string,
  ) {
    this.logger.log(
      `DELETE /tasks/phases/${phaseId} - reassignPhaseId: ${reassignPhaseId}`,
    );
    try {
      await this.tasksService.removePhase(phaseId, reassignPhaseId);
      this.logger.log(
        `DELETE /tasks/phases/${phaseId} - Success: Phase deleted`,
      );
      return { data: null };
    } catch (error) {
      this.logger.error(
        `DELETE /tasks/phases/${phaseId} - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post()
  async createTask(@Body() dto: taskInterface.CreateTaskDto) {
    this.logger.log(`POST /tasks - Request received`);
    this.logger.debug(
      `POST /tasks - Request body: ${JSON.stringify(dto, null, 2)}`,
    );

    try {
      // Validate required fields
      // taskId is optional - will be auto-generated if not provided
      if (!dto.task) {
        this.logger.warn(`POST /tasks - Missing task in request body`);
        throw new BadRequestException('task is required');
      }
      if (!dto.phaseId) {
        this.logger.warn(`POST /tasks - Missing phaseId in request body`);
        throw new BadRequestException('phaseId is required');
      }
      if (!dto.status) {
        this.logger.warn(`POST /tasks - Missing status in request body`);
        throw new BadRequestException('status is required');
      }

      this.logger.log(
        `POST /tasks - Creating task with taskId: ${dto.taskId}, phaseId: ${dto.phaseId}, status: ${dto.status}`,
      );

      const data = await this.tasksService.createTask(dto);

      this.logger.log(
        `POST /tasks - Success: Task created with ID ${data.id}, taskId: ${data.taskId}`,
      );
      return { data };
    } catch (error) {
      this.logger.error(`POST /tasks - Error: ${error.message}`, error.stack);
      this.logger.error(
        `POST /tasks - Request body was: ${JSON.stringify(dto, null, 2)}`,
      );
      throw error;
    }
  }

  @Get('phases/:phaseId/tasks')
  async listPhaseTasks(
    @Param('phaseId') phaseId: string,
    @Query('status') status?: string | string[],
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
  ) {
    this.logger.log(
      `GET /tasks/phases/${phaseId}/tasks - Filters: ${JSON.stringify({
        status,
        dateFrom,
        dateTo,
        search,
      })}`,
    );
    try {
      const filters: taskInterface.PhaseTaskFilters = {
        status: this.parseStatusArray(status),
        dateFrom: this.parseDateOrUndefined(dateFrom),
        dateTo: this.parseDateOrUndefined(dateTo),
        search: search?.trim() || undefined,
      };

      const data = await this.tasksService.getPhaseTasks(phaseId, filters);
      this.logger.log(
        `GET /tasks/phases/${phaseId}/tasks - Success: ${data.data.length} tasks found`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `GET /tasks/phases/${phaseId}/tasks - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Public endpoint: Get task status by order number
   * GET /tasks/public/status/:orderNumber
   * No authentication required
   */
  @Get('public/status/:orderNumber')
  @Public()
  async getTaskStatusByOrderNumber(@Param('orderNumber') orderNumber: string) {
    this.logger.log(`GET /tasks/public/status/${orderNumber} - Request received`);
    try {
      const data = await this.tasksService.getTaskStatusByOrderNumber(orderNumber);
      this.logger.log(
        `GET /tasks/public/status/${orderNumber} - Success: Task found with status: ${data.status}`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `GET /tasks/public/status/${orderNumber} - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('reference/statuses')
  listStatuses() {
    this.logger.log(`GET /tasks/reference/statuses - Getting status reference`);
    try {
      const data = this.tasksService.getStatusReference();
      this.logger.log(
        `GET /tasks/reference/statuses - Success: ${data.length} statuses found`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `GET /tasks/reference/statuses - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get task template for a specific phase
   * Returns required and optional fields based on phase type
   * ⭐ NEW
   */
  @Get('template/:phaseId')
  async getTaskTemplate(@Param('phaseId') phaseId: string) {
    this.logger.log(`GET /tasks/template/${phaseId} - Request received`);
    try {
      const data = await this.tasksService.getTaskTemplate(phaseId);
      this.logger.log(
        `GET /tasks/template/${phaseId} - Success: Template retrieved`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `GET /tasks/template/${phaseId} - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ========== COMMENT ENDPOINTS ==========
  // IMPORTANT: These routes must come BEFORE generic :taskId routes to avoid route conflicts

  /**
   * Add a comment to a task
   * ⭐ NEW
   */
  @Post(':taskId/comments')
  async addComment(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: taskInterface.CreateTaskCommentDto,
  ) {
    this.logger.log(`POST /tasks/${taskId}/comments - Request received`);
    this.logger.debug(
      `POST /tasks/${taskId}/comments - Request body: ${JSON.stringify(createCommentDto, null, 2)}`,
    );

    try {
      if (
        !createCommentDto.comment ||
        createCommentDto.comment.trim().length === 0
      ) {
        throw new BadRequestException('Comment is required');
      }

      const data = await this.tasksService.addComment(taskId, createCommentDto);
      this.logger.log(
        `POST /tasks/${taskId}/comments - Success: Comment added with ID ${data.id}`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `POST /tasks/${taskId}/comments - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all comments for a task
   * ⭐ NEW
   */
  @Get(':taskId/comments')
  async getTaskComments(@Param('taskId') taskId: string) {
    this.logger.log(`GET /tasks/${taskId}/comments - Request received`);

    try {
      const data = await this.tasksService.getTaskComments(taskId);
      this.logger.log(
        `GET /tasks/${taskId}/comments - Success: ${data.length} comments found`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `GET /tasks/${taskId}/comments - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a comment
   * ⭐ NEW
   */
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string) {
    this.logger.log(`DELETE /tasks/comments/${commentId} - Request received`);

    try {
      await this.tasksService.deleteComment(commentId);
      this.logger.log(
        `DELETE /tasks/comments/${commentId} - Success: Comment deleted`,
      );
      return { data: { message: 'Comment deleted successfully' } };
    } catch (error) {
      this.logger.error(
        `DELETE /tasks/comments/${commentId} - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ========== TASK MOVEMENT ENDPOINTS ==========

  /**
   * Move a task from one phase to another
   * ⭐ NEW
   */
  @Post(':taskId/move')
  async moveTaskToPhase(
    @Param('taskId') taskId: string,
    @Body() moveTaskDto: taskInterface.MoveTaskDto,
  ) {
    this.logger.log(`POST /tasks/${taskId}/move - Request received`);
    this.logger.debug(
      `POST /tasks/${taskId}/move - Request body: ${JSON.stringify(moveTaskDto, null, 2)}`,
    );

    try {
      if (!moveTaskDto.toPhaseId) {
        throw new BadRequestException('toPhaseId is required');
      }

      const data = await this.tasksService.moveTaskToPhase(taskId, moveTaskDto);
      this.logger.log(
        `POST /tasks/${taskId}/move - Success: Task moved to phase ${moveTaskDto.toPhaseId}`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `POST /tasks/${taskId}/move - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get movement history for a task
   * ⭐ NEW
   */
  @Get(':taskId/movement-history')
  async getTaskMovementHistory(@Param('taskId') taskId: string) {
    this.logger.log(`GET /tasks/${taskId}/movement-history - Request received`);

    try {
      const data = await this.tasksService.getTaskMovementHistory(taskId);
      this.logger.log(
        `GET /tasks/${taskId}/movement-history - Success: ${data.length} movements found`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `GET /tasks/${taskId}/movement-history - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get enhanced task details with all related data
   * ⭐ NEW - Returns task, recipe, costedProduct, recipeExecution, comments, and phases
   */
  @Get(':taskId/details')
  async getTaskDetailsEnhanced(@Param('taskId') taskId: string) {
    this.logger.log(`GET /tasks/${taskId}/details - Request received`);

    try {
      const data = await this.tasksService.getTaskDetailsEnhanced(taskId);
      this.logger.log(
        `GET /tasks/${taskId}/details - Success: Task details retrieved`,
      );
      return {
        statusCode: 200,
        data,
      };
    } catch (error) {
      this.logger.error(
        `GET /tasks/${taskId}/details - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ========== TASK CRUD ENDPOINTS ==========
  // These generic :taskId routes come AFTER more specific routes

  @Put(':taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: taskInterface.UpdateTaskDto,
  ) {
    this.logger.log(
      `PUT /tasks/${taskId} - Request body: ${JSON.stringify(dto)}`,
    );
    try {
      const data = await this.tasksService.updateTask(taskId, dto);
      this.logger.log(`PUT /tasks/${taskId} - Success: Task updated`);
      return { data };
    } catch (error) {
      this.logger.error(
        `PUT /tasks/${taskId} - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Patch(':taskId/position')
  async updateTaskPosition(
    @Param('taskId') taskId: string,
    @Body() dto: taskInterface.TaskPositionDto,
  ) {
    this.logger.log(
      `PATCH /tasks/${taskId}/position - Request body: ${JSON.stringify(dto)}`,
    );
    try {
      const data = await this.tasksService.updateTaskPosition(taskId, dto);
      this.logger.log(
        `PATCH /tasks/${taskId}/position - Success: Task position updated`,
      );
      return { data };
    } catch (error) {
      this.logger.error(
        `PATCH /tasks/${taskId}/position - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete(':taskId')
  async deleteTask(@Param('taskId') taskId: string) {
    this.logger.log(`DELETE /tasks/${taskId} - Deleting task`);
    try {
      await this.tasksService.deleteTask(taskId);
      this.logger.log(`DELETE /tasks/${taskId} - Success: Task deleted`);
      return { data: null };
    } catch (error) {
      this.logger.error(
        `DELETE /tasks/${taskId} - Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private parseBoolean(value?: string) {
    if (!value) {
      return false;
    }
    return value === '1' || value.toLowerCase() === 'true';
  }

  private parseStatusArray(
    input?: string | string[],
  ): TaskStatus[] | undefined {
    if (!input) {
      return undefined;
    }
    const parts = Array.isArray(input)
      ? input
      : input.split(',').map((token) => token.trim());
    const filtered = parts.filter(Boolean) as TaskStatus[];
    return filtered.length > 0 ? filtered : undefined;
  }

  private parseDateOrUndefined(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date value "${value}"`);
    }
    return parsed;
  }
}
