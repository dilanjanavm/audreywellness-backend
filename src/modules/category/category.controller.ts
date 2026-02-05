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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CategoryService } from './category.service';
import * as categoryInterface from '../../common/interfaces/category.interface';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(TransformInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('CATEGORY_CREATE')
  async create(
    @Body() createCategoryDto: categoryInterface.CreateCategoryDto,
  ): Promise<{ data: categoryInterface.CategoryResponseDto }> {
    const category = await this.categoryService.create(createCategoryDto);
    return { data: category };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('CATEGORY_VIEW')
  async findAll(): Promise<{ data: categoryInterface.CategoryResponseDto[] }> {
    const categories = await this.categoryService.findAll();
    return { data: categories };
  }

  @Get(':categoryId')
  @HttpCode(HttpStatus.OK)
  @Permissions('CATEGORY_VIEW')
  async findOne(
    @Param('categoryId') categoryId: string,
  ): Promise<{ data: categoryInterface.CategoryResponseDto }> {
    const category = await this.categoryService.findOne(categoryId);
    return { data: category };
  }

  @Put(':categoryId')
  @HttpCode(HttpStatus.OK)
  @Permissions('CATEGORY_UPDATE')
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
  @Permissions('CATEGORY_DELETE')
  async remove(@Param('categoryId') categoryId: string): Promise<void> {
    await this.categoryService.remove(categoryId);
  }
}
