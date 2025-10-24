// src/modules/costing/dto/update-costing.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCostingDto } from './create-costing.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCostingDto extends PartialType(CreateCostingDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  recalculate?: boolean = false;
}