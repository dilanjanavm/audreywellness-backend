// src/modules/item/item-management.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { ItemType, MBFlag, UnitType } from '../../common/enums/item.enum';
import { CategoryService } from '../category/category.service';

@Injectable()
export class ItemManagementService {
  // Updated headers to match simplified structure
  private readonly EXPECTED_HEADERS = [
    'type',
    'item_code',
    'stock_id',
    'isbn_no',
    'description',
    'category',
    'units',
    'dummy',
    'mb_flag',
    'category_id',
    'price',
    'alt_price',
    'sales_account',
    'inventory_account',
    'cogs_account',
    'adjustment_account',
    'wip_account',
    'hs_code',
    'long_description',
  ];

  constructor(
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    private readonly categoryService: CategoryService,
  ) {}

  // CRUD Operations
  async create(createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    try {
      console.log('Received DTO:', createItemDto);

      this.validateMandatoryFields(createItemDto);

      const existingItem = await this.itemRepository.findOne({
        where: { itemCode: createItemDto.itemCode },
      });

      if (existingItem) {
        throw new BadRequestException(
          `Item with code ${createItemDto.itemCode} already exists`,
        );
      }

      // Check if category exists
      await this.categoryService.findOne(createItemDto.categoryId);

      const item = this.itemRepository.create(createItemDto);
      console.log('Item entity created:', item);

      const savedItem = await this.itemRepository.save(item);
      console.log('Item saved successfully:', savedItem);

      return this.mapToResponseDto(savedItem);
    } catch (error) {
      console.error('Error creating item:', error);
      throw error; // Re-throw to see the actual error
    }
  }
  private validateMandatoryFields(createItemDto: CreateItemDto): void {
    const mandatoryFields = [
      'type',
      'itemCode',
      'stockId',
      'description',
      'categoryId',
      'units',
      'mbFlag',
      'salesAccount',
      'inventoryAccount',
      'cogsAccount',
      'adjustmentAccount',
      'wipAccount',
    ];

    const missingFields = mandatoryFields.filter(
      (field) => !createItemDto[field],
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing mandatory fields: ${missingFields.join(', ')}`,
      );
    }
  }

  async findAll(): Promise<ItemResponseDto[]> {
    const items = await this.itemRepository.find({
      order: { itemCode: 'ASC' },
    });
    return items.map((item) => this.mapToResponseDto(item));
  }

  async findOne(itemCode: string): Promise<ItemResponseDto> {
    const item = await this.itemRepository.findOne({
      where: { itemCode },
    });

    if (!item) {
      throw new NotFoundException(`Item with code ${itemCode} not found`);
    }

    return this.mapToResponseDto(item);
  }

  async update(
    itemCode: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    const item = await this.itemRepository.findOne({ where: { itemCode } });

    if (!item) {
      throw new NotFoundException(`Item with code ${itemCode} not found`);
    }

    if (updateItemDto.categoryId) {
      await this.categoryService.findOne(updateItemDto.categoryId);
    }

    const updatedItem = await this.itemRepository.save({
      ...item,
      ...updateItemDto,
    });

    return this.mapToResponseDto(updatedItem);
  }

  async remove(itemCode: string): Promise<void> {
    const result: DeleteResult = await this.itemRepository.delete({ itemCode });

    if (result.affected === 0) {
      throw new NotFoundException(`Item with code ${itemCode} not found`);
    }
  }

  async bulkRemove(itemCodes: string[]): Promise<{ deletedCount: number }> {
    const result: DeleteResult = await this.itemRepository.delete({
      itemCode: In(itemCodes),
    });
    return { deletedCount: result.affected || 0 };
  }

  // CSV Operations - Updated for simplified structure
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

      // Validate headers
      const headers = this.parseLine(lines[0]);
      if (!this.validateHeaders(headers)) {
        result.errors.push(
          'Invalid CSV headers. Expected format does not match.',
        );
        return result;
      }

      const itemsToSave: ItemEntity[] = [];

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        result.totalProcessed++;

        try {
          const rowData: string[] = this.parseLine(lines[i]);
          const itemData = this.mapRowToItemData(rowData, headers);

          if (itemData) {
            const itemCode = await this.generateItemCode();
            const stockId = await this.generateStockId();

            const item = this.itemRepository.create({
              type: itemData.type,
              itemCode: itemCode,
              stockId: stockId,
              isbnNo: itemData.isbnNo,
              description: itemData.description,
              categoryId: itemData.categoryId,
              units: itemData.units,
              dummy: itemData.dummy,
              mbFlag: itemData.mbFlag,
              price: itemData.price,
              altPrice: itemData.altPrice,
              salesAccount: itemData.salesAccount,
              inventoryAccount: itemData.inventoryAccount,
              cogsAccount: itemData.cogsAccount,
              adjustmentAccount: itemData.adjustmentAccount,
              wipAccount: itemData.wipAccount,
              hsCode: itemData.hsCode,
              longDescription: itemData.longDescription,
            });

            itemsToSave.push(item);
            result.totalImported++;
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Row ${i + 1}: ${errorMessage}`);
        }
      }

      if (itemsToSave.length > 0) {
        const savedItems = await this.itemRepository.save(itemsToSave);
        result.data = savedItems.map((item) => this.mapToResponseDto(item));
      }

      result.success = result.errors.length === 0;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`CSV parsing failed: ${errorMessage}`);
    }

    return result;
  }

  async exportToCSV(options: CSVExportOptions = {}): Promise<string> {
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
  }

  // Search and Filter
  async search(searchTerm: string): Promise<ItemResponseDto[]> {
    const items = await this.itemRepository.find({
      where: [
        { description: Like(`%${searchTerm}%`) },
        { itemCode: Like(`%${searchTerm}%`) },
      ],
      order: { itemCode: 'ASC' },
    });

    return items.map((item) => this.mapToResponseDto(item));
  }

  async findByCategory(categoryId: string): Promise<ItemResponseDto[]> {
    const items = await this.itemRepository.find({
      where: { categoryId },
      order: { itemCode: 'ASC' },
    });

    return items.map((item) => this.mapToResponseDto(item));
  }

  // Private methods
  private async generateItemCode(): Promise<string> {
    const lastItem = await this.itemRepository.findOne({
      where: {},
      order: { itemCode: 'DESC' },
    });

    if (!lastItem) {
      return '0001';
    }

    const lastCode = parseInt(lastItem.itemCode);
    return (lastCode + 1).toString().padStart(4, '0');
  }

  private async generateStockId(): Promise<string> {
    return this.generateItemCode();
  }

  private mapToResponseDto(item: ItemEntity): ItemResponseDto {
    return {
      id: item.id,
      type: item.type,
      itemCode: item.itemCode,
      stockId: item.stockId,
      isbnNo: item.isbnNo,
      description: item.description,
      categoryName: item.category?.categoryName || '',
      categoryId: item.categoryId,
      units: item.units,
      dummy: item.dummy,
      mbFlag: item.mbFlag,
      price: item.price,
      altPrice: item.altPrice,
      salesAccount: item.salesAccount,
      inventoryAccount: item.inventoryAccount,
      cogsAccount: item.cogsAccount,
      adjustmentAccount: item.adjustmentAccount,
      wipAccount: item.wipAccount,
      hsCode: item.hsCode,
      longDescription: item.longDescription,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private parseLine(line: string): string[] {
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

  private validateHeaders(headers: string[]): boolean {
    return JSON.stringify(headers) === JSON.stringify(this.EXPECTED_HEADERS);
  }

  private mapRowToItemData(
    rowData: string[],
    headers: string[],
  ): CreateItemDto | null {
    if (rowData.length !== headers.length) {
      throw new Error(
        `Column count mismatch. Expected ${headers.length}, got ${rowData.length}`,
      );
    }

    const rowObject: { [key: string]: string } = {};
    headers.forEach((header, index) => {
      rowObject[header] = rowData[index] || '';
    });

    // Validate required fields
    if (!rowObject.description) {
      throw new Error('Missing required field: description is required');
    }

    // Parse numeric fields
    const price = rowObject.price ? parseFloat(rowObject.price) : 0;
    const altPrice = rowObject.alt_price ? parseFloat(rowObject.alt_price) : 0;

    return {
      type: this.parseItemType(rowObject.type),
      itemCode: '', // Will be generated
      stockId: '', // Will be generated
      isbnNo: rowObject.isbn_no,
      description: rowObject.description,
      categoryId: rowObject.category_id,
      units: this.parseUnitType(rowObject.units),
      dummy: rowObject.dummy,
      mbFlag: this.parseMBFlag(rowObject.mb_flag),
      price: isNaN(price) ? 0 : price,
      altPrice: isNaN(altPrice) ? 0 : altPrice,
      salesAccount: rowObject.sales_account,
      inventoryAccount: rowObject.inventory_account,
      cogsAccount: rowObject.cogs_account,
      adjustmentAccount: rowObject.adjustment_account,
      wipAccount: rowObject.wip_account,
      hsCode: rowObject.hs_code,
      longDescription: rowObject.long_description,
    };
  }

  private parseItemType(value: string): ItemType {
    if (!value) return ItemType.ITEM;

    const upperValue = value.toUpperCase();
    if (upperValue.includes('SERVICE')) return ItemType.SERVICE;
    if (upperValue.includes('RAW MATERIAL')) return ItemType.RAW_MATERIAL;
    if (upperValue.includes('CONSUMER PRODUCT'))
      return ItemType.CONSUMER_PRODUCT;
    if (upperValue.includes('FRAGRANCES')) return ItemType.FRAGRANCES_EO;
    if (upperValue.includes('HOUSE KEEPING')) return ItemType.HOUSE_KEEPING;
    if (upperValue.includes('PACKING MATERIAL'))
      return ItemType.PACKING_MATERIAL;
    if (upperValue.includes('CUSTOMIZED RANGE'))
      return ItemType.CUSTOMIZED_RANGE;
    if (upperValue.includes('STOCKS OF WORK IN PROGRESS'))
      return ItemType.STOCKS_WIP;
    if (upperValue.includes('FURNITURE AND EQUIPMENT'))
      return ItemType.FURNITURE_EQUIPMENT;
    if (upperValue.includes('MACHINAERY AND EQUIPMENT'))
      return ItemType.MACHINERY_EQUIPMENT;
    if (upperValue.includes('LAB MACHINERY AND EQUPMENT'))
      return ItemType.LAB_MACHINERY;
    if (upperValue.includes('COMPUTER AND EQUIPMENTS'))
      return ItemType.COMPUTER_EQUIPMENT;
    if (upperValue.includes('FACTORY BULDING'))
      return ItemType.FACTORY_BUILDING;
    return ItemType.ITEM;
  }

  private parseUnitType(value: string): UnitType {
    if (!value) return UnitType.PCS;

    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('kg')) return UnitType.KG;
    if (lowerValue.includes('ltr')) return UnitType.LTR;
    if (lowerValue.includes('boxes')) return UnitType.BOXES;
    if (lowerValue.includes('nos')) return UnitType.NOS;
    return UnitType.PCS;
  }

  private parseMBFlag(value: string): MBFlag {
    if (!value) return MBFlag.B;

    switch (value.toUpperCase()) {
      case 'M':
        return MBFlag.M;
      case 'D':
        return MBFlag.D;
      case 'F':
        return MBFlag.F;
      default:
        return MBFlag.B;
    }
  }

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
        item.type,
        item.itemCode,
        item.stockId,
        item.isbnNo,
        this.escapeCSVField(item.description),
        item.category?.categoryName || '',
        item.units,
        item.dummy,
        item.mbFlag,
        item.categoryId,
        item.price?.toString() || '0',
        item.altPrice?.toString() || '0',
        item.salesAccount,
        item.inventoryAccount,
        item.cogsAccount,
        item.adjustmentAccount,
        item.wipAccount,
        item.hsCode,
        this.escapeCSVField(item.longDescription),
      ];
      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  private escapeCSVField(field: string): string {
    if (!field) return '';
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
