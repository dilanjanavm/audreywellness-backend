// src/modules/customer/customer.controller.ts
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
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CustomerService } from './customer.service';
import * as customerInterface from '../../common/interfaces/customer.interface';
import { CustomerResponseDto } from '../../common/interfaces/customer.interface';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(
    @Body() createCustomerDto: customerInterface.CreateCustomerDto,
  ): Promise<customerInterface.CustomerResponseDto> {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findAll(
    @Query('search') searchTerm?: string,
    @Query('type') customerType?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<{
    data: customerInterface.CustomerResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filters: customerInterface.CustomerSearchFilters = {
      searchTerm,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      customerType: customerType as any,
      page,
      limit: limit > 100 ? 100 : limit, // Prevent excessive limits
    };

    return this.customerService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<customerInterface.CustomerResponseDto> {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: customerInterface.UpdateCustomerDto,
  ): Promise<customerInterface.CustomerResponseDto> {
    return this.customerService.update(id, updateCustomerDto);
  }

  // In customer.controller.ts - update the delete endpoint
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    console.log(id);
    return this.customerService.remove(id);
  }

  @Get('search/:term')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async search(
    @Param('term') searchTerm: string,
  ): Promise<CustomerResponseDto[]> {
    return this.customerService.search(searchTerm);
  }

  @Get(':id/complaints')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findCustomerComplaints(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    message: string;
    customer: CustomerResponseDto;
    complaints: any[];
  }> {
    return this.customerService.findCustomerComplaints(id);
  }
}
