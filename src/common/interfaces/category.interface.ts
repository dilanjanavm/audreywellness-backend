// src/common/interfaces/category.interface.ts
export interface CreateCategoryDto {
  categoryId: string;
  categoryName: string;
  categoryDesc?: string;
  categoryColor?: string; // Add color field
}

export interface UpdateCategoryDto {
  categoryName?: string;
  categoryDesc?: string;
  categoryColor?: string;
}

export interface CategoryResponseDto {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryDesc?: string;
  categoryColor?: string;
  createdAt: Date;
  updatedAt: Date;
}