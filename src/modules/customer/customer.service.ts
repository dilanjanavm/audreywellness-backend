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

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async generateCustomerCode(): Promise<string> {
    const lastCustomer = await this.customerRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!lastCustomer) {
      return 'CUST-2025-001';
    }

    const lastCode = lastCustomer.customerCode;
    const lastNumber = parseInt(lastCode.split('-')[2]);
    const newNumber = (lastNumber + 1).toString().padStart(3, '0');

    return `CUST-2025-${newNumber}`;
  }

  async create(createCustomerDto: {
    fullName: string;
    email: string;
    phone: string;
  }): Promise<CustomerResponseDto> {
    // Check if email already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: createCustomerDto.email },
      withDeleted: true,
    });

    if (existingCustomer) {
      throw new ConflictException(
        `Customer with email ${createCustomerDto.email} already exists`,
      );
    }

    const customerCode = await this.generateCustomerCode();

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      customerCode,
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
    const { searchTerm, customerType, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<CustomerEntity> = {};

    if (searchTerm) {
      where.fullName = ILike(`%${searchTerm}%`);
    }

    if (customerType) {
      where.customerType = customerType;
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

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check if email is being updated and if it already exists
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
      });

      if (existingCustomer) {
        throw new ConflictException(
          `Customer with email ${updateCustomerDto.email} already exists`,
        );
      }
    }

    const updatedCustomer = await this.customerRepository.save({
      ...customer,
      ...updateCustomerDto,
    });

    return this.mapToResponseDto(updatedCustomer);
  }

  // In customer.service.ts - update the remove method with detailed logging
  async remove(id: string): Promise<{ message: string }> {
    try {
      console.log(`🔄 Attempting to delete customer with ID: ${id}`);

      // First, check if customer exists
      const customer = await this.customerRepository.findOne({
        where: { id },
      });

      console.log(`🔍 Customer found:`, customer);

      if (!customer) {
        console.log(`❌ Customer with ID ${id} not found`);
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      console.log(`🗑️ Performing soft delete for customer: ${id}`);

      // Perform soft delete
      const result = await this.customerRepository.softDelete({ id });

      console.log(`✅ Soft delete result:`, result);

      if (result.affected === 0) {
        console.log(`❌ No rows affected during delete`);
        throw new NotFoundException(
          `Customer with ID ${id} not found or already deleted`,
        );
      }

      console.log(`✅ Customer ${id} deleted successfully`);

      return { message: 'Customer deleted successfully' };
    } catch (error) {
      console.error('❌ Error in customer delete:', error);
      // If it's already a NestJS HTTP exception, re-throw it
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // For other errors, throw internal server error with details
      throw new InternalServerErrorException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Failed to delete customer: ${error.message}`,
      );
    }
  }
  // In customer.service.ts - fix the search method
  async search(searchTerm: string): Promise<CustomerResponseDto[]> {
    try {
      console.log(`🔍 Searching customers with term: ${searchTerm}`);

      if (!searchTerm || searchTerm.trim().length === 0) {
        return []; // Return empty array instead of throwing error
      }

      const trimmedTerm = searchTerm.trim();

      if (trimmedTerm.length < 2) {
        return []; // Return empty for very short search terms
      }
      const customers = await this.customerRepository.find({
        where: [
          { fullName: ILike(`%${trimmedTerm}%`) },
          { email: ILike(`%${trimmedTerm}%`) },
          { phone: ILike(`%${trimmedTerm}%`) },
        ],
        order: { fullName: 'ASC' },
        take: 20,
      });

      console.log(
        `✅ Found ${customers.length} customers for search: ${trimmedTerm}`,
      );


      return customers.map((customer) => this.mapToResponseDto(customer));
    } catch (error) {
      console.error('❌ Error in customer search:', error);
      throw new InternalServerErrorException(
        'Search failed due to server error',
      );
    }
  }
  // In customer.service.ts - fix the findCustomerComplaints method
  async findCustomerComplaints(customerId: string): Promise<{
    message: string;
    customer: CustomerResponseDto;
    complaints: any[];
  }> {
    try {
      console.log(`🔍 Getting complaints for customer ID: ${customerId}`);

      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }

      // Temporary implementation until complaints module is built
      const customerData = this.mapToResponseDto(customer);

      return {
        message: 'Complaints feature will be available soon',
        customer: customerData,
        complaints: [], // Empty array for now
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

  private mapToResponseDto(customer: CustomerEntity): CustomerResponseDto {
    return {
      id: customer.id,
      customerCode: customer.customerCode,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,

      customerType: customer.customerType,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
