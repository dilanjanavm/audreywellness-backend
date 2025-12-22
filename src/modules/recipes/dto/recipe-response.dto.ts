// src/modules/recipes/dto/recipe-response.dto.ts
import { RecipeStatus } from '../entities/recipe.entity';

export class RecipeStepResponseDto {
  id: string;
  order: number;
  instruction: string;
  temperature: number | null;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export class RecipeIngredientResponseDto {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RecipeResponseDto {
  id: string;
  name: string;
  productId: string;
  itemId: string;
  batchSize: string;
  totalTime: number;
  status: RecipeStatus;
  version: number;
  isActiveVersion: boolean;
  createdBy?: string;
  updatedBy?: string;
  steps: RecipeStepResponseDto[];
  ingredients: RecipeIngredientResponseDto[];
  createdAt: Date;
  updatedAt: Date;
  latestVersions?: RecipeVersionHistoryDto[]; // Latest 3 versions (summary only)
  countOfVersions?: number; // Total count of versions for this product/batch
  allVersions?: RecipeResponseDto[] | RecipeVersionHistoryDto[]; // All versions - full data if includeVersions=true, summary if false
}

export class RecipeVersionHistoryDto {
  id: string;
  name: string;
  version: number;
  isActiveVersion: boolean;
  status: RecipeStatus;
  totalTime: number;
  createdAt: Date;
  updatedAt: Date;
}

