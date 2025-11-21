// src/modules/costing/dto/items-with-costing-query.dto.ts
import { IsOptional, IsBoolean, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemsWithCostingQueryDto {
  @IsOptional()
  @IsBoolean()
  includeSuppliers?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

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

export class PaginatedItemsWithCostingResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}