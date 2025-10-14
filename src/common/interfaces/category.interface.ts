// src/common/interfaces/category.interface.ts
export interface Category {
  id?: string;
  categoryId: string;
  categoryName: string;
  categoryDesc?: string;
  categoryColor?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCategoryDto {
  categoryId: string;
  categoryName: string;
  categoryDesc?: string;
  categoryColor?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CategoryResponseDto extends Category {}
