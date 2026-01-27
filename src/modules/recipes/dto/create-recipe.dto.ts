// src/modules/recipes/dto/create-recipe.dto.ts
import {
  IsString,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeStatus } from '../entities/recipe.entity';
import { IsBoolean, MaxLength } from 'class-validator';

export class CreateRecipeStepDto {
  @IsNumber()
  @Min(1)
  order: number;

  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsNumber()
  @IsOptional()
  temperature: number | null;

  @IsNumber()
  @Min(1)
  duration: number;
}

export class CreateRecipeIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsOptional()
  category?: string | null;
}

export class CreatePreparationQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @IsBoolean()
  hasCheckbox: boolean;
}

export class CreatePreparationStepDto {
  @IsNumber()
  @Min(1)
  order: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePreparationQuestionDto)
  questions: CreatePreparationQuestionDto[];
}

export class CreateRecipeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  batchSize: string;

  @IsNumber()
  @Min(1)
  totalTime: number;

  @IsEnum(RecipeStatus)
  @IsOptional()
  status?: RecipeStatus;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStepDto)
  steps: CreateRecipeStepDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreparationStepDto)
  @IsOptional()
  preparationQuestions?: CreatePreparationStepDto[];
}

