import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateCourierOrderDto {
  @IsString()
  @IsNotEmpty()
  reference: string;

  // From Address
  @IsString()
  @IsNotEmpty()
  fromName: string;

  @IsString()
  @IsNotEmpty()
  fromAddressLine1: string;

  @IsString()
  @IsOptional()
  fromAddressLine2?: string;

  @IsString()
  @IsOptional()
  fromAddressLine3?: string;

  @IsString()
  @IsOptional()
  fromAddressLine4?: string;

  @IsString()
  @IsOptional()
  fromContactName?: string;

  @IsString()
  @IsNotEmpty()
  fromContact1: string;

  @IsString()
  @IsOptional()
  fromContact2?: string;

  // To Address
  @IsString()
  @IsNotEmpty()
  toName: string;

  @IsString()
  @IsNotEmpty()
  toAddressLine1: string;

  @IsString()
  @IsOptional()
  toAddressLine2?: string;

  @IsString()
  @IsOptional()
  toAddressLine3?: string;

  @IsString()
  @IsOptional()
  toAddressLine4?: string;

  @IsString()
  @IsOptional()
  toContactName?: string;

  @IsString()
  @IsNotEmpty()
  toContact1: string;

  @IsString()
  @IsOptional()
  toContact2?: string;

  @IsString()
  @IsOptional()
  toNic?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  weightG: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => o.cashOnDeliveryAmount !== undefined)
  cashOnDeliveryAmount?: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfPieces?: number;
}

