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
import csv from 'csv-parser';
import * as stream from 'stream';
import { ItemEntity } from '../item/entities/item.entity';

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
    const skip = (page - 1) * limit;

    // Create query builder
    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.items', 'items');

    // Apply isActive filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('supplier.isActive = :isActive', { isActive });
    } else {
      // Default to active suppliers only
      queryBuilder.andWhere('supplier.isActive = :isActive', {
        isActive: true,
      });
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        `(supplier.name ILIKE :search OR 
          supplier.reference ILIKE :search OR 
          supplier.phone ILIKE :search OR
          supplier.contactPerson ILIKE :search OR
          supplier.email ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const data = await queryBuilder
      .orderBy('supplier.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
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
    const results: any[] = [];
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      const readableStream = new stream.PassThrough();
      readableStream.end(fileBuffer);

      readableStream

        .pipe(csv())

        .on('data', (data) => results.push(data))

        .on('end', async () => {
          let successful = 0;
          let failed = 0;

          for (const [index, row] of results.entries()) {
            try {
              // Skip if not a SUPPLIER type
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (row.type !== 'SUPPLIER') {
                continue;
              }

              // Map CSV columns to our entity fields
              const supplierData = {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                name: row.supp_name?.trim() || `Supplier ${index + 1}`,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                reference: row.supp_ref?.trim() || `REF-${index + 1}`,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                address: this.cleanAddress(row.address || row.supp_address),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                phone: this.cleanPhone(row.phone || row.phone2),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                contactPerson: row.contact_person?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                email: row.email?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                phone2: this.cleanPhone(row.phone2),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                fax: row.fax?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                ntnNumber: row.ntn_no?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                gstNumber: row.gst_no?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                paymentTerms: row.terms?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                taxGroup: row.tax_group?.trim(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                currency: row.curr_abrev?.trim() || 'LKR',
              };

              // Validate required fields
              if (
                !supplierData.name ||
                !supplierData.reference ||
                !supplierData.address
              ) {
                throw new Error(
                  'Missing required fields: name, reference, or address',
                );
              }

              // Check if supplier already exists by reference
              const existing = await this.supplierRepository.findOne({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                where: { reference: supplierData.reference },
              });

              if (existing) {
                // Update existing supplier
                await this.supplierRepository.update(existing.id, supplierData);
              } else {
                // Create new supplier
                const supplierCode = await this.generateSupplierCode();
                const supplier = this.supplierRepository.create({
                  ...supplierData,
                  supplierCode,
                });
                await this.supplierRepository.save(supplier);
              }

              successful++;
            } catch (error) {
              failed++;
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              errors.push(`Row ${index + 2}: ${error.message}`);
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
