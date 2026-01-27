// src/modules/role-permissions/role-permissions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from './entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  exports: [TypeOrmModule],
})
export class RolePermissionsModule {}

