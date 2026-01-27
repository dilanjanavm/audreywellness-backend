// src/modules/suppliers/suppliers.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { ItemEntity } from '../item/entities/item.entity';
import { Logger } from '@nestjs/common';

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  recentlyAdded: number;
}

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
  ) {}

  // Generate supplier code like SUP-00001
  private async generateSupplierCode(): Promise<string> {
    const lastSupplier = await this.supplierRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    let nextNumber = 1;
    if (lastSupplier && lastSupplier.supplierCode) {
      const matches = lastSupplier.supplierCode.match(/SUP-(\d+)/);
      if (matches && matches[1]) {
        nextNumber = parseInt(matches[1]) + 1;
      }
    }

    return `SUP-${nextNumber.toString().padStart(5, '0')}`;
  }

  // Clean and format address from CSV
  private cleanAddress(address: string): string {
    if (!address) return 'Address not provided';

    return address
      .replace(/,+/g, ',')
      .replace(/\n/g, ', ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Clean phone number
  private cleanPhone(phone: string): string {
    if (!phone) return 'Not Provided';
    return phone.replace(/\D/g, '').slice(0, 15);
  }

  // Create new supplier with items
  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    try {
      const supplierCode = await this.generateSupplierCode();

      const supplier = this.supplierRepository.create({
        name: createSupplierDto.name,
        reference: createSupplierDto.reference,
        address: createSupplierDto.address,
        phone: createSupplierDto.phone,
        contactPerson: createSupplierDto.contactPerson,
        email: createSupplierDto.email,
        phone2: createSupplierDto.phone2,
        fax: createSupplierDto.fax,
        ntnNumber: createSupplierDto.ntnNumber,
        gstNumber: createSupplierDto.gstNumber,
        paymentTerms: createSupplierDto.paymentTerms,
        taxGroup: createSupplierDto.taxGroup,
        currency: createSupplierDto.currency || 'LKR',
        isActive:
          createSupplierDto.isActive !== undefined
            ? createSupplierDto.isActive
            : true,
        supplierCode,
      });

      // Save supplier first
      const savedSupplier = await this.supplierRepository.save(supplier);

      // Then link items if provided
      if (createSupplierDto.itemIds && createSupplierDto.itemIds.length > 0) {
        const items = await this.itemRepository.find({
          where: { id: In(createSupplierDto.itemIds) },
        });

        if (items.length !== createSupplierDto.itemIds.length) {
          throw new BadRequestException('Some items were not found');
        }

        // Set the items and save again
        savedSupplier.items = items;
        return await this.supplierRepository.save(savedSupplier);
      }

      return savedSupplier;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        if (error?.detail?.includes('supplierCode')) {
          throw new BadRequestException('Supplier code already exists');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        if (error?.detail?.includes('reference')) {
          throw new BadRequestException(
            'Supplier with this reference already exists',
          );
        }
      }
      console.error('Database error:', error);
      throw new InternalServerErrorException('Failed to create supplier');
    }
  }

  // Find all suppliers with pagination and filters
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    isActive?: boolean,
    includeItems: boolean = false,
  ): Promise<{ data: Supplier[]; total: number; page: number; limit: number }> {
    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Min 1, Max 100
    const skip = (validPage - 1) * validLimit;

    // Create query builder
    const queryBuilder = this.supplierRepository.createQueryBuilder('supplier');

    // Conditionally join items only if includeItems is true
    if (includeItems) {
      queryBuilder.leftJoinAndSelect('supplier.items', 'items');
    }

    // Apply isActive filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('supplier.isActive = :isActive', { isActive });
    } else {
      // Default to active suppliers only
      queryBuilder.andWhere('supplier.isActive = :isActive', {
        isActive: true,
      });
    }

    // Apply search filter - using LOWER() for case-insensitive search (MySQL compatible)
    if (search) {
      queryBuilder.andWhere(
        `(
          LOWER(supplier.name) LIKE LOWER(:search) OR 
          LOWER(supplier.reference) LIKE LOWER(:search) OR 
          LOWER(supplier.phone) LIKE LOWER(:search) OR
          LOWER(supplier.contactPerson) LIKE LOWER(:search) OR
          LOWER(supplier.email) LIKE LOWER(:search)
        )`,
        { search: `%${search}%` },
      );
    }

    // Get total count for pagination (before applying skip/take)
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const data = await queryBuilder
      .orderBy('supplier.name', 'ASC')
      .skip(skip)
      .take(validLimit)
      .getMany();

    return {
      data,
      total,
      page: validPage,
      limit: validLimit,
    };
  }

  // Find supplier by ID
  async findOne(id: string, includeItems: boolean = false): Promise<Supplier> {
    const options: any = {
      where: { id },
    };

    if (includeItems) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      options.relations = ['items'];
    }

    const supplier = await this.supplierRepository.findOne(options);

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  // Find supplier by reference
  async findByReference(
    reference: string,
    includeItems: boolean = false,
  ): Promise<Supplier> {
    const options: any = {
      where: { reference },
    };

    if (includeItems) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      options.relations = ['items'];
    }

    const supplier = await this.supplierRepository.findOne(options);

    if (!supplier) {
      throw new NotFoundException(
        `Supplier with reference ${reference} not found`,
      );
    }

    return supplier;
  }

  // Update supplier
  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);

    const updatedData: any = {
      ...updateSupplierDto,
    };

    // Handle items update if provided
    if (updateSupplierDto.itemIds !== undefined) {
      if (updateSupplierDto.itemIds.length > 0) {
        const items = await this.itemRepository.find({
          where: { id: In(updateSupplierDto.itemIds) },
        });

        if (items.length !== updateSupplierDto.itemIds.length) {
          throw new BadRequestException('Some items were not found');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updatedData.items = items;
      } else {
        // Empty array means remove all items
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updatedData.items = [];
      }
    }

    await this.supplierRepository.update(id, updatedData);

    // Return the updated supplier with items
    return await this.findOne(id, true);
  }

  // Delete supplier (soft delete)
  async remove(id: string): Promise<{ message: string }> {
    const supplier = await this.findOne(id, true);

    // Check if supplier has associated items before deleting
    if (supplier.items && supplier.items.length > 0) {
      throw new BadRequestException(
        `Cannot delete supplier. There are ${supplier.items.length} items associated with this supplier. Remove the items first.`,
      );
    }

    await this.supplierRepository.update(id, { isActive: false });

    return { message: 'Supplier deleted successfully' };
  }

  // Add items to supplier
  async addItemsToSupplier(
    supplierId: string,
    itemIds: string[],
  ): Promise<Supplier> {
    const supplier = await this.findOne(supplierId, true);
    const items = await this.itemRepository.find({
      where: { id: In(itemIds) },
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('Some items were not found');
    }

    // Merge existing items with new items
    const existingItems = supplier.items || [];
    const newItems = [...existingItems, ...items];

    // Remove duplicates based on item ID
    const uniqueItems = newItems.reduce((acc, current) => {
      // @ts-ignore
      const x = acc.find((item) => item?.id === current.id);
      if (!x) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return acc.concat([current]);
      }
      return acc;
    }, []);

    supplier.items = uniqueItems;

    return await this.supplierRepository.save(supplier);
  }

  // Remove items from supplier
  async removeItemsFromSupplier(
    supplierId: string,
    itemIds: string[],
  ): Promise<Supplier> {
    const supplier = await this.findOne(supplierId, true);

    if (supplier.items) {
      supplier.items = supplier.items.filter(
        (item) => !itemIds.includes(item.id),
      );
    }

    return await this.supplierRepository.save(supplier);
  }

  // Get supplier with items
  async findOneWithItems(id: string): Promise<Supplier> {
    return this.findOne(id, true);
  }

  // Get items by supplier
  async getSupplierItems(supplierId: string): Promise<ItemEntity[]> {
    const supplier = await this.findOneWithItems(supplierId);
    return supplier.items || [];
  }

  // Get suppliers by item
  async getSuppliersByItem(itemId: string): Promise<Supplier[]> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['suppliers'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    return item.suppliers || [];
  }

  // Get supplier statistics
  async getStats(): Promise<SupplierStats> {
    const totalSuppliers = await this.supplierRepository.count();
    const activeSuppliers = await this.supplierRepository.count({
      where: { isActive: true },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyAdded = await this.supplierRepository.count({
      where: {
        createdAt: new Date(thirtyDaysAgo),
      },
    });

    return {
      totalSuppliers,
      activeSuppliers,
      recentlyAdded,
    };
  }

  // Import suppliers from CSV
  async importFromCsv(fileBuffer: Buffer): Promise<ImportResult> {
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    try {
      // Parse CSV file using csv-parse (handles varying column counts better)
      const csvData = await this.parseCsv(fileBuffer);

      this.logger.log(`Parsed ${csvData.length} rows from CSV file`);

      // Process each record
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2; // +2 because header is row 1 and arrays start at 0

        try {
          // Skip if not a SUPPLIER type
          if (!row.type || row.type.toString().trim().toUpperCase() !== 'SUPPLIER') {
            continue;
          }

          // Skip empty rows
          const hasName = row.supp_name && row.supp_name.toString().trim() !== '';
          const hasRef = row.supp_ref && row.supp_ref.toString().trim() !== '';
          if (!hasName && !hasRef) {
            continue;
          }

          // Transform CSV row to supplier data
          const supplierData = this.transformCsvRow(row);

          // Validate required fields
          if (!supplierData.name || supplierData.name.trim() === '') {
            errors.push(`Row ${rowNumber}: Name (supp_name) is required`);
            failed++;
            continue;
          }

          if (!supplierData.reference || supplierData.reference.trim() === '') {
            errors.push(`Row ${rowNumber}: Reference (supp_ref) is required`);
            failed++;
            continue;
          }

          // Check if supplier already exists by reference
          const existing = await this.supplierRepository.findOne({
            where: { reference: supplierData.reference },
          });

          if (existing) {
            // Update existing supplier
            await this.supplierRepository.update(existing.id, {
              ...supplierData,
              isActive: supplierData.isActive ?? existing.isActive,
            });
            successful++;
            this.logger.log(
              `Updated supplier: ${existing.id} (${supplierData.name})`,
            );
          } else {
            // Create new supplier
            const supplierCode = await this.generateSupplierCode();
            const supplier = this.supplierRepository.create({
              ...supplierData,
              supplierCode,
              isActive: supplierData.isActive ?? true,
            });
            await this.supplierRepository.save(supplier);
            successful++;
            this.logger.log(`Created new supplier: ${supplierCode} (${supplierData.name})`);
          }
        } catch (error) {
          failed++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          errors.push(`Row ${rowNumber}: ${errorMessage}`);
          this.logger.error(`Error processing row ${rowNumber}:`, errorMessage);
        }
      }

      this.logger.log(
        `CSV import completed: ${successful} successful, ${failed} failed`,
      );

      return {
        total: csvData.length,
        successful,
        failed,
        errors,
      };
    } catch (error) {
      this.logger.error('CSV import failed:', error);
      throw new BadRequestException(
        `CSV parsing error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Parse CSV file buffer into records
   */
  private async parseCsv(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];

      const stream = Readable.from(fileBuffer.toString());

      const parser = parse({
        columns: true, // Use first line as column names
        delimiter: ',',
        trim: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true, // Allow rows with different column counts
        quote: '"',
        escape: '"',
        skip_records_with_error: false, // Don't skip records, handle errors
      });

      stream
        .pipe(parser)
        .on('data', (record) => {
          // Skip completely empty rows
          if (
            Object.values(record).some(
              (value) => value && value.toString().trim() !== '',
            )
          ) {
            records.push(record);
          }
        })
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Transform CSV row to supplier data
   */
  private transformCsvRow(row: any): {
    name: string;
    reference: string;
    address: string;
    phone: string;
    phone2?: string;
    fax?: string;
    email?: string;
    contactPerson?: string;
    ntnNumber?: string;
    gstNumber?: string;
    paymentTerms?: string;
    taxGroup?: string;
    currency: string;
    isActive?: boolean;
  } {
    // Get address from either 'address' or 'supp_address' column
    const address = row.address?.toString().trim() || row.supp_address?.toString().trim() || '';
    
    // Get phone from either 'phone' or 'phone2', prioritize phone
    const phone = row.phone?.toString().trim() || row.phone2?.toString().trim() || '';
    const phone2 = row.phone2?.toString().trim() || '';

    return {
      name: (row.supp_name?.toString().trim() || '').replace(/\s+/g, ' '), // Clean multiple spaces
      reference: row.supp_ref?.toString().trim() || '',
      address: address ? this.cleanAddress(address) : 'Address not provided',
      phone: phone ? this.cleanPhone(phone) : 'Not Provided',
      phone2: phone2 ? this.cleanPhone(phone2) : undefined,
      fax: row.fax?.toString().trim() || undefined,
      email: row.email?.toString().trim() || undefined,
      contactPerson: row.contact_person?.toString().trim() || undefined,
      ntnNumber: row.ntn_no?.toString().trim() || undefined,
      gstNumber: row.gst_no?.toString().trim() || undefined,
      paymentTerms: row.terms?.toString().trim() || undefined,
      taxGroup: row.tax_group?.toString().trim() || undefined,
      currency: (row.curr_abrev?.toString().trim() || 'LKR').toUpperCase(),
      isActive: true, // Default to active
    };
  }

  // Export suppliers to CSV
  async exportToCsv(): Promise<string> {
    const suppliers = await this.supplierRepository.find({
      where: { isActive: true },
      relations: ['items'],
      order: { name: 'ASC' },
    });

    if (suppliers.length === 0) {
      throw new NotFoundException('No suppliers found to export');
    }

    const headers = [
      'Supplier Code',
      'Name',
      'Reference',
      'Address',
      'Contact Person',
      'Email',
      'Phone',
      'Phone 2',
      'Fax',
      'NTN Number',
      'GST Number',
      'Payment Terms',
      'Tax Group',
      'Currency',
      'Item Count',
      'Status',
    ];

    let csvContent = headers.join(',') + '\n';

    suppliers.forEach((supplier) => {
      const itemCount = supplier.items ? supplier.items.length : 0;

      const row = [
        supplier.supplierCode,
        `"${supplier.name}"`,
        `"${supplier.reference}"`,
        `"${supplier.address}"`,
        `"${supplier.contactPerson || ''}"`,
        `"${supplier.email || ''}"`,
        `"${supplier.phone}"`,
        `"${supplier.phone2 || ''}"`,
        `"${supplier.fax || ''}"`,
        `"${supplier.ntnNumber || ''}"`,
        `"${supplier.gstNumber || ''}"`,
        `"${supplier.paymentTerms || ''}"`,
        `"${supplier.taxGroup || ''}"`,
        `"${supplier.currency}"`,
        itemCount.toString(),
        `"${supplier.isActive ? 'Active' : 'Inactive'}"`,
      ];
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  }
}
