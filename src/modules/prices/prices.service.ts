// src/modules/prices/prices.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOneOptions, DeepPartial, Entity } from 'typeorm';
import { PriceEntity } from './entities/price.entity';
import { ItemEntity } from '../item/entities/item.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import csv from 'csv-parser';
import * as stream from 'stream';

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface PriceStats {
  totalPrices: number;
  categories: string[];
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
}

@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(PriceEntity)
    private readonly priceRepository: Repository<PriceEntity>,
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  // Create new price entry with relationships
  async create(createPriceDto: CreatePriceDto): Promise<PriceEntity> {
    try {
      // Check if stockId already exists
      const existing = await this.priceRepository.findOne({
        where: {
          stockId: createPriceDto.stockId,
        } as FindOptionsWhere<PriceEntity>,
      });

      if (existing) {
        throw new BadRequestException(
          `Price with stock ID ${createPriceDto.stockId} already exists`,
        );
      }

      // Verify category exists
      const category = await this.categoryRepository.findOne({
        where: {
          id: createPriceDto.categoryId,
        } as FindOptionsWhere<CategoryEntity>,
      });

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${createPriceDto.categoryId} not found`,
        );
      }

      // Verify item exists if provided
      let item = null;
      if (createPriceDto.itemId) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error - TypeORM query builder types are complex, using any for flexibility
        item = await this.itemRepository.findOne({
          where: { id: createPriceDto.itemId } as FindOptionsWhere<ItemEntity>,
        });

        if (!item) {
          throw new BadRequestException(
            `Item with ID ${createPriceDto.itemId} not found`,
          );
        }
      }

      const price = this.priceRepository.create({
        type: createPriceDto.type || 'PRICE',
        stockId: createPriceDto.stockId,
        description: createPriceDto.description,
        itemCode: createPriceDto.itemCode,
        itemId: createPriceDto.itemId,
        categoryId: createPriceDto.categoryId,
        currency: createPriceDto.currency || 'LKR',
        price: createPriceDto.price,
        discount: createPriceDto.discount || 0,
        customer: createPriceDto.customer,
        altPrice: createPriceDto.altPrice,
        supplierCode: createPriceDto.supplierCode,
        supplierName: createPriceDto.supplierName,
      });

      return await this.priceRepository.save(price);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Database error:', error);
      throw new InternalServerErrorException('Failed to create price entry');
    }
  }

  // Find all prices with relationships and filters
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    categoryId?: string,
    minPrice?: number,
    maxPrice?: number,
    includeRelations: boolean = true,
  ): Promise<{
    data: PriceEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    let query = this.priceRepository.createQueryBuilder('price');

    // Load relations if requested
    if (includeRelations) {
      query = query
        .leftJoinAndSelect('price.category', 'category')
        .leftJoinAndSelect('price.item', 'item');
    }

    // Apply filters
    if (search) {
      query = query.andWhere(
        `(price.description LIKE :search OR 
          price.stockId LIKE :search OR 
          price.itemCode LIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      query = query.andWhere('price.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      query = query.andWhere('price.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query = query.andWhere('price.price <= :maxPrice', { maxPrice });
    }

    const [data, total] = await query
      .orderBy('category.name', 'ASC')
      .addOrderBy('price.description', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  // Find price by ID with relationships
  async findOne(
    id: string,
    includeRelations: boolean = true,
  ): Promise<PriceEntity> {
    const options: FindOneOptions<PriceEntity> = {
      where: { id } as FindOptionsWhere<PriceEntity>,
    };

    if (includeRelations) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      options.relations = ['category', 'item'];
    }

    const price = await this.priceRepository.findOne(options);

    if (!price) {
      throw new NotFoundException(`Price with ID ${id} not found`);
    }

    return price;
  }

  // Find price by stock ID with relationships
  async findByStockId(
    stockId: string,
    includeRelations: boolean = true,
  ): Promise<PriceEntity> {
    const options: FindOneOptions<PriceEntity> = {
      where: { stockId } as FindOptionsWhere<PriceEntity>,
    };

    if (includeRelations) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      options.relations = ['category', 'item'];
    }

    const price = await this.priceRepository.findOne(options);

    if (!price) {
      throw new NotFoundException(`Price with stock ID ${stockId} not found`);
    }

    return price;
  }

  // Update price with relationship validation
  async update(
    id: string,
    updatePriceDto: UpdatePriceDto,
  ): Promise<PriceEntity> {
    const price = await this.findOne(id);

    // Check if stockId is being updated and if it already exists
    if (updatePriceDto.stockId && updatePriceDto.stockId !== price.stockId) {
      const existing = await this.priceRepository.findOne({
        where: {
          stockId: updatePriceDto.stockId,
        } as FindOptionsWhere<PriceEntity>,
      });

      if (existing) {
        throw new BadRequestException(
          `Price with stock ID ${updatePriceDto.stockId} already exists`,
        );
      }
    }

    // Verify category exists if being updated
    if (updatePriceDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: updatePriceDto.categoryId,
        } as FindOptionsWhere<CategoryEntity>,
      });

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updatePriceDto.categoryId} not found`,
        );
      }
    }

    // Verify item exists if being updated
    if (updatePriceDto.itemId) {
      const item = await this.itemRepository.findOne({
        where: { id: updatePriceDto.itemId } as FindOptionsWhere<ItemEntity>,
      });

      if (!item) {
        throw new BadRequestException(
          `Item with ID ${updatePriceDto.itemId} not found`,
        );
      }
    }

    await this.priceRepository.update(id, updatePriceDto);

    return await this.findOne(id, true);
  }

  // Delete price
  async remove(id: string): Promise<{ message: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const price = await this.findOne(id);

    await this.priceRepository.delete(id);

    return { message: 'Price entry deleted successfully' };
  }

  // Get price statistics
  async getStats(): Promise<PriceStats> {
    const totalPrices = await this.priceRepository.count();

    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .innerJoin('category.prices', 'price')
      .select('DISTINCT category.name', 'name')
      .getRawMany();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const priceStats = await this.priceRepository
      .createQueryBuilder('price')
      .select('MIN(price.price)', 'min')
      .addSelect('MAX(price.price)', 'max')
      .addSelect('AVG(price.price)', 'average')
      .getRawOne();

    return {
      totalPrices,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
      categories: categories.map((c) => c.name),
      priceRange: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        min: parseFloat(priceStats.min) || 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        max: parseFloat(priceStats.max) || 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        average: parseFloat(priceStats.average) || 0,
      },
    };
  }


  // Get prices by category ID
  async getByCategory(categoryId: string): Promise<PriceEntity[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId } as FindOptionsWhere<CategoryEntity>,
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return await this.priceRepository.find({
      where: { categoryId } as FindOptionsWhere<PriceEntity>,
      relations: ['category', 'item'],
      order: { description: 'ASC' },
    });
  }

  // Get prices by category name
  async getByCategoryName(categoryName: string): Promise<PriceEntity[]> {
    const category = await this.categoryRepository.findOne({
      where: { name: categoryName } as FindOptionsWhere<CategoryEntity>,
    });

    if (!category) {
      throw new NotFoundException(
        `Category with name ${categoryName} not found`,
      );
    }

    return await this.priceRepository.find({
      where: { categoryId: category.id } as FindOptionsWhere<PriceEntity>,
      relations: ['category', 'item'],
      order: { description: 'ASC' },
    });
  }

  // Import prices from CSV (needs category mapping logic)
  async importFromCsv(fileBuffer: Buffer): Promise<ImportResult> {
    const results: any[] = [];
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      const readableStream = new stream.PassThrough();
      readableStream.end(fileBuffer);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      readableStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .on('end', async () => {
          let successful = 0;
          let failed = 0;

          for (const [index, row] of results.entries()) {
            try {
              // Skip if not a PRICE type
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (row.type !== 'PRICE') {
                continue;
              }

              // Find or create category by name
              let category = await this.categoryRepository.findOne({
                where: {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  name: (row.category as string)?.trim(),
                } as FindOptionsWhere<CategoryEntity>,
              });

              // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
              if (!category && row.category?.trim()) {
                // Create new category if it doesn't exist
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                category = this.categoryRepository.create({
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  categoryName: (row.category as string).trim(),
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                  description: `Auto-created from CSV import for ${row.category.trim()}`,
                });
                category = await this.categoryRepository.save(category);
              }

              if (!category) {
                throw new Error('Category is required');
              }

              // Map CSV columns to our entity fields
              const priceData = {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                type: row.type?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                stockId: row.stock_id?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                description: row['description(Item Name)']?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                itemCode: row.item_code?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                currency: row.currency?.trim() || 'LKR',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                price: parseFloat(row.price as string) || 0,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                discount: parseFloat(row.discount as string) || 0,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                customer: row.customer?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                altPrice: parseFloat(row.alt_price as string) || 0,
                categoryId: category.id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                supplierCode: row['Supplier Code']?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                supplierName: row['Supplier Name']?.trim(),
              };

              // Validate required fields
              if (!priceData.stockId || !priceData.description) {
                throw new Error(
                  'Missing required fields: stockId or description',
                );
              }

              if (isNaN(priceData.price) || priceData.price < 0) {
                throw new Error('Invalid price value');
              }

              // Check if price already exists by stockId
              const existing = await this.priceRepository.findOne({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                where: {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  stockId: priceData.stockId,
                } as FindOptionsWhere<PriceEntity>,
              });

              if (existing) {
                // Update existing price
                await this.priceRepository.update(existing.id, priceData);
              } else {
                // Create new price
                const price = this.priceRepository.create(priceData);
                await this.priceRepository.save(price);
              }

              successful++;
            } catch (error) {
              failed++;
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              errors.push(`Row ${index + 2}: ${(error as Error).message}`);
            }
          }

          resolve({
            total: results.length,
            successful,
            failed,
            errors,
          });
        })
        .on('error', (error) => {
          reject(
            new BadRequestException(`CSV parsing error: ${error.message}`),
          );
        });
    });
  }

  // Export prices to CSV
  async exportToCsv(): Promise<string> {
    const prices = await this.priceRepository.find({
      relations: ['category'],
      order: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        category: { categoryName: 'ASC' } as any,
        description: 'ASC',
      },
    });

    if (prices.length === 0) {
      throw new NotFoundException('No prices found to export');
    }

    const headers = [
      'Stock ID',
      'Description',
      'Item Code',
      'Currency',
      'Price',
      'Discount',
      'Customer',
      'Alt Price',
      'Category',
      'Supplier Code',
      'Supplier Name',
    ];

    let csvContent = headers.join(',') + '\n';

    prices.forEach((price) => {
      const row = [
        price.stockId,
        `"${price.description}"`,
        `"${price.itemCode || ''}"`,
        `"${price.currency}"`,
        price.price.toString(),
        price.discount.toString(),
        `"${price.customer || ''}"`,
        price.altPrice ? price.altPrice.toString() : '0',
        `"${price.category?.categoryName || ''}"`,
        `"${price.supplierCode || ''}"`,
        `"${price.supplierName || ''}"`,
      ];
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  }
}
