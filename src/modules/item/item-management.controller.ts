// src/modules/item/item-management.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseArrayPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ItemManagementService } from './item-management.service';
import * as itemInterface from '../../common/interfaces/item.interface';
import {
  CSVImportResult,
  CSVExportOptions,
} from '../../common/interfaces/csv.interface';
import { Response } from 'express';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemManagementController {
  constructor(private readonly itemService: ItemManagementService) { }

  // ========== BASIC CRUD ENDPOINTS ==========

  /**
   * Create a new item
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('ITEM_CREATE')
  async create(
    @Body() createItemDto: itemInterface.CreateItemDto,
  ): Promise<{ message: string; data: itemInterface.ItemResponseDto }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const item = await this.itemService.create(createItemDto);
      return {
        message: 'Item created successfully',
        data: item,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all items with pagination and filters
   * 🔄 UPDATED - Added category ID filtering
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Query('search') search?: string,
    @Query('category') category?: string, // Category ID (UUID) - NEW
    @Query('includeSuppliers', new DefaultValuePipe(false), ParseBoolPipe)
    includeSuppliers?: boolean,
  ): Promise<{
    data: itemInterface.ItemResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // eslint-disable-next-line no-useless-catch
    try {
      // Use unified filter method that handles both search and category
      const items = await this.itemService.findWithFilters(
        search,
        category, // category is now treated as categoryId (UUID)
        includeSuppliers,
      );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = items.slice(startIndex, endIndex);

      return {
        data: paginatedItems,
        total: items.length,
        page,
        limit,
        totalPages: Math.ceil(items.length / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all items with pagination (DB optimized)
   */
  @Get('paginated')
  @Permissions('ITEM_VIEW')
  async findAllPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('includeSuppliers', new DefaultValuePipe(false), ParseBoolPipe)
    includeSuppliers?: boolean,
  ): Promise<{
    data: itemInterface.ItemResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { items, total } = await this.itemService.findWithPagination(
        page,
        limit,
        search,
        category,
        includeSuppliers,
      );

      return {
        data: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get item by item code
   */
  @Get(':itemCode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async findOne(
    @Param('itemCode') itemCode: string,
    @Query('includeSuppliers', new DefaultValuePipe(false), ParseBoolPipe)
    includeSuppliers?: boolean,
  ): Promise<{ data: itemInterface.ItemResponseDto }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const item = await this.itemService.findOne(itemCode, includeSuppliers);
      return { data: item };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an item
   */
  @Put(':itemCode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('ITEM_UPDATE')
  async update(
    @Param('itemCode') itemCode: string,
    @Body() updateItemDto: itemInterface.UpdateItemDto,
  ): Promise<{ message: string; data: itemInterface.ItemResponseDto }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const item = await this.itemService.update(itemCode, updateItemDto);
      return {
        message: 'Item updated successfully',
        data: item,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an item
   */
  @Delete(':itemCode')
  @Roles(UserRole.ADMIN)
  @Permissions('ITEM_DELETE')
  async remove(
    @Param('itemCode') itemCode: string,
  ): Promise<{ message: string }> {
    // eslint-disable-next-line no-useless-catch
    try {
      await this.itemService.remove(itemCode);
      return { message: 'Item deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // ========== BULK OPERATIONS ==========

  /**
   * Bulk delete items
   */
  @Post('bulk-remove')
  @Roles(UserRole.ADMIN)
  @Permissions('ITEM_DELETE')
  async bulkRemove(
    @Body('itemCodes', ParseArrayPipe) itemCodes: string[],
  ): Promise<{ message: string; deletedCount: number }> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!itemCodes || itemCodes.length === 0) {
        throw new BadRequestException('itemCodes array cannot be empty');
      }

      const result = await this.itemService.bulkRemove(itemCodes);
      return {
        message: `${result.deletedCount} items deleted successfully`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw error;
    }
  }

  // ========== SUPPLIER MANAGEMENT ENDPOINTS ==========

  /**
   * Get all suppliers for an item
   */
  @Get(':itemCode/suppliers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW', 'SUPPLIER_VIEW')
  async getItemSuppliers(
    @Param('itemCode') itemCode: string,
  ): Promise<{ data: any[] }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const item = await this.itemService.findOne(itemCode, true);
      return { data: item.suppliers || [] };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add suppliers to an item
   */
  @Post(':itemCode/suppliers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('ITEM_UPDATE')
  async addSuppliersToItem(
    @Param('itemCode') itemCode: string,
    @Body() body: { supplierIds: string[] },
  ): Promise<{ message: string; data: itemInterface.ItemResponseDto }> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!body.supplierIds || !Array.isArray(body.supplierIds)) {
        throw new BadRequestException('supplierIds must be an array of UUIDs');
      }

      if (body.supplierIds.length === 0) {
        throw new BadRequestException('supplierIds array cannot be empty');
      }

      const item = await this.itemService.addSuppliersToItem(
        itemCode,
        body.supplierIds,
      );

      return {
        message: `${body.supplierIds.length} supplier(s) added to item successfully`,
        data: item,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove suppliers from an item
   */
  @Delete(':itemCode/suppliers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('ITEM_UPDATE')
  async removeSuppliersFromItem(
    @Param('itemCode') itemCode: string,
    @Body() body: { supplierIds: string[] },
  ): Promise<{ message: string; data: itemInterface.ItemResponseDto }> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!body.supplierIds || !Array.isArray(body.supplierIds)) {
        throw new BadRequestException('supplierIds must be an array of UUIDs');
      }

      if (body.supplierIds.length === 0) {
        throw new BadRequestException('supplierIds array cannot be empty');
      }

      const item = await this.itemService.removeSuppliersFromItem(
        itemCode,
        body.supplierIds,
      );

      return {
        message: `${body.supplierIds.length} supplier(s) removed from item successfully`,
        data: item,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all items by supplier
   */
  @Get('supplier/:supplierId/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async getItemsBySupplier(
    @Param('supplierId') supplierId: string,
  ): Promise<{ data: itemInterface.ItemResponseDto[] }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const items = await this.itemService.getItemsBySupplier(supplierId);
      return { data: items };
    } catch (error) {
      throw error;
    }
  }

  // ========== CSV IMPORT/EXPORT ENDPOINTS ==========

  /**
   * Import items from CSV content
   */
  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('ITEM_CREATE')
  async importFromCSV(
    @Body('csvContent') csvContent: string,
  ): Promise<CSVImportResult> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!csvContent || csvContent.trim().length === 0) {
        throw new BadRequestException('CSV content is required');
      }

      console.log(
        'Received CSV content for import, length:',
        csvContent.length,
      );
      return await this.itemService.importFromCSV(csvContent);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Import items from CSV file upload
   */
  @Post('import/upload')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('ITEM_CREATE')
  @UseInterceptors(FileInterceptor('file'))
  async importFromCSVFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CSVImportResult> {
    console.log(file);
    // eslint-disable-next-line no-useless-catch
    try {
      if (!file) {
        throw new BadRequestException('CSV file is required');
      }

      if (
        !file.mimetype.includes('csv') &&
        !file.originalname.endsWith('.csv')
      ) {
        throw new BadRequestException('Only CSV files are allowed');
      }

      if (file.size === 0) {
        throw new BadRequestException('CSV file is empty');
      }

      const csvContent = file.buffer.toString('utf-8');
      console.log(
        'Processing CSV file upload:',
        file.originalname,
        'Size:',
        file.size,
      );

      return await this.itemService.importFromCSV(csvContent);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export items to CSV
   */
  @Get('export/csv')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async exportToCSV(
    @Query('includeHeaders', new DefaultValuePipe(true), ParseBoolPipe)
    includeHeaders?: boolean,
    @Query('selectedItems') selectedItems?: string,
    @Res() res?: express.Response,
  ): Promise<any> {
    // eslint-disable-next-line no-useless-catch
    try {
      const options: CSVExportOptions = {
        includeHeaders,
      };

      if (selectedItems) {
        options.selectedItems = selectedItems.split(',');
      }

      const csvContent = await this.itemService.exportToCSV(options);

      // If response object is provided, send as file download
      if (res) {
        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="items_export_${new Date().toISOString().split('T')[0]}.csv"`,
          'Content-Length': csvContent.length.toString(),
        });

        return res.status(HttpStatus.OK).send(csvContent);
      }

      // Otherwise return the CSV content
      return csvContent;
    } catch (error) {
      throw error;
    }
  }

  @Post('categories/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async findByCategoryIds(
    @Body() body: { categoryIds: string[] },
  ): Promise<{ data: itemInterface.ItemResponseDto[] }> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!body.categoryIds || !Array.isArray(body.categoryIds)) {
        throw new BadRequestException('categoryIds must be an array of UUIDs');
      }

      if (body.categoryIds.length === 0) {
        throw new BadRequestException('categoryIds array cannot be empty');
      }

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const categoryId of body.categoryIds) {
        if (!uuidRegex.test(categoryId)) {
          throw new BadRequestException(`Invalid UUID format: ${categoryId}`);
        }
      }

      const items = await this.itemService.findByCategoryIds(body.categoryIds);
      return { data: items };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download CSV template
   */
  @Get('export/template')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_View')
  downloadTemplate(@Res() res: express.Response): void {
    // eslint-disable-next-line no-useless-catch
    try {
      const templateHeaders = [
        'item_code',
        'stock_id',
        'description',
        'category',
        'units',
        'price',
        'alt_price',
        'currency',
        'status', // Added status column
      ];

      const exampleData = [
        '10001',
        '10001',
        'AC Aqua Bubble Bath 5L',
        'Horeka Range',
        'pcs',
        '1500.00',
        '1400.00',
        'LKR',
        'ACTIVE',
      ];

      const templateContent = [
        templateHeaders.join(','),
        exampleData.join(','),
        '# Fill in your data below this line',
        '# Required fields: item_code, description, category, units',
        '# Optional fields: stock_id, price, alt_price, currency, status',
        '# Units: pcs, Kg, ltr, boxes, Nos',
        '# Status: ACTIVE, INACTIVE (default: ACTIVE)',
        '# Category: Will be auto-created if not exists',
      ].join('\n');

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition':
          'attachment; filename="item_import_template.csv"',
        'Content-Length': templateContent.length.toString(),
      });

      res.status(HttpStatus.OK).send(templateContent);
    } catch (error) {
      throw error;
    }
  }

  // ========== SEARCH AND FILTER ENDPOINTS ==========

  /**
   * Search items by term
   */
  @Get('search/:term')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async search(
    @Param('term') searchTerm: string,
  ): Promise<{ data: itemInterface.ItemResponseDto[] }> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return { data: [] };
      }

      const items = await this.itemService.search(searchTerm);
      return { data: items };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get items by category
   */
  @Get('category/:category/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async findByCategory(
    @Param('category') category: string,
  ): Promise<{ data: itemInterface.ItemResponseDto[] }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const items = await this.itemService.findByCategory(category);
      return { data: items };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all unique categories
   */
  @Get('categories/all')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW', 'CATEGORY_VIEW')
  async getAllCategories(): Promise<{ data: string[] }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const items = await this.itemService.findAll();
      const categories = [
        ...new Set(items.map((item) => item.category)),
      ].sort();
      return { data: categories };
    } catch (error) {
      throw error;
    }
  }

  // ========== STATISTICS AND ANALYTICS ENDPOINTS ==========

  /**
   * Get item statistics
   */
  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('ITEM_VIEW')
  async getStats(): Promise<{
    data: {
      totalItems: number;
      itemsWithSuppliers: number;
      categories: { [key: string]: number };
    };
  }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const stats = await this.itemService.getStats();
      return { data: stats };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get item counts by category
   */
  @Get('stats/categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @Permissions('ITEM_VIEW')
  async getCategoryStats(): Promise<{
    data: Array<{ category: string; count: number }>;
  }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const items = await this.itemService.findAll();
      const categoryCounts = items.reduce(
        (acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        },
        {} as { [key: string]: number },
      );

      const result = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      return { data: result };
    } catch (error) {
      throw error;
    }
  }

  // ========== UTILITY ENDPOINTS ==========

  /**
   * Generate next item code
   */
  @Get('utils/next-code')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async generateNextItemCode(): Promise<{ data: { nextItemCode: string } }> {
    // eslint-disable-next-line no-useless-catch
    try {
      const nextItemCode = await this.itemService.generateNextItemCode();
      return { data: { nextItemCode } };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate item code availability
   */
  @Get('utils/validate-code/:itemCode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async validateItemCode(
    @Param('itemCode') itemCode: string,
  ): Promise<{ data: { available: boolean; message: string } }> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!itemCode || itemCode.trim().length === 0) {
        return { data: { available: false, message: 'Item code is required' } };
      }

      // Check if item code already exists
      try {
        await this.itemService.findOne(itemCode);
        return {
          data: { available: false, message: 'Item code already exists' },
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          return {
            data: { available: true, message: 'Item code is available' },
          };
        }
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    totalItems: number;
    service: string;
  }> {
    try {
      const totalItems = await this.itemService
        .findAll()
        .then((items) => items.length);

      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        totalItems,
        service: 'Item Management Service',
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        totalItems: 0,
        service: 'Item Management Service',
      };
    }
  }

  /**
   * Get item units enum values
   */
  @Get('utils/units')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  getUnitTypes(): {
    data: Array<{ value: string; label: string }>;
  } {
    // eslint-disable-next-line no-useless-catch
    try {
      const units = [
        { value: 'pcs', label: 'Pieces' },
        { value: 'Kg', label: 'Kilograms' },
        { value: 'ltr', label: 'Liters' },
        { value: 'boxes', label: 'Boxes' },
        { value: 'Nos', label: 'Numbers' },
      ];

      return { data: units };
    } catch (error) {
      throw error;
    }
  }
}
