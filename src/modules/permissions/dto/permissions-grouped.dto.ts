// src/modules/permissions/dto/permissions-grouped.dto.ts
import { PermissionResponseDto } from './permission-response.dto';

export interface PermissionsGroupedByModule {
  [module: string]: PermissionResponseDto[];
}

export class PermissionsGroupedResponseDto {
  modules: PermissionsGroupedByModule;
  totalPermissions: number;
  totalModules: number;
}

