// src/modules/roles/dto/create-role.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, {
    message: 'Code must be uppercase letters and underscores only (e.g., ADMIN, MANAGER)',
  })
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[]; // Array of permission IDs to assign
}

