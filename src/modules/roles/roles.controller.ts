// src/modules/roles/roles.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<{ data: RoleResponseDto }> {
    this.logger.log(`POST /roles - Creating role: ${createRoleDto.name}`);
    try {
      const role = await this.rolesService.create(createRoleDto);
      this.logger.log(`POST /roles - Role created successfully: ${role.id}`);
      return { data: role };
    } catch (error) {
      this.logger.error(`POST /roles - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  async findAll(): Promise<{ data: RoleResponseDto[] }> {
    this.logger.log(`GET /roles - Getting all roles`);
    try {
      const roles = await this.rolesService.findAll();
      return { data: roles };
    } catch (error) {
      this.logger.error(`GET /roles - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: RoleResponseDto }> {
    this.logger.log(`GET /roles/${id} - Getting role`);
    try {
      const role = await this.rolesService.findOne(id);
      return { data: role };
    } catch (error) {
      this.logger.error(`GET /roles/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<{ message: string; data: RoleResponseDto }> {
    this.logger.log(`PUT /roles/${id} - Updating role`);
    try {
      const role = await this.rolesService.update(id, updateRoleDto);
      return {
        message: 'Role updated successfully',
        data: role,
      };
    } catch (error) {
      this.logger.error(`PUT /roles/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    this.logger.log(`DELETE /roles/${id} - Deleting role`);
    try {
      await this.rolesService.remove(id);
      return { message: 'Role deleted successfully' };
    } catch (error) {
      this.logger.error(`DELETE /roles/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('permissionIds') permissionIds: string[],
  ): Promise<{ message: string; data: RoleResponseDto }> {
    this.logger.log(`POST /roles/${id}/permissions - Assigning permissions`);
    try {
      await this.rolesService.assignPermissions(id, permissionIds);
      const role = await this.rolesService.findOne(id);
      return {
        message: 'Permissions assigned successfully',
        data: role,
      };
    } catch (error) {
      this.logger.error(`POST /roles/${id}/permissions - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/permissions')
  async getRolePermissions(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: any[] }> {
    this.logger.log(`GET /roles/${id}/permissions - Getting role permissions`);
    try {
      const permissions = await this.rolesService.getRolePermissions(id);
      return { data: permissions };
    } catch (error) {
      this.logger.error(`GET /roles/${id}/permissions - Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}

