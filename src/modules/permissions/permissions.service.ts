// src/modules/permissions/permissions.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Create a new permission
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    this.logger.log(`Creating permission: ${createPermissionDto.name}`);

    try {
      // Check if permission with name already exists
      const existingPermissionByName = await this.permissionRepository.findOne({
        where: { name: createPermissionDto.name },
      });
      if (existingPermissionByName) {
        throw new BadRequestException(
          `Permission with name "${createPermissionDto.name}" already exists`,
        );
      }

      // Check if permission with code already exists
      const existingPermissionByCode = await this.permissionRepository.findOne({
        where: { code: createPermissionDto.code },
      });
      if (existingPermissionByCode) {
        throw new BadRequestException(
          `Permission with code "${createPermissionDto.code}" already exists`,
        );
      }

      // Create permission
      const permission = this.permissionRepository.create(createPermissionDto);
      const savedPermission = await this.permissionRepository.save(permission);

      this.logger.log(`Permission created successfully: ${savedPermission.id}`);
      return this.mapToResponseDto(savedPermission);
    } catch (error) {
      this.logger.error(`Error creating permission: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create permission');
    }
  }

  /**
   * Find all permissions
   */
  async findAll(module?: string): Promise<PermissionResponseDto[]> {
    const query = this.permissionRepository.createQueryBuilder('permission');

    if (module) {
      query.where('permission.module = :module', { module });
    }

    const permissions = await query.orderBy('permission.module', 'ASC').addOrderBy('permission.name', 'ASC').getMany();

    return permissions.map((permission) => this.mapToResponseDto(permission));
  }

  /**
   * Find permission by ID
   */
  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return this.mapToResponseDto(permission);
  }

  /**
   * Update permission
   */
  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check name uniqueness if being updated
    if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: updatePermissionDto.name },
      });
      if (existingPermission) {
        throw new BadRequestException(
          `Permission with name "${updatePermissionDto.name}" already exists`,
        );
      }
    }

    // Check code uniqueness if being updated
    if (updatePermissionDto.code && updatePermissionDto.code !== permission.code) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: updatePermissionDto.code },
      });
      if (existingPermission) {
        throw new BadRequestException(
          `Permission with code "${updatePermissionDto.code}" already exists`,
        );
      }
    }

    // Update permission
    Object.assign(permission, updatePermissionDto);
    const updatedPermission = await this.permissionRepository.save(permission);

    return this.mapToResponseDto(updatedPermission);
  }

  /**
   * Delete permission
   */
  async remove(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    await this.permissionRepository.delete(id);
    this.logger.log(`Permission deleted: ${id}`);
  }

  /**
   * Get permissions by module
   */
  async findByModule(module: string): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.find({
      where: { module },
      order: { name: 'ASC' },
    });

    return permissions.map((permission) => this.mapToResponseDto(permission));
  }

  /**
   * Get all permissions grouped by module (for frontend role management)
   */
  async findAllGroupedByModule(): Promise<{
    modules: { [module: string]: PermissionResponseDto[] };
    totalPermissions: number;
    totalModules: number;
  }> {
    const permissions = await this.permissionRepository.find({
      order: { module: 'ASC', name: 'ASC' },
    });

    const grouped: { [module: string]: PermissionResponseDto[] } = {};
    
    permissions.forEach((permission) => {
      const module = permission.module;
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(this.mapToResponseDto(permission));
    });

    return {
      modules: grouped,
      totalPermissions: permissions.length,
      totalModules: Object.keys(grouped).length,
    };
  }

  /**
   * Map permission entity to response DTO
   */
  private mapToResponseDto(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      code: permission.code,
      description: permission.description,
      module: permission.module,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}

