// src/modules/permissions/dto/create-permission.dto.ts
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, {
    message: 'Code must be uppercase letters and underscores only (e.g., USER_CREATE, TASK_UPDATE)',
  })
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  module: string; // e.g., 'users', 'tasks', 'costing', 'customers'
}

