import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from '../../common/interfaces/category.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check if categoryId already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { categoryId: createCategoryDto.categoryId },
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Category with ID ${createCategoryDto.categoryId} already exists`,
      );
    }

    const category = this.categoryRepository.create(createCategoryDto);
    const savedCategory = await this.categoryRepository.save(category);
    return this.mapToResponseDto(savedCategory);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      order: { categoryId: 'ASC' },
    });
    return categories.map((category) => this.mapToResponseDto(category));
  }

  async findOne(categoryId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.mapToResponseDto(category);
  }

  async update(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const updatedCategory = await this.categoryRepository.save({
      ...category,
      ...updateCategoryDto,
    });

    return this.mapToResponseDto(updatedCategory);
  }

  async remove(categoryId: string): Promise<void> {
    const result = await this.categoryRepository.delete({ categoryId });

    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
  }

  private mapToResponseDto(category: CategoryEntity): CategoryResponseDto {
    return {
      id: category.id,
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      categoryDesc: category.categoryDesc,
      categoryColor: category.categoryColor,
      status: category.status, // Added status
      createdAt: category.createdAt, // Added createdAt
      updatedAt: category.updatedAt, // Added updatedAt
    };
  }
}
