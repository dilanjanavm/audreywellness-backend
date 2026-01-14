// src/modules/customer/customer.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
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
import { EmailService } from '../email/email.service';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly emailService: EmailService,
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

    // Send welcome email if requested (default: true) and email is provided
    if (createCustomerDto.sendEmail !== false && savedCustomer.email) {
      const emailSent = await this.emailService.sendCustomerWelcomeEmail(
        savedCustomer.email,
        savedCustomer.name,
        savedCustomer.sNo,
        savedCustomer.smsPhone,
      );
      if (!emailSent) {
        this.logger.warn(
          `Failed to send welcome email to ${savedCustomer.email}, but customer was created`,
        );
      } else {
        this.logger.log(
          `Customer welcome email sent successfully to ${savedCustomer.email}`,
        );
      }
    } else if (createCustomerDto.sendEmail !== false && !savedCustomer.email) {
      this.logger.warn(
        `Customer created without email address. Welcome email not sent.`,
      );
    }

    this.logger.log(
      `Customer created successfully: ${savedCustomer.id} (${savedCustomer.name})`,
    );

    return this.mapToResponseDto(savedCustomer);
  }

  async findAll(filters: CustomerSearchFilters = {}): Promise<{
    data: CustomerResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    pageCount: number;
    perPageRows: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
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

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Min 1, Max 100
    const skip = (validPage - 1) * validLimit;

    // Build query using QueryBuilder for better search across multiple fields
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // Apply searchTerm filter - search across multiple fields
    // Using LOWER() for case-insensitive search (MySQL compatible)
    if (searchTerm) {
      queryBuilder.andWhere(
        `(
          LOWER(customer.name) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.sNo) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.shortName) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.email) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.smsPhone) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.branchName) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.cityArea) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.salesGroup) LIKE LOWER(:searchTerm) OR
          LOWER(customer.address) LIKE LOWER(:searchTerm)
        )`,
        { searchTerm: `%${searchTerm}%` },
      );
    }

    // Apply sNo filter (if provided separately, can be used with or without searchTerm)
    if (sNo) {
      queryBuilder.andWhere('LOWER(customer.sNo) LIKE LOWER(:sNo)', {
        sNo: `%${sNo}%`,
      });
    }

    // Apply other filters
    if (customerType) {
      queryBuilder.andWhere('customer.customerType = :customerType', {
        customerType,
      });
    }

    if (salesType) {
      queryBuilder.andWhere('customer.salesType = :salesType', { salesType });
    }

    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    if (cityArea) {
      queryBuilder.andWhere('LOWER(customer.cityArea) LIKE LOWER(:cityArea)', {
        cityArea: `%${cityArea}%`,
      });
    }

    if (salesGroup) {
      queryBuilder.andWhere('LOWER(customer.salesGroup) LIKE LOWER(:salesGroup)', {
        salesGroup: `%${salesGroup}%`,
      });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const customers = await queryBuilder
      .orderBy('customer.createdAt', 'DESC')
      .skip(skip)
      .take(validLimit)
      .getMany();

    // Calculate pagination details
    const totalPages = Math.ceil(total / validLimit);
    const hasNextPage = validPage < totalPages;
    const hasPrevPage = validPage > 1;

    return {
      data: customers.map((customer) => this.mapToResponseDto(customer)),
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
      pageCount: totalPages, // Alias for totalPages (common frontend naming)
      perPageRows: validLimit, // Alias for limit (common frontend naming)
      hasNextPage,
      hasPrevPage,
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
          // Skip empty rows - check CSV columns directly
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const hasName = row.name && row.name.toString().trim() !== '';
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const hasPhone = (row.phone || row.phone2) && (row.phone || row.phone2).toString().trim() !== '';
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const hasRef = (row.debtor_ref || row.branch_ref) && (row.debtor_ref || row.branch_ref).toString().trim() !== '';
          
          if (!hasName && !hasPhone && !hasRef) {
            skipped++;
            continue;
          }

          // Validate and transform data first
          const customerData = this.transformCsvRow(row, rowNumber);

          // Validate required fields after transformation
          if (!customerData.name || customerData.name.trim() === '') {
            errors.push(`Row ${rowNumber}: Name is required`);
            skipped++;
            continue;
          }

          if (!customerData.shortName || customerData.shortName.trim() === '') {
            errors.push(`Row ${rowNumber}: Short Name (debtor_ref/branch_ref) is required`);
            skipped++;
            continue;
          }

          if (!customerData.smsPhone || customerData.smsPhone.trim() === '') {
            errors.push(`Row ${rowNumber}: SMS Phone (phone/phone2) is required`);
            skipped++;
            continue;
          }

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

        .on('end', () => resolve(records))

        .on('error', (error) => reject(error));
    });
  }

  /**
   * Helper function to replace empty string values with '#####'
   */
  private replaceEmptyString(value: string | null | undefined, defaultValue: string = '#####'): string {
    if (!value || value.toString().trim() === '') {
      return defaultValue;
    }
    return value.toString().trim();
  }

  /**
   * Helper function to replace empty numeric values with '0'
   */
  private replaceEmptyNumber(value: string | number | null | undefined): string {
    if (!value || value.toString().trim() === '') {
      return '0';
    }
    return value.toString().trim();
  }

  /**
   * Helper function to replace empty date values with '2000-01-01'
   */
  private replaceEmptyDate(value: string | null | undefined): Date | null {
    if (!value || value.toString().trim() === '' || value.toString().trim() === '0000-00-00') {
      return new Date('2000-01-01');
    }
    const dateValue = new Date(value.toString().trim());
    if (isNaN(dateValue.getTime())) {
      return new Date('2000-01-01');
    }
    return dateValue;
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
    // Map CSV columns to entity fields
    // CSV columns: type,debtor_no,branch_code,debtor_ref,branch_ref,address,tax_id,ntn_no,curr_abrev,terms,sales_type,credit_status,salesman_name,location_name,shipper_name,area,tax_group,group_no,notes,phone,phone2,fax,email,DOB,name,...
    
    // Extract and map fields from CSV structure with empty value replacement
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sNo = this.replaceEmptyString(row.debtor_no || row.branch_code);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const name = this.replaceEmptyString(row.name);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const shortName = this.replaceEmptyString(row.debtor_ref || row.branch_ref || row.name).substring(0, 50);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const branchName = this.replaceEmptyString(row.location_name || row.shipper_name, '#####');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const cityArea = this.replaceEmptyString(row.area);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const email = this.replaceEmptyString(row.email);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const smsPhone = this.replaceEmptyString(row.phone || row.phone2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const currency = this.replaceEmptyString(row.curr_abrev, 'LKR');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const address = this.replaceEmptyString(row.address);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const salesGroup = this.replaceEmptyString(row.group_no, '#####');

    // Handle date format - replace empty dates with '2000-01-01'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dobValue = row.DOB || row.dob;
    const dob: Date | null = this.replaceEmptyDate(dobValue);

    // Validate and map sales type
    let salesType: SalesType = SalesType.RETAIL;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const salesTypeValue = (row.sales_type || row.salesType || '').toString().trim();
    if (salesTypeValue) {
      const salesTypeUpper = salesTypeValue.toUpperCase();
      if (salesTypeUpper in SalesType) {
        salesType = SalesType[salesTypeUpper as keyof typeof SalesType];
      }
    }

    // Validate and map payment terms
    let paymentTerms: PaymentTerms = PaymentTerms.COD_IML;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const termsValue = (row.terms || row.paymentTerms || '').toString().trim();
    if (termsValue) {
      // Map common payment terms formats (e.g., "COD-IML", "15 Days", "30 Days")
      if (termsValue.toUpperCase().includes('COD')) {
        paymentTerms = PaymentTerms.COD_IML;
      } else if (termsValue.includes('15') || termsValue.toLowerCase().includes('fifteen')) {
        paymentTerms = PaymentTerms.FIFTEEN_DAYS;
      } else if (termsValue.includes('30') || termsValue.toLowerCase().includes('thirty')) {
        paymentTerms = PaymentTerms.THIRTY_DAYS;
      } else if (termsValue.includes('45') || termsValue.toLowerCase().includes('forty')) {
        paymentTerms = PaymentTerms.FORTY_FIVE_DAYS;
      } else if (termsValue.includes('60') || termsValue.toLowerCase().includes('sixty')) {
        paymentTerms = PaymentTerms.SIXTY_DAYS;
      }
    }

    // Status is always ACTIVE for imported customers
    const status: Status = Status.ACTIVE;

    // Validate email format if provided (skip validation for '#####' placeholder)
    if (email && email !== '' && email !== '#####') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email format: ${email}`);
      }
    }

    return {
      sNo: sNo || '#####',
      name: name || '#####',
      shortName: shortName || '#####',
      branchName: branchName || '#####',
      cityArea: cityArea || '#####',
      email: email === '#####' ? null : email, // Convert '#####' back to null for email (nullable field)
      smsPhone: smsPhone || '#####',
      currency: currency || 'LKR',
      salesType,
      paymentTerms,
      dob: dob || new Date('2000-01-01'), // Replace empty dates with '2000-01-01'
      address: address === '#####' ? null : address, // Convert '#####' back to null for address (nullable field)
      status,
      salesGroup: salesGroup || '#####',
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

  /**
   * Export customers to CSV with optional filtering
   */
  async exportToCsv(filters: {
    cityArea?: string;
    searchTerm?: string;
    customerType?: CustomerType;
    salesType?: SalesType;
    status?: Status;
    salesGroup?: string;
    sNo?: string;
  } = {}): Promise<string> {
    const {
      searchTerm,
      customerType,
      salesType,
      status,
      cityArea,
      salesGroup,
      sNo,
    } = filters;

    // Build query using QueryBuilder (similar to findAll but without pagination)
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // Apply searchTerm filter - search across multiple fields
    if (searchTerm) {
      queryBuilder.andWhere(
        `(
          LOWER(customer.name) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.sNo) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.shortName) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.email) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.smsPhone) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.branchName) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.cityArea) LIKE LOWER(:searchTerm) OR 
          LOWER(customer.salesGroup) LIKE LOWER(:searchTerm) OR
          LOWER(customer.address) LIKE LOWER(:searchTerm)
        )`,
        { searchTerm: `%${searchTerm}%` },
      );
    }

    // Apply sNo filter
    if (sNo) {
      queryBuilder.andWhere('LOWER(customer.sNo) LIKE LOWER(:sNo)', {
        sNo: `%${sNo}%`,
      });
    }

    // Apply cityArea filter (primary filter for export)
    if (cityArea) {
      queryBuilder.andWhere('LOWER(customer.cityArea) LIKE LOWER(:cityArea)', {
        cityArea: `%${cityArea}%`,
      });
    }

    // Apply other filters
    if (customerType) {
      queryBuilder.andWhere('customer.customerType = :customerType', {
        customerType,
      });
    }

    if (salesType) {
      queryBuilder.andWhere('customer.salesType = :salesType', { salesType });
    }

    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    if (salesGroup) {
      queryBuilder.andWhere('LOWER(customer.salesGroup) LIKE LOWER(:salesGroup)', {
        salesGroup: `%${salesGroup}%`,
      });
    }

    // Get all customers matching the filters (no pagination for export)
    const customers = await queryBuilder
      .orderBy('customer.createdAt', 'DESC')
      .getMany();

    if (customers.length === 0) {
      throw new NotFoundException('No customers found to export');
    }

    // Define CSV headers (matching import format)
    const headers = [
      'S_No',
      'Name',
      'Short Name',
      'Branch Name',
      'City/Area',
      'Email',
      'SMS Phone',
      'Currency',
      'Sales Type',
      'Payment Terms',
      'Date of Birth',
      'Address',
      'Status',
      'Sales Group',
      'Customer Type',
      'Created At',
      'Updated At',
    ];

    // Build CSV content
    let csvContent = headers.join(',') + '\n';

    customers.forEach((customer) => {
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const formatDate = (date: Date | null | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      const row = [
        escapeCSV(customer.sNo),
        escapeCSV(customer.name),
        escapeCSV(customer.shortName),
        escapeCSV(customer.branchName),
        escapeCSV(customer.cityArea),
        escapeCSV(customer.email),
        escapeCSV(customer.smsPhone),
        escapeCSV(customer.currency),
        escapeCSV(customer.salesType),
        escapeCSV(customer.paymentTerms),
        escapeCSV(customer.dob ? formatDate(customer.dob) : ''),
        escapeCSV(customer.address),
        escapeCSV(customer.status),
        escapeCSV(customer.salesGroup),
        escapeCSV(customer.customerType),
        escapeCSV(customer.createdAt ? formatDate(customer.createdAt) : ''),
        escapeCSV(customer.updatedAt ? formatDate(customer.updatedAt) : ''),
      ];

      csvContent += row.join(',') + '\n';
    });

    this.logger.log(
      `Exported ${customers.length} customers to CSV${cityArea ? ` (filtered by City/Area: ${cityArea})` : ''}`,
    );

    return csvContent;
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
