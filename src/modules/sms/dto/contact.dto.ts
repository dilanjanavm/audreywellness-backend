import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateContactDto {
  @IsNumber()
  @IsNotEmpty()
  phone: number;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}

export class UpdateContactDto {
  @IsNumber()
  @IsNotEmpty()
  phone: number;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}
