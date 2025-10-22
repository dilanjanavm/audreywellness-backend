// src/modules/prices/prices.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PricesService, ImportResult, PriceStats } from './prices.service';
import { PriceEntity } from './entities/price.entity';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';

@Controller('prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() createPriceDto: CreatePriceDto): Promise<PriceEntity> {
    return this.pricesService.create(createPriceDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseBoolPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseBoolPipe) limit: number = 10,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('includeRelations', new DefaultValuePipe(true), ParseBoolPipe)
    includeRelations: boolean = true,
  ): Promise<{
    data: PriceEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.pricesService.findAll(
      page,
      limit,
      search,
      categoryId,
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
      includeRelations,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getStats(): Promise<PriceStats> {
    return this.pricesService.getStats();
  }

  @Get('category/id/:categoryId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<PriceEntity[]> {
    return this.pricesService.getByCategory(categoryId);
  }

  @Get('category/name/:categoryName')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getByCategoryName(
    @Param('categoryName') categoryName: string,
  ): Promise<PriceEntity[]> {
    return this.pricesService.getByCategoryName(categoryName);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeRelations', new DefaultValuePipe(true), ParseBoolPipe)
    includeRelations: boolean = true,
  ): Promise<PriceEntity> {
    return this.pricesService.findOne(id, includeRelations);
  }

  @Get('stock/:stockId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findByStockId(
    @Param('stockId') stockId: string,
    @Query('includeRelations', new DefaultValuePipe(true), ParseBoolPipe)
    includeRelations: boolean = true,
  ): Promise<PriceEntity> {
    return this.pricesService.findByStockId(stockId, includeRelations);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePriceDto: UpdatePriceDto,
  ): Promise<PriceEntity> {
    return this.pricesService.update(id, updatePriceDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.pricesService.remove(id);
  }

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async importPrices(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (
      !file.mimetype?.includes('csv') &&
      !file.originalname?.endsWith('.csv')
    ) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    return this.pricesService.importFromCsv(file.buffer);
  }

  // @ts-ignore
  @Get('export/csv')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async exportPrices(@Res() res: express.Response): Promise<void> {
    const csvContent = await this.pricesService.exportToCsv();

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="prices_export.csv"',
    });

    res.send(csvContent);
  }
}