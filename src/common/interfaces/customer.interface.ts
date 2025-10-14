// src/common/interfaces/customer.interface.ts

import { CustomerType } from '../enums/customer.enum';

export interface CreateCustomerDto {
  fullName: string;
  email: string;
  phone: string;
  customerType?: CustomerType;
  address?: string;
  city?: string;
  country?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface CustomerResponseDto {
  id: string;
  customerCode: string;
  fullName: string;
  email: string;
  phone: string;
  customerType: CustomerType;
  address?: string;
  city?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSearchFilters {
  searchTerm?: string;
  customerType?: CustomerType;
  page?: number;
  limit?: number;
}
