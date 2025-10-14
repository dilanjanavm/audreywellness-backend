// src/common/interfaces/item.interface.ts
import { ItemType, MBFlag, UnitType } from '../enums/item.enum';

export interface CreateItemDto {
  type: ItemType;
  itemCode: string;
  stockId: string;
  isbnNo?: string;
  description: string;
  categoryId: string;
  units: UnitType;
  dummy?: string;
  mbFlag: MBFlag;
  price: number;
  altPrice: number;
  salesAccount: string;
  inventoryAccount: string;
  cogsAccount: string;
  adjustmentAccount: string;
  wipAccount: string;
  hsCode?: string;
  longDescription?: string;
}

// Make sure these enums exist and match

export type UpdateItemDto = Partial<CreateItemDto>;

export interface ItemResponseDto {
  id: string;
  type: ItemType;
  itemCode: string;
  stockId: string;
  isbnNo?: string;
  description: string;
  categoryName: string;
  categoryId: string;
  units: UnitType;
  dummy?: string;
  mbFlag: MBFlag;
  price: number;
  altPrice: number;
  salesAccount: string;
  inventoryAccount: string;
  cogsAccount: string;
  adjustmentAccount: string;
  wipAccount: string;
  hsCode?: string;
  longDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}
