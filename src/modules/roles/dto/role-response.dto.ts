// src/modules/roles/dto/role-response.dto.ts
import { PermissionResponseDto } from '../../permissions/dto/permission-response.dto';

export class RoleResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  permissions?: PermissionResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

