// src/modules/suppliers/dto/create-supplier.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsPhoneNumber,
  MinLength, IsArray, IsUUID,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MinLength(2, { message: 'Supplier name must be at least 2 characters' })
  name: string;

  @IsString()
  @MinLength(2, { message: 'Reference must be at least 2 characters' })
  reference: string;

  @IsString()
  @MinLength(5, { message: 'Address must be at least 5 characters' })
  address: string;

  @IsString()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phone: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  phone2?: string;

  @IsOptional()
  @IsString()
  fax?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  itemIds?: string[]; // Array of item IDs to link

  @IsOptional()
  @IsString()
  ntnNumber?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  taxGroup?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
