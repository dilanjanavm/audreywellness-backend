// src/modules/costing/dto/costing-response.dto.ts
import { Status } from '../../../common/enums/common.enum';
import { BatchSize } from '../../../common/enums/batch.enum';

export class RawMaterialBatchCalculationsResponseDto {
  batch0_5kg: { cost: number; kg: number };
  batch1kg: { cost: number; kg: number };
  batch10kg: { cost: number; kg: number };
  batch25kg: { cost: number; kg: number };
  batch50kg: { cost: number; kg: number };
  batch100kg: { cost: number; kg: number };
  batch150kg: { cost: number; kg: number };
  batch200kg: { cost: number; kg: number };
<<<<<<< HEAD
=======
  batch250kg: { cost: number; kg: number };
>>>>>>> origin/new-dev
}

export class RawMaterialResponseDto {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  percentage: number;
  unitPrice: number;
  supplier: string;
  supplierId: string;
  category: string;
  categoryId: string;
  units: string;
  amountNeeded: number;
  totalCost: number;
  batchCalculations: RawMaterialBatchCalculationsResponseDto;
  createdAt: Date;
  updatedAt: Date;
}

export class AdditionalCostResponseDto {
  id: string;
  costName: string;
  description: string;
  costPerUnit: number;
  batchCosts: Record<BatchSize, number>;
  createdAt: Date;
  updatedAt: Date;
}

export class TotalCostResponseDto {
  id: string;
  batchSize: BatchSize;
  cost: number;
  kg: number;
  rawMaterialCost: number;
  additionalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CostingResponseDto {
  id: string;
  version: number;
  isActive: boolean;
  itemId: string;
  itemName: string;
  itemCode: string;
  rawMaterials: RawMaterialResponseDto[];
  additionalCosts: AdditionalCostResponseDto[];
  totalCosts: TotalCostResponseDto[];
  createdAt: Date;
  updatedAt: Date;
  status: Status;
  totalRawMaterialCost: number;
  totalAdditionalCost: number;
  totalPercentage: number;
}
