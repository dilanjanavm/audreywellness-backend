// src/modules/item/dto/item-response.dto.ts
import { UnitType } from '../../../common/enums/item.enum';
import { Status } from '../../../common/enums/common.enum';
import { CostingResponseDto } from '../../costing/dto/costing-response.dto';

export class ItemWithCostingResponseDto {
  id: string;
  itemCode: string;
  stockId: string;
  description: string;
  category: string;
  categoryId?: string;
  units: UnitType;
  price: number;
  altPrice: number;
  currency: string;
  status: Status;
  suppliers: any[];
  hasCostingRecords: boolean;
  latestCostingRecordDetails?: CostingResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
