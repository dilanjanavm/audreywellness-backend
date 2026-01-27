// src/modules/suppliers/suppliers.controller.ts
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
  ParseIntPipe,
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
import {
  SuppliersService,
  ImportResult,
  SupplierStats,
} from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { ItemEntity } from '../item/entities/item.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
  ): Promise<Supplier> {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
    @Query('active', new DefaultValuePipe(undefined), ParseBoolPipe)
    active?: boolean,
    @Query(
      'includeItems',
      new DefaultValuePipe(false),
      ParseBoolPipe,
    )
    includeItems?: boolean,
  ) {
    return this.suppliersService.findAll(
      page,
      limit,
      search,
      active,
      includeItems,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats(): Promise<SupplierStats> {
    return this.suppliersService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeItems', new DefaultValuePipe(false), ParseBoolPipe)
    includeItems?: boolean,
  ): Promise<Supplier> {
    return this.suppliersService.findOne(id, includeItems);
  }

  @Get('reference/:reference')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findByReference(
    @Param('reference') reference: string,
    @Query('includeItems', new DefaultValuePipe(false), ParseBoolPipe)
    includeItems?: boolean,
  ): Promise<Supplier> {
    return this.suppliersService.findByReference(reference, includeItems);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.suppliersService.remove(id);
  }

  // ITEM MANAGEMENT ENDPOINTS

  @Get(':id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getSupplierItems(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ItemEntity[]> {
    return this.suppliersService.getSupplierItems(id);
  }

  @Post(':id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addItemsToSupplier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { itemIds: string[] },
  ): Promise<Supplier> {
    if (!body.itemIds || !Array.isArray(body.itemIds)) {
      throw new BadRequestException('itemIds must be an array of UUIDs');
    }

    if (body.itemIds.length === 0) {
      throw new BadRequestException('itemIds array cannot be empty');
    }

    return this.suppliersService.addItemsToSupplier(id, body.itemIds);
  }

  @Delete(':id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async removeItemsFromSupplier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { itemIds: string[] },
  ): Promise<Supplier> {
    if (!body.itemIds || !Array.isArray(body.itemIds)) {
      throw new BadRequestException('itemIds must be an array of UUIDs');
    }

    if (body.itemIds.length === 0) {
      throw new BadRequestException('itemIds array cannot be empty');
    }

    return this.suppliersService.removeItemsFromSupplier(id, body.itemIds);
  }

  @Get('items/:itemId/suppliers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getSuppliersByItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Supplier[]> {
    return this.suppliersService.getSuppliersByItem(itemId);
  }

  // CSV IMPORT/EXPORT ENDPOINTS

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async importSuppliers(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    return this.suppliersService.importFromCsv(file.buffer);
  }

  @Get('export/csv')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async exportSuppliers(@Res() res: express.Response): Promise<void> {
    const csvContent = await this.suppliersService.exportToCsv();

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="suppliers_export.csv"',
    });

    res.send(csvContent);
  }
}
