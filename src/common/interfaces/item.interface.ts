import { UnitType } from '../enums/item.enum';
import { Status } from '../enums/status';
import { Supplier } from '../../modules/suppliers/entities/supplier.entity';

export interface CreateItemDto {
  itemCode: string;
  stockId: string;
  description: string;
  category: string;
  categoryId?: string;
  units: UnitType;
  price?: number;
  altPrice?: number;
  currency?: string;
  status?: Status;
  supplierIds?: string[]; // Array of supplier IDs
}


export interface UpdateItemDto {
  description?: string;
  category?: string;
  categoryId?: string;
  units?: UnitType;
  price?: number;
  altPrice?: number;
  currency?: string;
  status?: Status;
  supplierIds?: string[];
}

export interface ItemResponseDto {
  id: string;
  itemCode: string;
  stockId: string;
  description: string;
  category: string;
  categoryId?: string;
  units: UnitType;
  price?: number;
  altPrice?: number;
  currency?: string;
  status: Status;
  suppliers?: Supplier[]; // Include suppliers in response
  createdAt: Date;
  updatedAt: Date;
}
