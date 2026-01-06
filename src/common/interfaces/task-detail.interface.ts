// src/common/interfaces/task-detail.interface.ts
import { TaskResponseDto, TaskCommentResponseDto } from './task.interface';
import { CostingResponseDto } from '../../modules/costing/dto/costing-response.dto';
import { CostedProductDto } from '../../modules/costing/dto/cost-history.dto';
import { RecipeResponseDto } from '../../modules/recipes/dto/recipe-response.dto';
import { RecipeExecutionStatusDto } from '../../modules/tasks/dto/recipe-execution.dto';

export interface TaskDetailResponseDto {
  task: TaskResponseDto;
  comments: TaskCommentResponseDto[];
  costedProduct?: CostedProductDto;
  recipe?: RecipeResponseDto;
  recipeExecution?: RecipeExecutionStatusDto;
}

