import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from '../user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(150)
  age?: number;

  @IsString()
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  permissionIds?: string[]; // Array of permission IDs to assign

  // Password is optional - will be auto-generated if not provided
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean = true; // Default to true - send email with credentials
}
