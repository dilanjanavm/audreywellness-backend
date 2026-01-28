// src/modules/costing/dto/create-costing.dto.ts
import {
  IsArray,
  IsString,
  IsUUID,
  IsNumber,
  IsObject,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RawMaterialBatchCalculationDto {
  @IsNumber()
  cost: number;

  @IsNumber()
  kg: number;
}

export class RawMaterialBatchCalculationsDto {
  @IsObject()
  batch0_5kg: RawMaterialBatchCalculationDto;

  @IsObject()
  batch1kg: RawMaterialBatchCalculationDto;

  @IsObject()
  batch10kg: RawMaterialBatchCalculationDto;

  @IsObject()
  batch25kg: RawMaterialBatchCalculationDto;

  @IsObject()
  batch50kg: RawMaterialBatchCalculationDto;

  @IsObject()
  batch100kg: RawMaterialBatchCalculationDto;

  @IsObject()
  batch150kg: RawMaterialBatchCalculationDto;

  @IsObject()
  batch200kg: RawMaterialBatchCalculationDto;
<<<<<<< HEAD
=======

  @IsObject()
  batch250kg: RawMaterialBatchCalculationDto;
>>>>>>> origin/new-dev
}

export class RawMaterialDto {
  @IsUUID()
  rawMaterialId: string;

  @IsString()
  rawMaterialName: string;

  @IsNumber()
  percentage: number;

  @IsNumber()
  unitPrice: number;

  @IsString()
  supplier: string;

  @IsUUID()
<<<<<<< HEAD
=======
  @IsOptional()
>>>>>>> origin/new-dev
  supplierId: string;

  @IsString()
  category: string;

  @IsUUID()
  categoryId: string;

  @IsString()
  units: string;

  @IsNumber()
  amountNeeded: number;

  @IsObject()
  @ValidateNested()
  @Type(() => RawMaterialBatchCalculationsDto)
  batchCalculations: RawMaterialBatchCalculationsDto;
}

export class AdditionalCostBatchDto {
  @IsNumber()
  'batch0.5kg': number;

  @IsNumber()
  batch1kg: number;

  @IsNumber()
  batch10kg: number;

  @IsNumber()
  batch25kg: number;

  @IsNumber()
  batch50kg: number;

  @IsNumber()
  batch100kg: number;

  @IsNumber()
  batch150kg: number;

  @IsNumber()
  batch200kg: number;
<<<<<<< HEAD
=======

  @IsNumber()
  batch250kg: number;
>>>>>>> origin/new-dev
}

export class AdditionalCostDto {
  @IsString()
  costName: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  costPerUnit: number;

  @IsObject()
  @ValidateNested()
  @Type(() => AdditionalCostBatchDto)
  batchCosts: AdditionalCostBatchDto;
}

export class TotalCostDto {
  @IsNumber()
  cost: number;

  @IsNumber()
  kg: number;
}

export class CreateCostingDto {
  @IsUUID()
  itemId: string;

  @IsString()
  itemName: string;

  @IsString()
  itemCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RawMaterialDto)
  rawMaterials: RawMaterialDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalCostDto)
  additionalCosts: AdditionalCostDto[];

  @IsObject()
  totalCosts: Record<string, TotalCostDto>;

  @IsBoolean()
  @IsOptional()
  setAsActive?: boolean = true;

  @IsOptional()
  createdAt?: string;
}
