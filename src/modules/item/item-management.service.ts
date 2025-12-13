// src/modules/item/item-management.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, DeleteResult } from 'typeorm';
import { ItemEntity } from './entities/item.entity';
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
} from '../../common/interfaces/item.interface';
import {
  CSVImportResult,
  CSVExportOptions,
} from '../../common/interfaces/csv.interface';
import { UnitType } from '../../common/enums/item.enum';
import { CategoryService } from '../category/category.service';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Status } from '../../common/enums/status';

@Injectable()
export class ItemManagementService {
  private readonly EXPECTED_HEADERS = [
    'item_code',
    'stock_id',
    'description',
    'category',
    'units',
    'price',
    'alt_price',
    'currency',
    'status',
  ];

  constructor(
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly categoryService: CategoryService,
  ) {}

  // ========== CRUD OPERATIONS ==========

  /**
   * Create a new item
   */
  async create(createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    try {
      console.log('Creating item with data:', createItemDto);

      // Check if item code already exists
      const existingItem = await this.itemRepository.findOne({
        where: { itemCode: createItemDto.itemCode },
      });

      if (existingItem) {
        throw new BadRequestException(
          `Item with code ${createItemDto.itemCode} already exists`,
        );
      }

      const item = this.itemRepository.create(createItemDto);

      // Handle suppliers if provided
      if (createItemDto.supplierIds && createItemDto.supplierIds.length > 0) {
        const suppliers = await this.supplierRepository.find({
          where: { id: In(createItemDto.supplierIds) },
        });

        if (suppliers.length !== createItemDto.supplierIds.length) {
          throw new BadRequestException('Some suppliers were not found');
        }

        item.suppliers = suppliers;
      }

      const savedItem = await this.itemRepository.save(item);
      console.log('Item created successfully:', savedItem.itemCode);

      return this.mapToResponseDto(savedItem);
    } catch (error) {
      console.error('Error creating item:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create item');
    }
  }

  /**
   * Find all items with optional supplier inclusion
   */
  async findAll(includeSuppliers: boolean = false): Promise<ItemResponseDto[]> {
    try {
      const options: any = {
        order: { itemCode: 'ASC' },
      };

      if (includeSuppliers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        options.relations = ['suppliers'];
      }

      const items = await this.itemRepository.find(options);
      return items.map((item) => this.mapToResponseDto(item));
    } catch (error) {
      console.error('Error finding all items:', error);
      throw new InternalServerErrorException('Failed to retrieve items');
    }
  }

  async findByCategoryIds(categoryIds: string[]): Promise<ItemResponseDto[]> {
    try {
      if (!categoryIds || categoryIds.length === 0) {
        throw new BadRequestException('Category IDs array cannot be empty');
      }

      // Validate that all category IDs exist
      const categories = await this.categoryRepository.find({
        where: { id: In(categoryIds) },
      });

      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('Some category IDs were not found');
      }

      const items = await this.itemRepository.find({
        where: { categoryId: In(categoryIds) },
        relations: ['suppliers'], // Include suppliers for costing
        order: { itemCode: 'ASC' },
      });

      return items.map((item) => this.mapToResponseDto(item));
    } catch (error) {
      console.error('Error finding items by category IDs:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve items by category IDs',
      );
    }
  }

  /**
   * Find item by item code
   */
  async findOne(
    itemCode: string,
    includeSuppliers: boolean = false,
  ): Promise<ItemResponseDto> {
    try {
      const options: any = {
        where: { itemCode },
      };

      if (includeSuppliers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        options.relations = ['suppliers'];
      }

      const item = await this.itemRepository.findOne(options);

      if (!item) {
        throw new NotFoundException(`Item with code ${itemCode} not found`);
      }

      return this.mapToResponseDto(item);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding item:', error);
      throw new InternalServerErrorException('Failed to retrieve item');
    }
  }

  /**
   * Update an existing item
   */
  async update(
    itemCode: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    try {
      const item = await this.itemRepository.findOne({
        where: { itemCode },
        relations: ['suppliers'],
      });

      if (!item) {
        throw new NotFoundException(`Item with code ${itemCode} not found`);
      }

      // Handle suppliers update if provided
      if (updateItemDto.supplierIds !== undefined) {
        if (updateItemDto.supplierIds.length > 0) {
          const suppliers = await this.supplierRepository.find({
            where: { id: In(updateItemDto.supplierIds) },
          });

          if (suppliers.length !== updateItemDto.supplierIds.length) {
            throw new BadRequestException('Some suppliers were not found');
          }

          item.suppliers = suppliers;
        } else {
          // Empty array means remove all suppliers
          item.suppliers = [];
        }
      }

      // Update other fields
      const updatedItem = await this.itemRepository.save({
        ...item,
        ...updateItemDto,
      });

      return this.mapToResponseDto(updatedItem);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating item:', error);
      throw new InternalServerErrorException('Failed to update item');
    }
  }

  /**
   * Delete an item
   */
  async remove(itemCode: string): Promise<void> {
    try {
      const item = await this.itemRepository.findOne({
        where: { itemCode },
        relations: ['suppliers'],
      });

      if (!item) {
        throw new NotFoundException(`Item with code ${itemCode} not found`);
      }

      // Check if item has suppliers before deletion
      if (item.suppliers && item.suppliers.length > 0) {
        throw new BadRequestException(
          `Cannot delete item. There are ${item.suppliers.length} suppliers associated with this item. Remove the suppliers first.`,
        );
      }

      const result: DeleteResult = await this.itemRepository.delete({
        itemCode,
      });

      if (result.affected === 0) {
        throw new NotFoundException(`Item with code ${itemCode} not found`);
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error deleting item:', error);
      throw new InternalServerErrorException('Failed to delete item');
    }
  }

  /**
   * Bulk delete items
   */
  async bulkRemove(itemCodes: string[]): Promise<{ deletedCount: number }> {
    try {
      // Check if any items have suppliers
      const itemsWithSuppliers = await this.itemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.suppliers', 'suppliers')
        .where('item.itemCode IN (:...itemCodes)', { itemCodes })
        .andWhere('suppliers.id IS NOT NULL')
        .getMany();

      if (itemsWithSuppliers.length > 0) {
        throw new BadRequestException(
          `Cannot delete items that have suppliers. Items with suppliers: ${itemsWithSuppliers.map((item) => item.itemCode).join(', ')}`,
        );
      }

      const result: DeleteResult = await this.itemRepository.delete({
        itemCode: In(itemCodes),
      });

      return { deletedCount: result.affected || 0 };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in bulk remove:', error);
      throw new InternalServerErrorException('Failed to bulk delete items');
    }
  }

  // ========== SUPPLIER MANAGEMENT ==========

  /**
   * Add suppliers to an item
   */
  async addSuppliersToItem(
    itemCode: string,
    supplierIds: string[],
  ): Promise<ItemResponseDto> {
    try {
      const item = await this.itemRepository.findOne({
        where: { itemCode },
        relations: ['suppliers'],
      });

      if (!item) {
        throw new NotFoundException(`Item with code ${itemCode} not found`);
      }

      const suppliers = await this.supplierRepository.find({
        where: { id: In(supplierIds) },
      });

      if (suppliers.length !== supplierIds.length) {
        throw new BadRequestException('Some suppliers were not found');
      }

      // Merge existing suppliers with new suppliers
      const existingSuppliers = item.suppliers || [];
      const newSuppliers = [...existingSuppliers, ...suppliers];

      // Remove duplicates based on supplier ID
      const uniqueSuppliers = newSuppliers.reduce((acc, current) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const exists = acc.find((supplier) => supplier.id === current.id);
        if (!exists) {
          return [...acc, current];
        }
        return acc;
      }, []);

      item.suppliers = uniqueSuppliers;
      const updatedItem = await this.itemRepository.save(item);

      return this.mapToResponseDto(updatedItem);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error adding suppliers to item:', error);
      throw new InternalServerErrorException('Failed to add suppliers to item');
    }
  }

  /**
   * Remove suppliers from an item
   */
  async removeSuppliersFromItem(
    itemCode: string,
    supplierIds: string[],
  ): Promise<ItemResponseDto> {
    try {
      const item = await this.itemRepository.findOne({
        where: { itemCode },
        relations: ['suppliers'],
      });

      if (!item) {
        throw new NotFoundException(`Item with code ${itemCode} not found`);
      }

      if (item.suppliers) {
        item.suppliers = item.suppliers.filter(
          (supplier) => !supplierIds.includes(supplier.id),
        );
      }

      const updatedItem = await this.itemRepository.save(item);
      return this.mapToResponseDto(updatedItem);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error removing suppliers from item:', error);
      throw new InternalServerErrorException(
        'Failed to remove suppliers from item',
      );
    }
  }

  /**
   * Get all items by supplier
   */
  async getItemsBySupplier(supplierId: string): Promise<ItemResponseDto[]> {
    try {
      const supplier = await this.supplierRepository.findOne({
        where: { id: supplierId },
        relations: ['items'],
      });

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${supplierId} not found`);
      }

      return supplier.items.map((item) => this.mapToResponseDto(item));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting items by supplier:', error);
      throw new InternalServerErrorException('Failed to get items by supplier');
    }
  }

  // ========== CSV OPERATIONS ==========

  /**
   * Import items from CSV
   */
  /**
   * Import items from CSV with category auto-creation
   */
  async importFromCSV(csvContent: string): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      success: false,
      data: [],
      errors: [],
      totalProcessed: 0,
      totalImported: 0,
    };

    try {
      const lines = csvContent.split('\n').filter((line) => line.trim());

      if (lines.length === 0) {
        result.errors.push('CSV file is empty');
        return result;
      }

      // Process data rows (skip header)
      for (let i = 1; i < lines.length; i++) {
        result.totalProcessed++;

        try {
          const rowData = this.parseCSVLine(lines[i]);

          // Skip empty rows
          if (rowData.every((field: string): boolean => !field.trim())) {
            continue;
          }

          // FIX: Add await here since mapCSVRowToItemData is now async
          const itemData: CreateItemDto | null =
            await this.mapCSVRowToItemData(rowData);

          if (itemData) {
            // Check if item already exists
            const existingItem: ItemEntity | null =
              await this.itemRepository.findOne({
                where: { itemCode: itemData.itemCode },
              });

            if (existingItem) {
              // Update existing item
              const updatedItem = await this.itemRepository.save({
                ...existingItem,
                ...itemData,
              });
              result.data.push(this.mapToResponseDto(updatedItem));
            } else {
              // Create new item
              const item = this.itemRepository.create(itemData);
              const savedItem = await this.itemRepository.save(item);
              result.data.push(this.mapToResponseDto(savedItem));
            }

            result.totalImported++;
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Row ${i + 1}: ${errorMessage}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`CSV parsing failed: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Find or create category by name
   */
  private async findOrCreateCategory(
    categoryName: string,
  ): Promise<{ id: string; categoryId: string }> {
    if (!categoryName?.trim()) {
      throw new BadRequestException('Category name is required');
    }

    // First, try to find by categoryName
    const existingCategory = await this.categoryRepository.findOne({
      where: { categoryName: categoryName.trim() },
    });

    if (existingCategory) {
      return {
        id: existingCategory.id,
        categoryId: existingCategory.categoryId,
      };
    }

    // If not found, create new category
    const newCategoryId = await this.generateNextCategoryId();
    const randomColor = this.generateRandomColor();

    const newCategory = this.categoryRepository.create({
      categoryId: newCategoryId,
      categoryName: categoryName.trim(),
      categoryDesc: `Auto-generated category for ${categoryName}`,
      categoryColor: randomColor,
      status: Status.ACTIVE,
    });

    const savedCategory = await this.categoryRepository.save(newCategory);

    return {
      id: savedCategory.id,
      categoryId: savedCategory.categoryId,
    };
  }

  private generateRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * Generate next category ID (CAT001, CAT002, etc.)
   */
  private async generateNextCategoryId(): Promise<string> {
    const lastCategory = await this.categoryRepository.findOne({
      where: {},
      order: { categoryId: 'DESC' },
    });

    if (!lastCategory) {
      return 'CAT001';
    }

    const matches = lastCategory.categoryId.match(/CAT(\d+)/);
    if (matches && matches[1]) {
      const nextNumber = parseInt(matches[1]) + 1;
      return `CAT${nextNumber.toString().padStart(3, '0')}`;
    }

    // Fallback: generate based on count
    const totalCategories = await this.categoryRepository.count();
    return `CAT${(totalCategories + 1).toString().padStart(3, '0')}`;
  }

  /**
   * Export items to CSV
   */
  async exportToCSV(options: CSVExportOptions = {}): Promise<string> {
    try {
      const { includeHeaders = true, selectedItems } = options;

      let items: ItemEntity[];

      if (selectedItems && selectedItems.length > 0) {
        items = await this.itemRepository.find({
          where: { itemCode: In(selectedItems) },
        });
      } else {
        items = await this.itemRepository.find();
      }

      return this.convertToCSV(items, includeHeaders);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new InternalServerErrorException('Failed to export items to CSV');
    }
  }

  // ========== SEARCH AND FILTER OPERATIONS ==========

  /**
   * Search items by term
   */
  async search(searchTerm: string): Promise<ItemResponseDto[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const trimmedTerm = searchTerm.trim();

      if (trimmedTerm.length < 2) {
        return [];
      }

      const items = await this.itemRepository.find({
        where: [
          { description: Like(`%${trimmedTerm}%`) },
          { itemCode: Like(`%${trimmedTerm}%`) },
          { category: Like(`%${trimmedTerm}%`) },
        ],
        order: { itemCode: 'ASC' },
        take: 50, // Limit results
      });

      return items.map((item) => this.mapToResponseDto(item));
    } catch (error) {
      console.error('Error searching items:', error);
      throw new InternalServerErrorException(
        'Search failed due to server error',
      );
    }
  }

  /**
   * Find items by category (name) - legacy method
   */
  async findByCategory(category: string): Promise<ItemResponseDto[]> {
    try {
      const items = await this.itemRepository.find({
        where: { category },
        order: { itemCode: 'ASC' },
      });

      return items.map((item) => this.mapToResponseDto(item));
    } catch (error) {
      console.error('Error finding items by category:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve items by category',
      );
    }
  }

  /**
   * Find items by category ID (UUID)
   */
  async findByCategoryId(categoryId: string): Promise<ItemResponseDto[]> {
    try {
      // Validate category exists
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }

      const items = await this.itemRepository.find({
        where: { categoryId },
        order: { itemCode: 'ASC' },
      });

      return items.map((item) => this.mapToResponseDto(item));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding items by category ID:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve items by category ID',
      );
    }
  }

  /**
   * Find items with filters (search and category)
   */
  async findWithFilters(
    search?: string,
    categoryId?: string,
    includeSuppliers: boolean = false,
  ): Promise<ItemResponseDto[]> {
    try {
      // If no filters provided, return all items
      if (!search && !categoryId) {
        return this.findAll(includeSuppliers);
      }

      const queryBuilder = this.itemRepository.createQueryBuilder('item');

      let hasWhereClause = false;

      // Add search filter
      if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim()}%`;
        queryBuilder.where(
          '(item.description LIKE :search OR item.itemCode LIKE :search OR item.category LIKE :search)',
          { search: searchTerm },
        );
        hasWhereClause = true;
      }

      // Add category filter (by categoryId UUID)
      if (categoryId) {
        // Validate category exists
        const category = await this.categoryRepository.findOne({
          where: { id: categoryId },
        });
        if (!category) {
          throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }

        if (hasWhereClause) {
          queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId });
        } else {
          queryBuilder.where('item.categoryId = :categoryId', { categoryId });
        }
      }

      // Include suppliers if requested
      if (includeSuppliers) {
        queryBuilder.leftJoinAndSelect('item.suppliers', 'suppliers');
      }

      queryBuilder.orderBy('item.itemCode', 'ASC');

      const items = await queryBuilder.getMany();
      return items.map((item) => this.mapToResponseDto(item));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding items with filters:', error);
      throw new InternalServerErrorException('Failed to retrieve items with filters');
    }
  }

  /**
   * Get item statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    itemsWithSuppliers: number;
    categories: { [key: string]: number };
  }> {
    try {
      const totalItems = await this.itemRepository.count();

      const itemsWithSuppliers = await this.itemRepository
        .createQueryBuilder('item')
        .innerJoin('item.suppliers', 'supplier')
        .getCount();

      // Get category counts
      const categoryCounts = await this.itemRepository
        .createQueryBuilder('item')
        .select('item.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .groupBy('item.category')
        .getRawMany();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const categories = categoryCounts.reduce((acc, curr) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        acc[curr.category] = parseInt(curr.count);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return acc;
      }, {});

      return {
        totalItems,
        itemsWithSuppliers,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        categories,
      };
    } catch (error) {
      console.error('Error getting item stats:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve item statistics',
      );
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(item: ItemEntity): ItemResponseDto {
    return {
      id: item.id,
      itemCode: item.itemCode,
      stockId: item.stockId,
      description: item.description,
      category: item.category,
      categoryId: item.categoryId,
      units: item.units,
      price: item.price,
      altPrice: item.altPrice,
      currency: item.currency,
      status: item.status,
      suppliers: item.suppliers,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Parse CSV line
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Map CSV row to item data
   */
  private async mapCSVRowToItemData(
    rowData: string[],
  ): Promise<CreateItemDto | null> {
    // Expected columns: item_code, stock_id, description, category, units, price, alt_price, currency, status
    if (rowData.length < 5) {
      throw new Error(
        `Invalid row format. Expected at least 5 columns, got ${rowData.length}`,
      );
    }

    const [
      itemCode,
      stockId,
      description,
      category,
      units,
      price,
      altPrice,
      currency,
      status,
    ] = rowData;

    // Validate required fields
    if (!itemCode?.trim()) {
      throw new Error('Missing required field: item_code');
    }
    if (!description?.trim()) {
      throw new Error('Missing required field: description');
    }
    if (!category?.trim()) {
      throw new Error('Missing required field: category');
    }
    if (!units?.trim()) {
      throw new Error('Missing required field: units');
    }

    // Find or create category
    const categoryInfo = await this.findOrCreateCategory(category.trim());

    // Parse numeric fields
    const parsedPrice = price ? parseFloat(price) : 0;
    const parsedAltPrice = altPrice ? parseFloat(altPrice) : 0;

    // Parse status

    const itemStatus = status?.trim()
      ? status.trim().toUpperCase() === 'INACTIVE'
        ? Status.INACTIVE
        : Status.ACTIVE
      : Status.ACTIVE;

    return {
      itemCode: itemCode.trim(),
      stockId: (stockId || itemCode).trim(), // Use itemCode if stockId is empty
      description: description.trim(),
      category: category.trim(), // Store category name
      categoryId: categoryInfo.id, // Store category relationship ID
      units: this.parseUnitType(units.trim()),
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      altPrice: isNaN(parsedAltPrice) ? 0 : parsedAltPrice,
      currency: (currency || 'LKR').trim(),
      status: itemStatus,
    };
  }

  /**
   * Parse unit type from string
   */
  private parseUnitType(value: string): UnitType {
    if (!value) return UnitType.PCS;

    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('kg')) return UnitType.KG;
    if (lowerValue.includes('ltr') || lowerValue.includes('liter'))
      return UnitType.LTR;
    if (lowerValue.includes('boxes')) return UnitType.BOXES;
    if (lowerValue.includes('nos')) return UnitType.NOS;
    return UnitType.PCS;
  }

  /**
   * Convert items to CSV
   */
  private convertToCSV(
    items: ItemEntity[],
    includeHeaders: boolean = true,
  ): string {
    const headers = this.EXPECTED_HEADERS;
    const lines: string[] = [];

    if (includeHeaders) {
      lines.push(headers.join(','));
    }

    items.forEach((item) => {
      const row = [
        item.itemCode,
        item.stockId,
        this.escapeCSVField(item.description),
        this.escapeCSVField(item.category),
        item.units,
        item.price?.toString() || '0',
        item.altPrice?.toString() || '0',
        item.currency || 'LKR',
      ];
      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  /**
   * Escape CSV field
   */
  private escapeCSVField(field: string): string {
    if (!field) return '';
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Validate item code format
   */
  private validateItemCode(itemCode: string): boolean {
    const itemCodeRegex = /^[A-Za-z0-9\-_]+$/;
    return itemCodeRegex.test(itemCode);
  }

  /**
   * Generate next item code (if needed for auto-generation)
   */
  async generateNextItemCode(): Promise<string> {
    try {
      const lastItem = await this.itemRepository.findOne({
        where: {},
        order: { itemCode: 'DESC' },
      });

      if (!lastItem) {
        return 'ITEM-00001';
      }

      const matches = lastItem.itemCode.match(/(\d+)$/);
      if (matches && matches[1]) {
        const nextNumber = parseInt(matches[1]) + 1;
        return `ITEM-${nextNumber.toString().padStart(5, '0')}`;
      }

      // Fallback: generate based on count
      const totalItems = await this.itemRepository.count();
      return `ITEM-${(totalItems + 1).toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating item code:', error);
      throw new InternalServerErrorException('Failed to generate item code');
    }
  }
}
