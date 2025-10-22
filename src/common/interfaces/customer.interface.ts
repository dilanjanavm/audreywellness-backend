// src/common/interfaces/customer.interface.ts
import { CustomerType } from '../enums/customer.enum';
import { PaymentTerms } from '../enums/payment-terms';
import { SalesType } from '../enums/sales-type';
import { Status } from '../enums/status';

export interface CreateCustomerDto {
  sNo: string; // Added sNo field
  name: string;
  shortName: string;
  phone?: string;
  branchName: string;
  cityArea: string;
  email?: string;
  smsPhone: string;
  currency?: string;
  salesType?: SalesType;
  paymentTerms?: PaymentTerms;
  dob?: Date;
  address?: string;
  status?: Status;
  salesGroup: string;
  customerType?: CustomerType;
}

export interface UpdateCustomerDto {
  sNo?: string; // Added sNo field
  name?: string;
  shortName?: string;
  branchName?: string;
  cityArea?: string;
  email?: string;
  smsPhone?: string;
  currency?: string;
  salesType?: SalesType;
  paymentTerms?: PaymentTerms;
  dob?: Date;
  address?: string;
  status?: Status;
  salesGroup?: string;
  customerType?: CustomerType;
}

export interface CustomerResponseDto {
  id: string;
  sNo: string; // Changed from customerCode to sNo
  name: string;
  shortName: string;
  branchName: string;
  cityArea: string;
  email?: string;
  smsPhone: string;
  currency: string;
  salesType: SalesType;
  paymentTerms: PaymentTerms;
  dob?: Date;
  address?: string;
  status: Status;
  salesGroup: string;
  customerType: CustomerType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSearchFilters {
  searchTerm?: string;
  customerType?: CustomerType;
  salesType?: SalesType;
  status?: Status;
  cityArea?: string;
  salesGroup?: string;
  sNo?: string; // Added sNo filter
  page?: number;
  limit?: number;
}

export interface CustomerCsvDto {
  sNo: string;
  name: string;
  shortName: string;
  branchName: string;
  cityArea: string;
  email?: string;
  smsPhone: string;
  currency: string;
  salesType: SalesType;
  paymentTerms: PaymentTerms;
  dob?: string;
  address?: string;
  status: Status;
  salesGroup: string;
}

export interface CsvImportResponseDto {
  success: boolean;
  message: string;
  totalRecords: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface CsvImportResult {
  success: boolean;
  message: string;
  totalRecords: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}