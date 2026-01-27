import { Status } from '../enums/status';

// src/common/interfaces/category.interface.ts
export interface CreateCategoryDto {
  categoryId: string;
  categoryName: string;
  categoryDesc?: string;
  categoryColor?: string;
  status?: Status;
}

export interface UpdateCategoryDto {
  categoryName?: string;
  categoryDesc?: string;
  categoryColor?: string;
  status?: Status;
}

export interface CategoryResponseDto {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryDesc?: string;
  categoryColor?: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
