// src/modules/roles/roles.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../role-permissions/entities/role-permission.entity';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) { }

  /**
   * Create a new role
   */
  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    this.logger.log(`Creating role: ${createRoleDto.name}`);

    try {
      // Check if role with name already exists
      const existingRoleByName = await this.roleRepository.findOne({
        where: { name: createRoleDto.name },
      });
      if (existingRoleByName) {
        throw new BadRequestException(
          `Role with name "${createRoleDto.name}" already exists`,
        );
      }

      // Check if role with code already exists
      const existingRoleByCode = await this.roleRepository.findOne({
        where: { code: createRoleDto.code },
      });
      if (existingRoleByCode) {
        throw new BadRequestException(
          `Role with code "${createRoleDto.code}" already exists`,
        );
      }

      // Create role
      const role = this.roleRepository.create({
        name: createRoleDto.name,
        code: createRoleDto.code,
        description: createRoleDto.description,
        isActive: createRoleDto.isActive !== undefined ? createRoleDto.isActive : true,
      });

      const savedRole = await this.roleRepository.save(role);

      // Assign permissions if provided
      if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
        await this.assignPermissions(savedRole.id, createRoleDto.permissionIds);
      }

      return this.findOne(savedRole.id);
    } catch (error) {
      this.logger.error(`Error creating role: ${error.message}`, error.stack);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create role');
    }
  }

  /**
   * Find all roles
   */
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { createdAt: 'DESC' },
    });

    return roles.map((role) => this.mapToResponseDto(role));
  }

  /**
   * Find role by ID
   */
  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.mapToResponseDto(role);
  }

  /**
   * Update role
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check name uniqueness if being updated
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });
      if (existingRole) {
        throw new BadRequestException(
          `Role with name "${updateRoleDto.name}" already exists`,
        );
      }
    }

    // Check code uniqueness if being updated
    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      const existingRole = await this.roleRepository.findOne({
        where: { code: updateRoleDto.code },
      });
      if (existingRole) {
        throw new BadRequestException(
          `Role with code "${updateRoleDto.code}" already exists`,
        );
      }
    }

    // Update role
    Object.assign(role, updateRoleDto);
    await this.roleRepository.save(role);

    // Update permissions if provided
    if (updateRoleDto.permissionIds) {
      // Remove existing permissions
      await this.rolePermissionRepository.delete({ roleId: id });
      // Assign new permissions
      if (updateRoleDto.permissionIds.length > 0) {
        await this.assignPermissions(id, updateRoleDto.permissionIds);
      }
    }

    return this.findOne(id);
  }

  /**
   * Delete role
   */
  async remove(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if role is in use
    // You might want to add a check here to see if any users are using this role

    // Soft delete by setting isActive to false instead of hard delete
    role.isActive = false;
    await this.roleRepository.save(role);

    this.logger.log(`Role deactivated: ${id}`);
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Validate all permissions exist
    const permissions = await this.permissionRepository.find({
      where: permissionIds.map((id) => ({ id })),
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Remove existing permissions first to prevent duplicates (Replace existing set)
    await this.rolePermissionRepository.delete({ roleId });

    // Create role-permission relationships
    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);
    this.logger.log(
      `Assigned ${permissionIds.length} permissions to role ${roleId}`,
    );
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<any[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });

    return rolePermissions.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      code: rp.permission.code,
      description: rp.permission.description,
      module: rp.permission.module,
    }));
  }

  /**
   * Map role entity to response DTO
   */
  private mapToResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isActive: role.isActive,
      permissions: role.rolePermissions?.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        description: rp.permission.description,
        module: rp.permission.module,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

