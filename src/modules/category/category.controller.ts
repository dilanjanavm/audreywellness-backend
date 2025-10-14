// src/modules/category/category.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseFilters,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import * as categoryInterface from '../../common/interfaces/category.interface';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

@Controller('categories')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(TransformInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: categoryInterface.CreateCategoryDto,
  ): Promise<{ data: categoryInterface.CategoryResponseDto }> {
    const category = await this.categoryService.create(createCategoryDto);
    return { data: category };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<{ data: categoryInterface.CategoryResponseDto[] }> {
    const categories = await this.categoryService.findAll();
    return { data: categories };
  }

  @Get(':categoryId')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('categoryId') categoryId: string,
  ): Promise<{ data: categoryInterface.CategoryResponseDto }> {
    const category = await this.categoryService.findOne(categoryId);
    return { data: category };
  }

  @Put(':categoryId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: categoryInterface.UpdateCategoryDto,
  ): Promise<{ data: categoryInterface.CategoryResponseDto }> {
    const category = await this.categoryService.update(
      categoryId,
      updateCategoryDto,
    );
    return { data: category };
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('categoryId') categoryId: string): Promise<void> {
    await this.categoryService.remove(categoryId);
  }
}
