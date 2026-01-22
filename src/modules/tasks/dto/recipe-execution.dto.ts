import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { RecipeExecutionStatus, StepExecutionStatus } from '../../../common/enums/recipe-execution.enum';
import { RecipeResponseDto } from '../../recipes/dto/recipe-response.dto';

// Request DTOs
export class StartRecipeExecutionDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string; // Optional - will auto-find from costed product if not provided
}

export class UpdateStepProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number; // 0-100

  @IsOptional()
  @IsNumber()
  actualTemperature?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteStepDto {
  @IsOptional()
  @IsNumber()
  actualDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingTime?: number; // Remaining time when completing (in minutes, optional)

  @IsOptional()
  @IsNumber()
  actualTemperature?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PauseExecutionDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingTime?: number; // Remaining time for current step in minutes (from frontend timer)
}

export class ResumeExecutionDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingTime?: number; // Remaining time for current step in minutes (from frontend timer, optional)
}

// Response DTOs
export class StepExecutionStatusDto {
  id: string;
  stepId: string;
  stepOrder: number;
  instruction: string;
  status: StepExecutionStatus;
  progress: number;
  actualTemperature?: number;
  actualDuration?: number;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export class RecipeExecutionStatusDto {
  id: string;
  executionId: string;
  status: RecipeExecutionStatus;
  currentStep?: {
    stepId: string;
    stepOrder: number;
    instruction: string;
    progress: number;
    status: StepExecutionStatus;
    startedAt?: Date;
    elapsedTime?: number; // Current step elapsed time in minutes (accumulated, excludes pause time)
    remainingTime?: number; // Remaining time for current step in minutes (duration - elapsedTime)
    stepDuration?: number; // Original step duration from recipe (in minutes)
  };
  overallProgress: number; // Percentage of all steps completed
  totalSteps: number;
  completedSteps: number;
  elapsedTime: number; // Total elapsed time in minutes (accumulated)
  currentStepElapsedTime?: number; // Current step elapsed time in minutes (for active steps)
  currentStepRemainingTime?: number; // Remaining time for current step in minutes
  remainingTimeForTask?: number; // Remaining time for the entire task/recipe execution (in minutes)
  startedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;
  pauseReason?: string; // Reason for pausing (if paused)
  remainingTimeAtPause?: number; // Remaining time when paused (in minutes)
  recipe?: RecipeResponseDto;
  stepExecutions: StepExecutionStatusDto[];
}

