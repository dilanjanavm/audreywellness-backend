// src/common/interfaces/item.interface.ts
import { UnitType } from '../enums/item.enum';
import { Supplier } from '../../modules/suppliers/entities/supplier.entity';

export interface CreateItemDto {
  itemCode: string;
  stockId: string;
  description: string;
  category: string;
  units: UnitType;
  price?: number;
  altPrice?: number;
  currency?: string;
  supplierIds?: string[]; // Array of supplier IDs
}

export interface UpdateItemDto {
  description?: string;
  category?: string;
  units?: UnitType;
  price?: number;
  altPrice?: number;
  currency?: string;
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
  suppliers?: Supplier[]; // Include suppliers in response
  createdAt: Date;
  updatedAt: Date;
}
