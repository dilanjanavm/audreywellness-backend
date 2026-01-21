import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RecipeExecutionService } from './recipe-execution.service';
import {
  StartRecipeExecutionDto,
  UpdateStepProgressDto,
  CompleteStepDto,
  RecipeExecutionStatusDto,
  PauseExecutionDto,
  ResumeExecutionDto,
} from './dto/recipe-execution.dto';

@Controller('tasks/:taskId/recipe')
@UseGuards(JwtAuthGuard)
export class RecipeExecutionController {
  private readonly logger = new Logger(RecipeExecutionController.name);

  constructor(
    private readonly recipeExecutionService: RecipeExecutionService,
  ) {}

  /**
   * Start recipe execution
   * POST /tasks/:taskId/recipe/start
   */
  @Post('start')
  async startExecution(
    @Param('taskId') taskId: string,
    @Body() dto: StartRecipeExecutionDto,
  ): Promise<RecipeExecutionStatusDto> {
    this.logger.log(`Starting recipe execution for task: ${taskId}`);
    return this.recipeExecutionService.startExecution(taskId, dto);
  }

  /**
   * Pause recipe execution
   * POST /tasks/:taskId/recipe/pause
   */
  @Post('pause')
  async pauseExecution(
    @Param('taskId') taskId: string,
    @Body() dto: PauseExecutionDto,
  ): Promise<RecipeExecutionStatusDto> {
    this.logger.log(`Pausing recipe execution for task: ${taskId}`);
    return this.recipeExecutionService.pauseExecution(taskId, dto);
  }

  /**
   * Resume recipe execution
   * POST /tasks/:taskId/recipe/resume
   */
  @Post('resume')
  async resumeExecution(
    @Param('taskId') taskId: string,
    @Body() dto: ResumeExecutionDto,
  ): Promise<RecipeExecutionStatusDto> {
    this.logger.log(`Resuming recipe execution for task: ${taskId}`);
    return this.recipeExecutionService.resumeExecution(taskId, dto);
  }

  /**
   * Update step progress
   * POST /tasks/:taskId/recipe/steps/:stepOrder/progress
   */
  @Post('steps/:stepOrder/progress')
  async updateStepProgress(
    @Param('taskId') taskId: string,
    @Param('stepOrder', ParseIntPipe) stepOrder: number,
    @Body() dto: UpdateStepProgressDto,
  ): Promise<RecipeExecutionStatusDto> {
    this.logger.log(
      `Updating progress for step ${stepOrder} in task: ${taskId}`,
    );
    return this.recipeExecutionService.updateStepProgress(
      taskId,
      stepOrder,
      dto,
    );
  }

  /**
   * Complete a step
   * POST /tasks/:taskId/recipe/steps/:stepOrder/complete
   */
  @Post('steps/:stepOrder/complete')
  async completeStep(
    @Param('taskId') taskId: string,
    @Param('stepOrder', ParseIntPipe) stepOrder: number,
    @Body() dto: CompleteStepDto,
  ): Promise<RecipeExecutionStatusDto> {
    this.logger.log(`Completing step ${stepOrder} in task: ${taskId}`);
    return this.recipeExecutionService.completeStep(taskId, stepOrder, dto);
  }

  /**
   * Get execution status
   * GET /tasks/:taskId/recipe/status
   */
  @Get('status')
  async getExecutionStatus(
    @Param('taskId') taskId: string,
  ): Promise<RecipeExecutionStatusDto> {
    this.logger.log(`Getting recipe execution status for task: ${taskId}`);
    return this.recipeExecutionService.getExecutionStatus(taskId);
  }

  /**
   * Cancel recipe execution
   * POST /tasks/:taskId/recipe/cancel
   */
  @Post('cancel')
  async cancelExecution(
    @Param('taskId') taskId: string,
  ): Promise<RecipeExecutionStatusDto> {
    this.logger.log(`Cancelling recipe execution for task: ${taskId}`);
    return this.recipeExecutionService.cancelExecution(taskId);
  }
}

