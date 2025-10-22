// src/modules/customer/customer.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { CustomerEntity } from './entities/customer.entity';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerSearchFilters,
} from '../../common/interfaces/customer.interface';
import { CsvImportResult } from '../../common/interfaces/customer.interface';
import { CustomerType } from '../../common/enums/customer.enum';
import { Status } from '../../common/enums/status';
import { PaymentTerms } from 'src/common/enums/payment-terms';
import { SalesType } from '../../common/enums/sales-type';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async generateSNo(): Promise<string> {
    const lastCustomer = await this.customerRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!lastCustomer) {
      return '1'; // Start with 1 as in your CSV
    }

    // Convert current sNo to number and increment
    const lastNumber = parseInt(lastCustomer.sNo) || 0;
    const newNumber = lastNumber + 1;

    return newNumber.toString();
  }

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    // Check if SMS phone already exists
    console.log(createCustomerDto);
    const existingCustomerByPhone = await this.customerRepository.findOne({
      where: { shortName: createCustomerDto.shortName },
      withDeleted: true,
    });
    console.log(existingCustomerByPhone);
    if (existingCustomerByPhone) {
      throw new ConflictException(
        `Customer with phone ${createCustomerDto.smsPhone} already exists`,
      );
    }
    
    // Check if S_No already exists
    const existingCustomerBySNo = await this.customerRepository.findOne({
      where: { sNo: createCustomerDto.sNo },
      withDeleted: true,
    });

    if (existingCustomerBySNo) {
      throw new ConflictException(
        `Customer with S_No ${createCustomerDto.sNo} already exists`,
      );
    }

    // If sNo is not provided, generate one
    let sNo = createCustomerDto.sNo;
    if (!sNo) {
      sNo = await this.generateSNo();
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      sNo,
    });

    const savedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(savedCustomer);
  }

  async findAll(filters: CustomerSearchFilters = {}): Promise<{
    data: CustomerResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      searchTerm,
      customerType,
      salesType,
      status,
      cityArea,
      salesGroup,
      sNo,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<CustomerEntity> = {};

    if (searchTerm) {
      where.name = ILike(`%${searchTerm}%`);
    }

    if (sNo) {
      where.sNo = ILike(`%${sNo}%`);
    }

    if (customerType) {
      where.customerType = customerType;
    }

    if (salesType) {
      where.salesType = salesType;
    }

    if (status) {
      where.status = status;
    }

    if (cityArea) {
      where.cityArea = ILike(`%${cityArea}%`);
    }

    if (salesGroup) {
      where.salesGroup = ILike(`%${salesGroup}%`);
    }

    const [customers, total] = await this.customerRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: customers.map((customer) => this.mapToResponseDto(customer)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.mapToResponseDto(customer);
  }

  async findOneBySNo(sNo: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { sNo },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with S_No ${sNo} not found`);
    }

    return this.mapToResponseDto(customer);
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check if SMS phone is being updated and if it already exists
    if (
      updateCustomerDto.smsPhone &&
      updateCustomerDto.smsPhone !== customer.smsPhone
    ) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { smsPhone: updateCustomerDto.smsPhone },
      });

      if (existingCustomer) {
        throw new ConflictException(
          `Customer with phone ${updateCustomerDto.smsPhone} already exists`,
        );
      }
    }

    // Check if S_No is being updated and if it already exists
    if (updateCustomerDto.sNo && updateCustomerDto.sNo !== customer.sNo) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { sNo: updateCustomerDto.sNo },
      });

      if (existingCustomer) {
        throw new ConflictException(
          `Customer with S_No ${updateCustomerDto.sNo} already exists`,
        );
      }
    }

    const updatedCustomer = await this.customerRepository.save({
      ...customer,
      ...updateCustomerDto,
    });

    return this.mapToResponseDto(updatedCustomer);
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      const result = await this.customerRepository.softDelete({ id });

      if (result.affected === 0) {
        throw new NotFoundException(
          `Customer with ID ${id} not found or already deleted`,
        );
      }

      return { message: 'Customer deleted successfully' };
    } catch (error) {
      console.error('❌ Error in customer delete:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Failed to delete customer: ${error.message}`,
      );
    }
  }

  async search(searchTerm: string): Promise<CustomerResponseDto[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const trimmedTerm = searchTerm.trim();

      if (trimmedTerm.length < 2) {
        return [];
      }

      const customers = await this.customerRepository.find({
        where: [
          { name: ILike(`%${trimmedTerm}%`) },
          { shortName: ILike(`%${trimmedTerm}%`) },
          { branchName: ILike(`%${trimmedTerm}%`) },
          { smsPhone: ILike(`%${trimmedTerm}%`) },
          { email: ILike(`%${trimmedTerm}%`) },
          { sNo: ILike(`%${trimmedTerm}%`) }, // Added sNo to search
        ],
        order: { name: 'ASC' },
        take: 20,
      });

      return customers.map((customer) => this.mapToResponseDto(customer));
    } catch (error) {
      console.error('❌ Error in customer search:', error);
      throw new InternalServerErrorException(
        'Search failed due to server error',
      );
    }
  }

  async findCustomerComplaints(customerId: string): Promise<{
    message: string;
    customer: CustomerResponseDto;
    complaints: any[];
  }> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
        relations: ['complaints'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }

      const customerData = this.mapToResponseDto(customer);

      return {
        message: 'Customer complaints retrieved successfully',
        customer: customerData,
        complaints: customer.complaints || [],
      };
    } catch (error) {
      console.error('❌ Error getting customer complaints:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to retrieve customer complaints',
      );
    }
  }

  async importFromCsv(fileBuffer: Buffer): Promise<CsvImportResult> {
    const errors: string[] = [];

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    try {
      // Parse CSV file
      const csvData = await this.parseCsv(fileBuffer);

      // Validate and process each record
      for (let i = 0; i < csvData.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const row = csvData[i];
        const rowNumber = i + 2; // +2 because header is row 1 and arrays start at 0

        try {
          // Skip empty rows
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!row.name && !row.shortName && !row.smsPhone) {
            skipped++;
            continue;
          }

          // Validate required fields
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!row.name) {
            errors.push(`Row ${rowNumber}: Name is required`);
            skipped++;
            continue;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!row.shortName) {
            errors.push(`Row ${rowNumber}: Short Name is required`);
            skipped++;
            continue;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!row.smsPhone) {
            errors.push(`Row ${rowNumber}: SMS Phone is required`);
            skipped++;
            continue;
          }

          // Validate and transform data
          const customerData = this.transformCsvRow(row, rowNumber);

          if (customerData) {
            // Check for duplicates based on shortName (mobile number) and smsPhone
            const existingCustomer = await this.findDuplicateCustomer(
              customerData.sNo, // Add sNo here
              customerData.shortName,
              customerData.smsPhone,
              customerData.email,
            );
            console.log(`Processing row ${rowNumber}:`, {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              sNo: customerData.sNo,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              name: customerData.name,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              shortName: customerData.shortName,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              smsPhone: customerData.smsPhone,
            });
            if (existingCustomer) {
              console.log(`Found existing customer:`, {
                id: existingCustomer.id,
                sNo: existingCustomer.sNo,
                name: existingCustomer.name,
              });
              // Update existing customer
              await this.updateFromCsv(existingCustomer.id, customerData);
              updated++;
              console.log(`Updated customer: ${existingCustomer.id}`);
            } else {
              // Create new customer
              await this.createFromCsv(customerData);
              imported++;
              console.log(`Created new customer`);
            }

            if (existingCustomer) {
              // Update existing customer
              await this.updateFromCsv(existingCustomer.id, customerData);
              updated++;
            } else {
              // Create new customer
              await this.createFromCsv(customerData);
              imported++;
            }
          }
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          errors.push(`Row ${rowNumber}: ${error.message}`);
          skipped++;
        }
      }

      return {
        success: errors.length === 0,
        message: `CSV import completed. Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped}`,
        totalRecords: csvData.length,
        imported,
        updated,
        skipped,
        errors,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(`CSV parsing failed: ${error.message}`);
    }
  }

  private async parseCsv(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];

      const stream = Readable.from(fileBuffer.toString());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
      const parser = parse({
        columns: (header) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
          header.map((column) => {
            // Map CSV headers to your entity fields
            const columnMapping: { [key: string]: string } = {
              'S.No': 'sNo',
              Name: 'name',
              'Short Name': 'shortName',
              'Branch Name': 'branchName',
              'City/Area': 'cityArea',
              Email: 'email',
              'SMS Phone': 'smsPhone',
              Currency: 'currency',
              'Sales Type': 'salesType',
              'Payment Terms': 'paymentTerms',
              DOB: 'dob',
              Address: 'address',
              Status: 'status',
              'Sales Group': 'salesGroup',
            };
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
            return columnMapping[column] || column;
          }),
        delimiter: ',',
        trim: true,
        skip_empty_lines: true,
        relax_quotes: true,
        quote: '"',
        escape: '"',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      stream

        .pipe(parser)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .on('data', (record) => {
          // Skip empty rows
          if (
            Object.values(record).some(
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
              (value) => value && value.toString().trim() !== '',
            )
          ) {
            records.push(record);
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .on('end', () => resolve(records))
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors,@typescript-eslint/no-unsafe-member-access
        .on('error', (error) => reject(error));
    });
  }

  private transformCsvRow(
    row: any,
    rowNumber: number,
  ): {
    sNo: any;
    name: any;
    shortName: any;
    branchName: any;
    cityArea: any;
    email: string | null;
    smsPhone: any;
    currency: any;
    salesType: SalesType;
    paymentTerms: PaymentTerms;
    dob: null | Date;
    address: string | null;
    status: Status;
    salesGroup: any;
    customerType: CustomerType;
  } {
    console.log(rowNumber);
    // Transform and validate the CSV row data

    // Handle date format (0000-00-00 should be null)
    let dob: Date | null = null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.dob && row.dob !== '0000-00-00') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const dobDate = new Date(row.dob);
      if (isNaN(dobDate.getTime())) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw new Error(`Invalid date format for DOB: ${row.dob}`);
      }
      dob = dobDate;
    }

    // Validate and map sales type
    let salesType: SalesType = SalesType.RETAIL;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.salesType) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const salesTypeUpper = row.salesType.toUpperCase();
      if (salesTypeUpper in SalesType) {
        salesType = SalesType[salesTypeUpper as keyof typeof SalesType];
      }
    }

    // Validate and map payment terms
    let paymentTerms: PaymentTerms = PaymentTerms.COD_IML;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.paymentTerms) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const paymentTermsUpper = row.paymentTerms
        .toUpperCase()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .replace(' ', '_');
      if (paymentTermsUpper in PaymentTerms) {
        paymentTerms =
          PaymentTerms[paymentTermsUpper as keyof typeof PaymentTerms];
      }
    }

    // Validate and map status
    let status: Status = Status.ACTIVE;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.status) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const statusUpper = row.status.toUpperCase();
      if (statusUpper in Status) {
        status = Status[statusUpper as keyof typeof Status];
      }
    }

    // Validate email format if provided
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!emailRegex.test(row.email)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw new Error(`Invalid email format: ${row.email}`);
      }
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      sNo: row.sNo?.toString() || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      name: row.name?.toString() || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      shortName: row.shortName?.toString() || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      branchName: row.branchName?.toString() || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      cityArea: row.cityArea?.toString() || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      email: row.email?.toString() || null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      smsPhone: row.smsPhone?.toString() || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      currency: row.currency?.toString() || 'LKR',

      salesType,

      paymentTerms,
      dob,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      address: row.address?.toString() || null,

      status,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      salesGroup: row.salesGroup?.toString() || '',

      customerType: CustomerType.INDIVIDUAL, // Default value
    };
  }

  private async findDuplicateCustomer(
    sNo: string,
    shortName: string,
    smsPhone: string,
    email?: string | null,
  ): Promise<CustomerEntity | null> {
    // First try to find by S_No (primary identifier in CSV)
    if (sNo && sNo.trim() !== '') {
      const bySNo = await this.customerRepository.findOne({
        where: { sNo },
      });
      if (bySNo) return bySNo;
    }

    // Then try by phone (unique constraint)
    const byPhone = await this.customerRepository.findOne({
      where: { smsPhone },
    });
    if (byPhone) return byPhone;

    // Finally try by email if provided
    if (email && email.trim() !== '') {
      const byEmail = await this.customerRepository.findOne({
        where: { email },
      });
      if (byEmail) return byEmail;
    }

    return null;
  }

  private async createFromCsv(customerData: {
    sNo: any;
    name: any;
    shortName: any;
    branchName: any;
    cityArea: any;
    email: string | null;
    smsPhone: any;
    currency: any;
    salesType: SalesType;
    paymentTerms: PaymentTerms;
    dob: Date | null;
    address: string | null;
    status: Status;
    salesGroup: any;
    customerType: CustomerType;
  }): Promise<CustomerEntity> {
    // Generate sNo if not provided
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (!customerData.sNo || customerData.sNo.trim() === '') {
      customerData.sNo = await this.generateSNo();
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const customer = this.customerRepository.create(customerData);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return await this.customerRepository.save(customer);
  }

  private async updateFromCsv(
    id: string,
    customerData: {
      sNo: any;
      name: any;
      shortName: any;
      branchName: any;
      cityArea: any;
      email: string | null;
      smsPhone: any;
      currency: any;
      salesType: SalesType;
      paymentTerms: PaymentTerms;
      dob: Date | null;
      address: string | null;
      status: Status;
      salesGroup: any;
      customerType: CustomerType;
    },
  ): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Only update fields that are provided and not empty in the CSV
    const updates: any = {};

    if (customerData.name && customerData.name.trim() !== '')
      updates.name = customerData.name;
    if (customerData.shortName && customerData.shortName.trim() !== '')
      updates.shortName = customerData.shortName;
    if (customerData.branchName && customerData.branchName.trim() !== '')
      updates.branchName = customerData.branchName;
    if (customerData.cityArea && customerData.cityArea.trim() !== '')
      updates.cityArea = customerData.cityArea;
    if (customerData.email && customerData.email.trim() !== '')
      updates.email = customerData.email;
    if (customerData.smsPhone && customerData.smsPhone.trim() !== '')
      updates.smsPhone = customerData.smsPhone;
    if (customerData.currency && customerData.currency.trim() !== '')
      updates.currency = customerData.currency;
    if (customerData.salesType) updates.salesType = customerData.salesType;
    if (customerData.paymentTerms)
      updates.paymentTerms = customerData.paymentTerms;
    if (customerData.dob) updates.dob = customerData.dob;
    if (customerData.address && customerData.address.trim() !== '')
      updates.address = customerData.address;
    if (customerData.status) updates.status = customerData.status;
    if (customerData.salesGroup && customerData.salesGroup.trim() !== '')
      updates.salesGroup = customerData.salesGroup;
    if (customerData.customerType)
      updates.customerType = customerData.customerType;

    // Don't update S_No if it's already set, unless the new one is different and valid
    if (
      customerData.sNo &&
      customerData.sNo.trim() !== '' &&
      customerData.sNo !== customer.sNo
    ) {
      // Check if the new S_No doesn't conflict with other customers
      const existingWithSNo = await this.customerRepository.findOne({
        where: { sNo: customerData.sNo },
      });
      if (!existingWithSNo) {
        updates.sNo = customerData.sNo;
      }
    }

    const updatedCustomer = this.customerRepository.merge(customer, updates);
    return await this.customerRepository.save(updatedCustomer);
  }

  private mapToResponseDto(customer: CustomerEntity): CustomerResponseDto {
    return {
      id: customer.id,
      sNo: customer.sNo, // Changed from customerCode to sNo
      name: customer.name,
      shortName: customer.shortName,
      branchName: customer.branchName,
      cityArea: customer.cityArea,
      email: customer.email,
      smsPhone: customer.smsPhone,
      currency: customer.currency,
      salesType: customer.salesType,
      paymentTerms: customer.paymentTerms,
      dob: customer.dob,
      address: customer.address,
      status: customer.status,
      salesGroup: customer.salesGroup,
      customerType: customer.customerType,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
