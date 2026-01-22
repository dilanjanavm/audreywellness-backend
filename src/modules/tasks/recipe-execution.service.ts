import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './entities/task.entity';
import { TaskRecipeExecutionEntity } from './entities/task-recipe-execution.entity';
import { TaskRecipeStepExecutionEntity } from './entities/task-recipe-step-execution.entity';
import {
  RecipeExecutionStatus,
  StepExecutionStatus,
} from '../../common/enums/recipe-execution.enum';
import {
  StartRecipeExecutionDto,
  UpdateStepProgressDto,
  CompleteStepDto,
  RecipeExecutionStatusDto,
  StepExecutionStatusDto,
  PauseExecutionDto,
  ResumeExecutionDto,
} from './dto/recipe-execution.dto';
import { RecipesService } from '../recipes/recipes.service';
import { RecipeStep } from '../recipes/entities/recipe-step.entity';
import { RecipeResponseDto } from '../recipes/dto/recipe-response.dto';

@Injectable()
export class RecipeExecutionService {
  private readonly logger = new Logger(RecipeExecutionService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(TaskRecipeExecutionEntity)
    private readonly executionRepository: Repository<TaskRecipeExecutionEntity>,
    @InjectRepository(TaskRecipeStepExecutionEntity)
    private readonly stepExecutionRepository: Repository<TaskRecipeStepExecutionEntity>,
    private readonly recipesService: RecipesService,
  ) {}

  /**
   * Find or create recipe execution for a task
   */
  async findOrCreateExecution(
    taskId: string,
    recipeId?: string,
  ): Promise<TaskRecipeExecutionEntity> {
    const task = await this.taskRepository.findOne({
      where: { taskId },
      relations: ['costing', 'recipeExecution'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // If execution already exists, return it
    if (task.recipeExecution) {
      return task.recipeExecution;
    }

    // If no recipe ID provided, find recipe from costed product
    let finalRecipeId = recipeId;
    if (!finalRecipeId && task.costingId && task.costing) {
      finalRecipeId = await this.findRecipeForTask(task);
    }

    if (!finalRecipeId) {
      throw new BadRequestException(
        'No recipe found for this task. Please provide a recipeId or ensure the task has a costed product with an active recipe.',
      );
    }

    // Get recipe to validate and get steps
    const recipe = await this.recipesService.findOne(finalRecipeId, false);

    // Create execution entity
    const execution = this.executionRepository.create({
      taskId: task.id,
      recipeId: finalRecipeId,
      status: RecipeExecutionStatus.NOT_STARTED,
      currentStepProgress: 0,
      totalElapsedTime: 0,
    });

    const savedExecution = await this.executionRepository.save(execution);

    // Pre-create step execution records for all recipe steps
    if (recipe.steps && recipe.steps.length > 0) {
      const stepExecutions = recipe.steps
        .sort((a, b) => a.order - b.order)
        .map((step) =>
          this.stepExecutionRepository.create({
            executionId: savedExecution.id,
            recipeStepId: step.id,
            stepOrder: step.order,
            status: StepExecutionStatus.PENDING,
            progress: 0,
            stepElapsedTime: 0, // Initialize elapsed time
          }),
        );

      await this.stepExecutionRepository.save(stepExecutions);
    }

    // Update task with execution reference
    task.recipeExecutionId = savedExecution.id;
    await this.taskRepository.save(task);

    return savedExecution;
  }

  /**
   * Find active recipe for a task based on costing
   */
  private async findRecipeForTask(task: TaskEntity): Promise<string | undefined> {
    if (!task.costing || !task.costing.itemId) {
      return undefined;
    }

    try {
      const activeRecipes = await this.recipesService.findAll({
        productId: task.costing.itemId,
        status: 'active' as any,
        includeVersions: 'false',
        page: 1,
        limit: 100,
      });

      if (activeRecipes.data && activeRecipes.data.length > 0) {
        // Try to match by batch size first
        if (task.batchSize) {
          const batchMatch = activeRecipes.data.find(
            (r: any) =>
              r.batchSize === task.batchSize && r.isActiveVersion === true,
          );
          if (batchMatch) {
            return batchMatch.id;
          }
        }

        // Find the recipe with isActiveVersion = true
        const selectedRecipe = activeRecipes.data.find(
          (r: any) => r.isActiveVersion === true,
        );
        if (selectedRecipe) {
          return selectedRecipe.id;
        }

        // If no active version, get the first one
        if (activeRecipes.data.length > 0) {
          return activeRecipes.data[0].id;
        }
      }
    } catch (error: any) {
      this.logger.warn(
        `Error finding recipe for task ${task.taskId}: ${error.message}`,
      );
    }

    return undefined;
  }

  /**
   * Start recipe execution
   */
  async startExecution(
    taskId: string,
    dto: StartRecipeExecutionDto,
  ): Promise<RecipeExecutionStatusDto> {
    const execution = await this.findOrCreateExecution(taskId, dto.recipeId);

    if (execution.status === RecipeExecutionStatus.IN_PROGRESS) {
      throw new BadRequestException('Recipe execution is already in progress');
    }

    if (execution.status === RecipeExecutionStatus.COMPLETED) {
      throw new BadRequestException('Recipe execution is already completed');
    }

    // Get recipe and steps
    const recipe = await this.recipesService.findOne(execution.recipeId, false);
    const stepExecutions = await this.stepExecutionRepository.find({
      where: { executionId: execution.id },
      order: { stepOrder: 'ASC' },
    });

    // Find first pending step
    const firstStep = stepExecutions.find(
      (se) => se.status === StepExecutionStatus.PENDING,
    );

    if (!firstStep) {
      throw new BadRequestException('No pending steps found');
    }

    // Start execution
    execution.status = RecipeExecutionStatus.IN_PROGRESS;
    execution.startedAt = new Date();
    execution.currentStepId = firstStep.recipeStepId;
    execution.currentStepOrder = firstStep.stepOrder;
    execution.currentStepProgress = 0;

    // Start first step
    firstStep.status = StepExecutionStatus.IN_PROGRESS;
    firstStep.startedAt = new Date();
    firstStep.progress = 0;

    await this.executionRepository.save(execution);
    await this.stepExecutionRepository.save(firstStep);

    // Update task status to ongoing if needed
    const task = await this.taskRepository.findOne({
      where: { id: execution.taskId },
    });
    if (task && task.status === 'pending') {
      task.status = 'ongoing' as any;
      await this.taskRepository.save(task);
    }

    return this.mapToStatusDto(execution, recipe, stepExecutions);
  }

  /**
   * Pause recipe execution
   * Accepts remainingTime from frontend to sync timer
   */
  async pauseExecution(
    taskId: string,
    dto: PauseExecutionDto = {},
  ): Promise<RecipeExecutionStatusDto> {
    const execution = await this.getExecutionByTaskId(taskId);

    if (execution.status !== RecipeExecutionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot pause execution with status: ${execution.status}`,
      );
    }

    // Get current step execution
    if (!execution.currentStepId) {
      throw new BadRequestException('No current step to pause');
    }

    const currentStepExecution = await this.stepExecutionRepository.findOne({
      where: {
        executionId: execution.id,
        recipeStepId: execution.currentStepId,
      },
    });

    if (!currentStepExecution) {
      throw new NotFoundException('Current step execution not found');
    }

    // Get recipe to access step duration
    const recipe = await this.recipesService.findOne(execution.recipeId, false);
    const recipeStep = recipe.steps?.find(
      (s) => s.id === currentStepExecution.recipeStepId,
    );

    if (!recipeStep) {
      throw new NotFoundException('Recipe step not found');
    }

    const stepDuration = recipeStep.duration; // Original step duration in minutes

    // Validate remainingTime if provided
    if (dto.remainingTime !== undefined && dto.remainingTime !== null) {
      // Check if remainingTime is greater than stepDuration (invalid)
      if (dto.remainingTime > stepDuration) {
        throw new BadRequestException(
          `Invalid remaining time: ${dto.remainingTime} minutes. Remaining time cannot be greater than step duration (${stepDuration} minutes).`,
        );
      }
    }

    // Calculate elapsed time - prefer remainingTime from frontend if provided
    let calculatedElapsedTime: number;

    if (dto.remainingTime !== undefined && dto.remainingTime !== null) {
      // Use remaining time from frontend (more accurate)
      // elapsedTime = stepDuration - remainingTime
      calculatedElapsedTime = Math.max(0, stepDuration - dto.remainingTime);
      this.logger.log(
        `pauseExecution - Using remainingTime from request: ${dto.remainingTime}, calculated elapsedTime: ${calculatedElapsedTime}`,
      );
    } else {
      // Fallback: Calculate from timestamps
      if (currentStepExecution.startedAt) {
        const now = new Date();
        const referenceTime =
          currentStepExecution.resumedAt || currentStepExecution.startedAt;
        const additionalElapsedTime = Math.floor(
          (now.getTime() - referenceTime.getTime()) / (1000 * 60),
        );
        calculatedElapsedTime =
          (currentStepExecution.stepElapsedTime || 0) + additionalElapsedTime;
        this.logger.log(
          `pauseExecution - Calculated elapsedTime from timestamps: ${calculatedElapsedTime}`,
        );
      } else {
        calculatedElapsedTime = currentStepExecution.stepElapsedTime || 0;
      }
    }

    // Update step elapsed time
    const previousElapsedTime = currentStepExecution.stepElapsedTime || 0;
    const additionalTime = calculatedElapsedTime - previousElapsedTime;

    currentStepExecution.stepElapsedTime = calculatedElapsedTime;

    // Add additional time to total execution elapsed time
    if (additionalTime > 0) {
      execution.totalElapsedTime =
        (execution.totalElapsedTime || 0) + additionalTime;
    }

    // Pause execution and current step
    execution.status = RecipeExecutionStatus.PAUSED;
    execution.pausedAt = new Date();
    
    // Save pause reason and remaining time
    if (dto.reason !== undefined) {
      execution.pauseReason = dto.reason;
    }
    if (dto.remainingTime !== undefined && dto.remainingTime !== null) {
      execution.remainingTimeAtPause = dto.remainingTime;
    } else {
      // Calculate remaining time from elapsed time
      const calculatedRemainingTime = Math.max(0, stepDuration - calculatedElapsedTime);
      execution.remainingTimeAtPause = calculatedRemainingTime;
    }

    currentStepExecution.status = StepExecutionStatus.PAUSED;
    currentStepExecution.pausedAt = new Date();

    await this.executionRepository.save(execution);
    await this.stepExecutionRepository.save(currentStepExecution);

    const stepExecutions = await this.stepExecutionRepository.find({
      where: { executionId: execution.id },
      order: { stepOrder: 'ASC' },
    });

    return this.mapToStatusDto(execution, recipe, stepExecutions);
  }

  /**
   * Resume recipe execution
   * Accepts optional remainingTime from frontend to sync timer
   */
  async resumeExecution(
    taskId: string,
    dto: ResumeExecutionDto = {},
  ): Promise<RecipeExecutionStatusDto> {
    const execution = await this.getExecutionByTaskId(taskId);

    if (execution.status !== RecipeExecutionStatus.PAUSED) {
      throw new BadRequestException(
        `Cannot resume execution with status: ${execution.status}`,
      );
    }

    // Get current step execution
    if (!execution.currentStepId) {
      throw new BadRequestException('No current step to resume');
    }

    const currentStepExecution = await this.stepExecutionRepository.findOne({
      where: {
        executionId: execution.id,
        recipeStepId: execution.currentStepId,
      },
    });

    if (!currentStepExecution) {
      throw new NotFoundException('Current step execution not found');
    }

    // Get recipe to access step duration
    const recipe = await this.recipesService.findOne(execution.recipeId, false);
    const recipeStep = recipe.steps?.find(
      (s) => s.id === currentStepExecution.recipeStepId,
    );

    if (!recipeStep) {
      throw new NotFoundException('Recipe step not found');
    }

    const stepDuration = recipeStep.duration; // Original step duration in minutes

    // If remainingTime provided, update elapsed time accordingly
    if (dto.remainingTime !== undefined && dto.remainingTime !== null) {
      // Calculate elapsed time from remaining time
      const calculatedElapsedTime = Math.max(
        0,
        stepDuration - dto.remainingTime,
      );
      
      // Update step elapsed time if different (frontend might have more accurate timer)
      if (
        Math.abs(calculatedElapsedTime - (currentStepExecution.stepElapsedTime || 0)) > 0
      ) {
        const previousElapsedTime = currentStepExecution.stepElapsedTime || 0;
        const timeDifference = calculatedElapsedTime - previousElapsedTime;
        
        currentStepExecution.stepElapsedTime = calculatedElapsedTime;
        
        // Adjust total elapsed time if needed
        if (timeDifference !== 0) {
          execution.totalElapsedTime =
            (execution.totalElapsedTime || 0) + timeDifference;
        }
        
        this.logger.log(
          `resumeExecution - Updated elapsedTime from remainingTime: ${dto.remainingTime}, new elapsedTime: ${calculatedElapsedTime}`,
        );
      }
    }

    // Resume execution and current step
    execution.status = RecipeExecutionStatus.IN_PROGRESS;
    const resumeTime = new Date();
    execution.resumedAt = resumeTime;
    // Clear pause reason and remaining time at pause when resuming
    execution.pauseReason = undefined;
    execution.remainingTimeAtPause = undefined;

    currentStepExecution.status = StepExecutionStatus.IN_PROGRESS;
    currentStepExecution.resumedAt = resumeTime; // Track resume time for this step
    // Keep pausedAt for tracking - don't clear it
    // Don't update startedAt - keep original start time for accurate duration tracking

    await this.executionRepository.save(execution);
    await this.stepExecutionRepository.save(currentStepExecution);

    const stepExecutions = await this.stepExecutionRepository.find({
      where: { executionId: execution.id },
      order: { stepOrder: 'ASC' },
    });

    return this.mapToStatusDto(execution, recipe, stepExecutions);
  }

  /**
   * Update step progress
   */
  async updateStepProgress(
    taskId: string,
    stepOrder: number,
    dto: UpdateStepProgressDto,
  ): Promise<RecipeExecutionStatusDto> {
    const execution = await this.getExecutionByTaskId(taskId);

    if (execution.status !== RecipeExecutionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot update progress for execution with status: ${execution.status}`,
      );
    }

    const stepExecution = await this.stepExecutionRepository.findOne({
      where: {
        executionId: execution.id,
        stepOrder,
      },
    });

    if (!stepExecution) {
      throw new NotFoundException(
        `Step execution not found for step order: ${stepOrder}`,
      );
    }

    // Validate step is in progress or paused (can update progress)
    if (
      stepExecution.status !== StepExecutionStatus.IN_PROGRESS &&
      stepExecution.status !== StepExecutionStatus.PAUSED
    ) {
      throw new BadRequestException(
        `Cannot update progress for step ${stepOrder} with status: ${stepExecution.status}`,
      );
    }

    // If step is paused, don't allow progress updates (must resume first)
    if (stepExecution.status === StepExecutionStatus.PAUSED) {
      throw new BadRequestException(
        `Cannot update progress for paused step. Please resume execution first.`,
      );
    }

    // Update step progress
    stepExecution.progress = dto.progress;
    if (dto.actualTemperature !== undefined) {
      stepExecution.actualTemperature = dto.actualTemperature;
    }
    if (dto.notes) {
      stepExecution.notes = dto.notes;
    }

    // Update execution current step progress
    if (execution.currentStepOrder === stepOrder) {
      execution.currentStepProgress = dto.progress;
    }

    await this.stepExecutionRepository.save(stepExecution);
    await this.executionRepository.save(execution);

    const recipe = await this.recipesService.findOne(execution.recipeId, false);
    const stepExecutions = await this.stepExecutionRepository.find({
      where: { executionId: execution.id },
      order: { stepOrder: 'ASC' },
    });

    return this.mapToStatusDto(execution, recipe, stepExecutions);
  }

  /**
   * Complete a step
   */
  async completeStep(
    taskId: string,
    stepOrder: number,
    dto: CompleteStepDto,
  ): Promise<RecipeExecutionStatusDto> {
    const execution = await this.getExecutionByTaskId(taskId);

    if (execution.status !== RecipeExecutionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete step for execution with status: ${execution.status}`,
      );
    }

    const stepExecution = await this.stepExecutionRepository.findOne({
      where: {
        executionId: execution.id,
        stepOrder,
      },
    });

    if (!stepExecution) {
      throw new NotFoundException(
        `Step execution not found for step order: ${stepOrder}`,
      );
    }

    // Validate step is not already completed
    if (stepExecution.status === StepExecutionStatus.COMPLETED) {
      throw new BadRequestException(
        `Step ${stepOrder} is already completed`,
      );
    }

    // Validate step is currently in progress
    if (stepExecution.status !== StepExecutionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Step ${stepOrder} is not in progress. Current status: ${stepExecution.status}`,
      );
    }

    // Get recipe to access step duration
    const recipe = await this.recipesService.findOne(execution.recipeId, false);
    const recipeStep = recipe.steps?.find(
      (s) => s.id === stepExecution.recipeStepId,
    );

    if (!recipeStep) {
      throw new NotFoundException('Recipe step not found');
    }

    const stepDuration = recipeStep.duration; // Original step duration in minutes

    // Calculate actual duration - prefer remainingTime or actualDuration from frontend if provided
    let calculatedElapsedTime: number;

    if (dto.remainingTime !== undefined && dto.remainingTime !== null) {
      // Use remaining time from frontend
      calculatedElapsedTime = Math.max(0, stepDuration - dto.remainingTime);
      this.logger.log(
        `completeStep - Using remainingTime from request: ${dto.remainingTime}, calculated elapsedTime: ${calculatedElapsedTime}`,
      );
    } else if (dto.actualDuration !== undefined) {
      // Use actualDuration from frontend
      calculatedElapsedTime = dto.actualDuration;
      this.logger.log(
        `completeStep - Using actualDuration from request: ${calculatedElapsedTime}`,
      );
    } else {
      // Calculate from timestamps
      if (stepExecution.startedAt) {
        const now = new Date();
        const referenceTime = stepExecution.resumedAt || stepExecution.startedAt;
        const additionalTime = Math.floor(
          (now.getTime() - referenceTime.getTime()) / (1000 * 60),
        );
        calculatedElapsedTime =
          (stepExecution.stepElapsedTime || 0) + additionalTime;
        this.logger.log(
          `completeStep - Calculated elapsedTime from timestamps: ${calculatedElapsedTime}`,
        );
      } else {
        calculatedElapsedTime = stepExecution.stepElapsedTime || 0;
      }
    }

    // Update step elapsed time and actual duration
    const previousElapsedTime = stepExecution.stepElapsedTime || 0;
    const additionalTime = calculatedElapsedTime - previousElapsedTime;

    stepExecution.stepElapsedTime = calculatedElapsedTime;
    stepExecution.actualDuration = calculatedElapsedTime;

    // Add additional time to total execution elapsed time
    if (additionalTime > 0) {
      execution.totalElapsedTime =
        (execution.totalElapsedTime || 0) + additionalTime;
    }

    if (dto.actualTemperature !== undefined) {
      stepExecution.actualTemperature = dto.actualTemperature;
    }
    if (dto.notes) {
      stepExecution.notes = dto.notes;
    }

    // Mark step as completed
    stepExecution.status = StepExecutionStatus.COMPLETED;
    stepExecution.progress = 100;
    stepExecution.completedAt = new Date();

    await this.stepExecutionRepository.save(stepExecution);

    // Check if there are more steps
    const allStepExecutions = await this.stepExecutionRepository.find({
      where: { executionId: execution.id },
      order: { stepOrder: 'ASC' },
    });

    const nextStep = allStepExecutions.find(
      (se) => se.status === StepExecutionStatus.PENDING,
    );

    if (nextStep) {
      // Start next step
      nextStep.status = StepExecutionStatus.IN_PROGRESS;
      nextStep.startedAt = new Date();
      nextStep.progress = 0;
      nextStep.stepElapsedTime = 0; // Initialize elapsed time
      nextStep.resumedAt = undefined; // Clear any previous resume time

      execution.currentStepId = nextStep.recipeStepId;
      execution.currentStepOrder = nextStep.stepOrder;
      execution.currentStepProgress = 0;

      await this.stepExecutionRepository.save(nextStep);
    } else {
      // All steps completed
      execution.status = RecipeExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.currentStepId = undefined;
      execution.currentStepOrder = undefined;
    }

    await this.executionRepository.save(execution);

    // Recipe already loaded above, reuse it
    return this.mapToStatusDto(execution, recipe, allStepExecutions);
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(
    taskId: string,
  ): Promise<RecipeExecutionStatusDto> {
    const execution = await this.getExecutionByTaskId(taskId);

    const recipe = await this.recipesService.findOne(execution.recipeId, false);
    const stepExecutions = await this.stepExecutionRepository.find({
      where: { executionId: execution.id },
      order: { stepOrder: 'ASC' },
    });

    return this.mapToStatusDto(execution, recipe, stepExecutions);
  }

  /**
   * Cancel recipe execution
   */
  async cancelExecution(
    taskId: string,
  ): Promise<RecipeExecutionStatusDto> {
    const execution = await this.getExecutionByTaskId(taskId);

    if (execution.status === RecipeExecutionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed execution');
    }

    execution.status = RecipeExecutionStatus.CANCELLED;

    // Cancel current step if in progress
    if (execution.currentStepId) {
      const currentStepExecution = await this.stepExecutionRepository.findOne({
        where: {
          executionId: execution.id,
          recipeStepId: execution.currentStepId,
        },
      });

      if (
        currentStepExecution &&
        currentStepExecution.status === StepExecutionStatus.IN_PROGRESS
      ) {
        currentStepExecution.status = StepExecutionStatus.PENDING;
        await this.stepExecutionRepository.save(currentStepExecution);
      }
    }

    await this.executionRepository.save(execution);

    const recipe = await this.recipesService.findOne(execution.recipeId, false);
    const stepExecutions = await this.stepExecutionRepository.find({
      where: { executionId: execution.id },
      order: { stepOrder: 'ASC' },
    });

    return this.mapToStatusDto(execution, recipe, stepExecutions);
  }

  /**
   * Get execution by task ID
   */
  private async getExecutionByTaskId(
    taskId: string,
  ): Promise<TaskRecipeExecutionEntity> {
    const task = await this.taskRepository.findOne({
      where: { taskId },
      relations: ['recipeExecution'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!task.recipeExecution) {
      throw new NotFoundException(
        `No recipe execution found for task ${taskId}`,
      );
    }

    return task.recipeExecution;
  }

  /**
   * Map execution entity to status DTO
   */
  private mapToStatusDto(
    execution: TaskRecipeExecutionEntity,
    recipe: RecipeResponseDto,
    stepExecutions: TaskRecipeStepExecutionEntity[],
  ): RecipeExecutionStatusDto {
    const completedSteps = stepExecutions.filter(
      (se) => se.status === StepExecutionStatus.COMPLETED,
    ).length;
    const totalSteps = stepExecutions.length;
    const overallProgress =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Find current step details and calculate elapsed time
    let currentStep: RecipeExecutionStatusDto['currentStep'] | undefined;
    let currentStepElapsedTime: number | undefined;
    
    if (execution.currentStepId && execution.currentStepOrder) {
      const currentStepExecution = stepExecutions.find(
        (se) => se.recipeStepId === execution.currentStepId,
      );
      const recipeStep = recipe.steps?.find(
        (s) => s.id === currentStepExecution?.recipeStepId,
      );

      if (currentStepExecution && recipeStep) {
        // Calculate current step elapsed time
        let calculatedElapsedTime = currentStepExecution.stepElapsedTime || 0;

        if (currentStepExecution.status === StepExecutionStatus.IN_PROGRESS && currentStepExecution.startedAt) {
          // If in progress, add time since last start/resume
          const now = new Date();
          const referenceTime = currentStepExecution.resumedAt || currentStepExecution.startedAt;
          const additionalTime = Math.floor(
            (now.getTime() - referenceTime.getTime()) / (1000 * 60)
          );
          calculatedElapsedTime = calculatedElapsedTime + additionalTime;
        } else if (currentStepExecution.status === StepExecutionStatus.PAUSED) {
          // If paused, use the saved elapsed time (already updated when paused)
          calculatedElapsedTime = currentStepExecution.stepElapsedTime || 0;
        } else if (currentStepExecution.status === StepExecutionStatus.COMPLETED && currentStepExecution.actualDuration) {
          // If completed, use actual duration
          calculatedElapsedTime = currentStepExecution.actualDuration;
        }

        currentStepElapsedTime = calculatedElapsedTime;

        // Calculate remaining time (recipe step duration - elapsed time)
        const stepDuration = recipeStep.duration; // Duration in minutes from recipe
        const remainingTime = stepDuration ? Math.max(0, stepDuration - calculatedElapsedTime) : undefined;

        currentStep = {
          stepId: currentStepExecution.recipeStepId,
          stepOrder: execution.currentStepOrder,
          instruction: recipeStep.instruction,
          progress: Number(execution.currentStepProgress),
          status: currentStepExecution.status,
          startedAt: currentStepExecution.startedAt,
          elapsedTime: calculatedElapsedTime,
          remainingTime: remainingTime,
          stepDuration: stepDuration,
        };
      }
    }

    // Map step executions
    const stepExecutionDtos: StepExecutionStatusDto[] = stepExecutions.map(
      (se) => {
        const recipeStep = recipe.steps?.find((s) => s.id === se.recipeStepId);
        return {
          id: se.id,
          stepId: se.recipeStepId,
          stepOrder: se.stepOrder,
          instruction: recipeStep?.instruction || '',
          status: se.status,
          progress: Number(se.progress),
          actualTemperature: se.actualTemperature
            ? Number(se.actualTemperature)
            : undefined,
          actualDuration: se.actualDuration,
          startedAt: se.startedAt,
          completedAt: se.completedAt,
          notes: se.notes,
        };
      },
    );

    // Calculate remaining time for entire task/recipe
    // Sum of remaining times for all incomplete steps
    let remainingTimeForTask: number | undefined;
    
    const incompleteSteps = stepExecutions.filter(
      (se) => se.status !== StepExecutionStatus.COMPLETED
    );
    
    if (incompleteSteps.length > 0) {
      let totalRemainingTime = 0;
      
      for (const stepExec of incompleteSteps) {
        const step = recipe.steps?.find((s) => s.id === stepExec.recipeStepId);
        if (step) {
          if (stepExec.recipeStepId === execution.currentStepId) {
            // Current step - use saved remainingTimeAtPause if paused, otherwise calculate
            if (execution.status === RecipeExecutionStatus.PAUSED && 
                execution.remainingTimeAtPause !== undefined && 
                execution.remainingTimeAtPause !== null) {
              totalRemainingTime += execution.remainingTimeAtPause;
            } else if (currentStep?.remainingTime !== undefined) {
              totalRemainingTime += currentStep.remainingTime;
            } else {
              // Fallback: calculate from elapsed time
              const stepElapsed = stepExec.stepElapsedTime || 0;
              const stepRemaining = Math.max(0, step.duration - stepElapsed);
              totalRemainingTime += stepRemaining;
            }
          } else {
            // Future steps - use full duration (not started yet)
            totalRemainingTime += step.duration;
          }
        }
      }
      
      remainingTimeForTask = totalRemainingTime;
    } else {
      // All steps completed
      remainingTimeForTask = 0;
    }

    return {
      id: execution.id,
      executionId: execution.id,
      status: execution.status,
      currentStep,
      overallProgress,
      totalSteps,
      completedSteps,
      elapsedTime: execution.totalElapsedTime,
      currentStepElapsedTime,
      currentStepRemainingTime: currentStep?.remainingTime,
      remainingTimeForTask,
      startedAt: execution.startedAt,
      pausedAt: execution.pausedAt,
      resumedAt: execution.resumedAt,
      completedAt: execution.completedAt,
      pauseReason: execution.pauseReason,
      remainingTimeAtPause: execution.remainingTimeAtPause,
      recipe,
      stepExecutions: stepExecutionDtos,
    };
  }
}

