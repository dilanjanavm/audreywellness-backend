// src/modules/permissions/dto/permission-response.dto.ts
export class PermissionResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  module: string;
  createdAt: Date;
  updatedAt: Date;
}

