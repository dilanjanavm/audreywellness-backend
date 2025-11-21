// src/modules/costing/dto/items-with-costing.dto.ts
import { ItemResponseDto } from '../../../common/interfaces/item.interface';
import { CostingResponseDto } from './costing-response.dto';
import { Status } from '../../../common/enums/status';

export class ItemWithCostingResponseDto implements ItemResponseDto {
  id: string;
  itemCode: string;
  stockId: string;
  description: string;
  category: string;
  categoryId?: string;
  units: string;
  price: number;
  altPrice: number;
  currency: string;
  status: Status;
  suppliers: any[];
  createdAt: Date;
  updatedAt: Date;

  // Costing specific fields
  hasCostingRecords: boolean;
  latestCostingRecordDetails?: CostingResponseDto;
}

// Re-export the missing DTOs from their respective files
export {
  ItemsWithCostingQueryDto,
  PaginatedItemsWithCostingResponse,
} from './items-with-costing-query.dto';
export { ItemsByCategoriesDto } from './ItemsByCategoriesDto';
