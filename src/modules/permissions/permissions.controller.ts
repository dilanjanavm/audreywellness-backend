// src/modules/permissions/permissions.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';

@Controller('permissions')
export class PermissionsController {
  private readonly logger = new Logger(PermissionsController.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto): Promise<{ data: PermissionResponseDto }> {
    this.logger.log(`POST /permissions - Creating permission: ${createPermissionDto.name}`);
    try {
      const permission = await this.permissionsService.create(createPermissionDto);
      this.logger.log(`POST /permissions - Permission created successfully: ${permission.id}`);
      return { data: permission };
    } catch (error) {
      this.logger.error(`POST /permissions - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  async findAll(@Query('module') module?: string): Promise<{ data: PermissionResponseDto[] }> {
    this.logger.log(`GET /permissions - Getting all permissions${module ? ` for module: ${module}` : ''}`);
    try {
      const permissions = await this.permissionsService.findAll(module);
      return { data: permissions };
    } catch (error) {
      this.logger.error(`GET /permissions - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: PermissionResponseDto }> {
    this.logger.log(`GET /permissions/${id} - Getting permission`);
    try {
      const permission = await this.permissionsService.findOne(id);
      return { data: permission };
    } catch (error) {
      this.logger.error(`GET /permissions/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('module/:module')
  async findByModule(@Param('module') module: string): Promise<{ data: PermissionResponseDto[] }> {
    this.logger.log(`GET /permissions/module/${module} - Getting permissions by module`);
    try {
      const permissions = await this.permissionsService.findByModule(module);
      return { data: permissions };
    } catch (error) {
      this.logger.error(`GET /permissions/module/${module} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('grouped/by-module')
  async findAllGroupedByModule(): Promise<{
    data: {
      modules: { [module: string]: PermissionResponseDto[] };
      totalPermissions: number;
      totalModules: number;
    };
  }> {
    this.logger.log(`GET /permissions/grouped/by-module - Getting permissions grouped by module`);
    try {
      const grouped = await this.permissionsService.findAllGroupedByModule();
      return { data: grouped };
    } catch (error) {
      this.logger.error(`GET /permissions/grouped/by-module - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<{ message: string; data: PermissionResponseDto }> {
    this.logger.log(`PUT /permissions/${id} - Updating permission`);
    try {
      const permission = await this.permissionsService.update(id, updatePermissionDto);
      return {
        message: 'Permission updated successfully',
        data: permission,
      };
    } catch (error) {
      this.logger.error(`PUT /permissions/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    this.logger.log(`DELETE /permissions/${id} - Deleting permission`);
    try {
      await this.permissionsService.remove(id);
      return { message: 'Permission deleted successfully' };
    } catch (error) {
      this.logger.error(`DELETE /permissions/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}

