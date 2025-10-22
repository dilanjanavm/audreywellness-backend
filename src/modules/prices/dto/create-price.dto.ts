// src/modules/prices/dto/create-price.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreatePriceDto {
  @IsString()
  type: string;

  @IsString()
  stockId: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  itemCode?: string;

  // RELATIONSHIP: Item reference
  @IsOptional()
  @IsUUID()
  itemId?: string;

  // RELATIONSHIP: Category reference (required)
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNumber()
  @IsPositive()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altPrice?: number;

  @IsOptional()
  @IsString()
  supplierCode?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;
}