import { UnitType } from '../enums/item.enum';
import { Status } from '../enums/status';
import { Supplier } from '../../modules/suppliers/entities/supplier.entity';
import { ApiProperty } from '@nestjs/swagger';

export interface CreateItemDto {
  itemCode: string;
  stockId: string;
  description: string;
  category: string;
  categoryId?: string;
  units: UnitType;
  price?: number;
  altPrice?: number;
  currency?: string;
  status?: Status;
  supplierIds?: string[]; // Array of supplier IDs
}

export interface UpdateItemDto {
  description?: string;
  category?: string;
  categoryId?: string;
  units?: UnitType;
  price?: number;
  altPrice?: number;
  currency?: string;
  status?: Status;
  supplierIds?: string[];
}

export class ItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  stockId: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ required: false })
  categoryId?: string;

  @ApiProperty()
  units: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  altPrice: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ type: [Object] })
  suppliers: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
