// src/modules/costing/dto/cost-history.dto.ts
import { CostingResponseDto } from './costing-response.dto';
import { BatchSize } from '../../../common/enums/batch.enum';
import { RecipeResponseDto } from '../../recipes/dto/recipe-response.dto';

export class CostChangeDto {
  batchSize: BatchSize;
  previousCost: number;
  currentCost: number;
  costDifference: number;
  percentageChange: number;
}

export class CostHistoryEntryDto {
  costing: CostingResponseDto;
  costChanges?: CostChangeDto[];
  isActive: boolean;
  version: number;
  updatedAt: Date;
  createdAt: Date;
}

export class ProductCostHistoryDto {
  itemId: string;
  itemCode: string;
  itemName: string;
  totalVersions: number;
  currentActiveVersion?: number;
  history: CostHistoryEntryDto[];
  createdAt: Date;
  lastUpdated: Date;
}

export class CostedProductDto {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  categoryId?: string;
  units: string;
  price: number;
  currency: string;
  status: string;
  hasActiveCosting: boolean;
  activeCostingVersion?: number;
  totalCostingVersions: number;
  latestCosting?: CostingResponseDto;
  allCostingVersions?: CostingResponseDto[];
  lastCostUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Recipe information
  activeRecipe?: RecipeResponseDto; // Active/selected recipe version
  recipes?: RecipeResponseDto[]; // All recipes for this product (optional, for detailed view)
  recipeCount?: number; // Total number of recipes
}

export class PaginatedCostedProductsResponse {
  data: CostedProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

