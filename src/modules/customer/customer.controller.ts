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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CustomerService } from './customer.service';
import * as customerInterface from '../../common/interfaces/customer.interface';

import { CustomerType } from '../../common/enums/customer.enum';
import { SalesType } from '../../common/enums/sales-type';
import { Status } from '../../common/enums/status';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvImportResponseDto } from '../../common/interfaces/customer.interface';

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

  @Post('import-csv')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CsvImportResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }
    if (file.size === 0) {
      throw new BadRequestException('File is empty');
    }

    const result = await this.customerService.importFromCsv(file.buffer);

    return {
      success: result.success,
      message: result.message,
      totalRecords: result.totalRecords,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findAll(
    @Query('search') searchTerm?: string,
    @Query('type') customerType?: CustomerType,
    @Query('salesType') salesType?: SalesType,
    @Query('status') status?: Status,
    @Query('cityArea') cityArea?: string,
    @Query('salesGroup') salesGroup?: string,
    @Query('sNo') sNo?: string, // Added sNo query parameter
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
      customerType,

      salesType,

      status,
      cityArea,
      salesGroup,
      sNo, // Added sNo to filters
      page,
      limit: limit > 100 ? 100 : limit,
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

  @Get('sno/:sNo')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOneBySNo(
    @Param('sNo') sNo: string,
  ): Promise<customerInterface.CustomerResponseDto> {
    return this.customerService.findOneBySNo(sNo);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: customerInterface.UpdateCustomerDto,
  ): Promise<customerInterface.CustomerResponseDto> {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.customerService.remove(id);
  }

  @Get('search/:term')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async search(
    @Param('term') searchTerm: string,
  ): Promise<customerInterface.CustomerResponseDto[]> {
    return this.customerService.search(searchTerm);
  }

  @Get(':id/complaints')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findCustomerComplaints(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    message: string;
    customer: customerInterface.CustomerResponseDto;
    complaints: any[];
  }> {
    return this.customerService.findCustomerComplaints(id);
  }
}
