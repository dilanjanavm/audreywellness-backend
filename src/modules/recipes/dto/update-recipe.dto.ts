// src/modules/recipes/dto/update-recipe.dto.ts
import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeStatus } from '../entities/recipe.entity';
import { CreateRecipeStepDto, CreateRecipeIngredientDto, CreatePreparationStepDto } from './create-recipe.dto';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  batchSize?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  totalTime?: number;

  @IsEnum(RecipeStatus)
  @IsOptional()
  status?: RecipeStatus;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStepDto)
  @IsOptional()
  steps?: CreateRecipeStepDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  @IsOptional()
  ingredients?: CreateRecipeIngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreparationStepDto)
  @IsOptional()
  preparationQuestions?: CreatePreparationStepDto[];
}

