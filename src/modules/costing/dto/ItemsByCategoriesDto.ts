// src/modules/costing/dto/items-by-categories.dto.ts
import { IsArray, IsOptional, IsBoolean, IsNumber, Min, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemsByCategoriesDto {
  @IsArray()
  @ArrayNotEmpty()
  categoryIds: string[];

  @IsOptional()
  @IsBoolean()
  includeSuppliers?: boolean;

  @IsOptional()
  @IsBoolean()
  onlyWithCosting?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}