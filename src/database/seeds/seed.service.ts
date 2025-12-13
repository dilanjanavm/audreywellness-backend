// src/database/seed/seed.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { RolePermission } from '../../modules/role-permissions/entities/role-permission.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async run() {
    this.logger.log('Starting database seeding...');

    // 1. Create all permissions
    const permissions = await this.createPermissions();

    // 2. Create Super Admin role
    const superAdminRole = await this.createSuperAdminRole(permissions);

    // 3. Create Super Admin user
    await this.createSuperAdminUser(superAdminRole);

    this.logger.log('✅ Database seeding completed successfully!');
  }

  /**
   * Define and create all permissions
   */
  private async createPermissions(): Promise<Permission[]> {
    this.logger.log('Creating permissions...');

    const permissionDefinitions = [
      // User Management Permissions
      { name: 'Create User', code: 'USER_CREATE', module: 'users', description: 'Permission to create new users' },
      { name: 'Update User', code: 'USER_UPDATE', module: 'users', description: 'Permission to update users' },
      { name: 'Delete User', code: 'USER_DELETE', module: 'users', description: 'Permission to delete users' },
      { name: 'View User', code: 'USER_VIEW', module: 'users', description: 'Permission to view users' },

      // Role Management Permissions
      { name: 'Create Role', code: 'ROLE_CREATE', module: 'roles', description: 'Permission to create roles' },
      { name: 'Update Role', code: 'ROLE_UPDATE', module: 'roles', description: 'Permission to update roles' },
      { name: 'Delete Role', code: 'ROLE_DELETE', module: 'roles', description: 'Permission to delete roles' },
      { name: 'View Role', code: 'ROLE_VIEW', module: 'roles', description: 'Permission to view roles' },
      { name: 'Assign Permissions', code: 'ROLE_ASSIGN_PERMISSIONS', module: 'roles', description: 'Permission to assign permissions to roles' },

      // Permission Management Permissions
      { name: 'Create Permission', code: 'PERMISSION_CREATE', module: 'permissions', description: 'Permission to create permissions' },
      { name: 'Update Permission', code: 'PERMISSION_UPDATE', module: 'permissions', description: 'Permission to update permissions' },
      { name: 'Delete Permission', code: 'PERMISSION_DELETE', module: 'permissions', description: 'Permission to delete permissions' },
      { name: 'View Permission', code: 'PERMISSION_VIEW', module: 'permissions', description: 'Permission to view permissions' },

      // Task Management Permissions
      { name: 'Create Task', code: 'TASK_CREATE', module: 'tasks', description: 'Permission to create tasks' },
      { name: 'Update Task', code: 'TASK_UPDATE', module: 'tasks', description: 'Permission to update tasks' },
      { name: 'Delete Task', code: 'TASK_DELETE', module: 'tasks', description: 'Permission to delete tasks' },
      { name: 'View Task', code: 'TASK_VIEW', module: 'tasks', description: 'Permission to view tasks' },

      // Costing Management Permissions
      { name: 'Create Costing', code: 'COSTING_CREATE', module: 'costing', description: 'Permission to create costings' },
      { name: 'Update Costing', code: 'COSTING_UPDATE', module: 'costing', description: 'Permission to update costings' },
      { name: 'Delete Costing', code: 'COSTING_DELETE', module: 'costing', description: 'Permission to delete costings' },
      { name: 'View Costing', code: 'COSTING_VIEW', module: 'costing', description: 'Permission to view costings' },

      // Customer Management Permissions
      { name: 'Create Customer', code: 'CUSTOMER_CREATE', module: 'customers', description: 'Permission to create customers' },
      { name: 'Update Customer', code: 'CUSTOMER_UPDATE', module: 'customers', description: 'Permission to update customers' },
      { name: 'Delete Customer', code: 'CUSTOMER_DELETE', module: 'customers', description: 'Permission to delete customers' },
      { name: 'View Customer', code: 'CUSTOMER_VIEW', module: 'customers', description: 'Permission to view customers' },

      // Supplier Management Permissions
      { name: 'Create Supplier', code: 'SUPPLIER_CREATE', module: 'suppliers', description: 'Permission to create suppliers' },
      { name: 'Update Supplier', code: 'SUPPLIER_UPDATE', module: 'suppliers', description: 'Permission to update suppliers' },
      { name: 'Delete Supplier', code: 'SUPPLIER_DELETE', module: 'suppliers', description: 'Permission to delete suppliers' },
      { name: 'View Supplier', code: 'SUPPLIER_VIEW', module: 'suppliers', description: 'Permission to view suppliers' },

      // Item Management Permissions
      { name: 'Create Item', code: 'ITEM_CREATE', module: 'items', description: 'Permission to create items' },
      { name: 'Update Item', code: 'ITEM_UPDATE', module: 'items', description: 'Permission to update items' },
      { name: 'Delete Item', code: 'ITEM_DELETE', module: 'items', description: 'Permission to delete items' },
      { name: 'View Item', code: 'ITEM_VIEW', module: 'items', description: 'Permission to view items' },

      // Category Management Permissions
      { name: 'Create Category', code: 'CATEGORY_CREATE', module: 'categories', description: 'Permission to create categories' },
      { name: 'Update Category', code: 'CATEGORY_UPDATE', module: 'categories', description: 'Permission to update categories' },
      { name: 'Delete Category', code: 'CATEGORY_DELETE', module: 'categories', description: 'Permission to delete categories' },
      { name: 'View Category', code: 'CATEGORY_VIEW', module: 'categories', description: 'Permission to view categories' },

      // Complaint Management Permissions
      { name: 'Create Complaint', code: 'COMPLAINT_CREATE', module: 'complaints', description: 'Permission to create complaints' },
      { name: 'Update Complaint', code: 'COMPLAINT_UPDATE', module: 'complaints', description: 'Permission to update complaints' },
      { name: 'Delete Complaint', code: 'COMPLAINT_DELETE', module: 'complaints', description: 'Permission to delete complaints' },
      { name: 'View Complaint', code: 'COMPLAINT_VIEW', module: 'complaints', description: 'Permission to view complaints' },
    ];

    const createdPermissions: Permission[] = [];

    for (const def of permissionDefinitions) {
      let permission = await this.permissionRepository.findOne({
        where: { code: def.code },
      });

      if (!permission) {
        permission = this.permissionRepository.create(def);
        permission = await this.permissionRepository.save(permission);
        this.logger.log(`✅ Created permission: ${def.code}`);
      } else {
        this.logger.log(`⚠️  Permission already exists: ${def.code}`);
      }

      createdPermissions.push(permission);
    }

    this.logger.log(`✅ Created/Verified ${createdPermissions.length} permissions`);
    return createdPermissions;
  }

  /**
   * Create Super Admin role and assign all permissions
   */
  private async createSuperAdminRole(permissions: Permission[]): Promise<Role> {
    this.logger.log('Creating Super Admin role...');

    // Check if role exists by code OR name (both are unique)
    let superAdminRole = await this.roleRepository.findOne({
      where: [{ code: 'SUPER_ADMIN' }, { name: 'Super Admin' }],
    });

    if (!superAdminRole) {
      try {
        superAdminRole = this.roleRepository.create({
          name: 'Super Admin',
          code: 'SUPER_ADMIN',
          description: 'Super Administrator with all permissions',
          isActive: true,
        });
        superAdminRole = await this.roleRepository.save(superAdminRole);
        this.logger.log('✅ Created Super Admin role');
      } catch (error: any) {
        // Handle race condition or duplicate entry errors
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
          this.logger.warn('⚠️  Super Admin role already exists (duplicate detected), fetching existing...');
          superAdminRole = await this.roleRepository.findOne({
            where: [{ code: 'SUPER_ADMIN' }, { name: 'Super Admin' }],
          });
          if (!superAdminRole) {
            throw new Error('Failed to create or find Super Admin role');
          }
        } else {
          throw error;
        }
      }
    } else {
      this.logger.log('⚠️  Super Admin role already exists');
    }

    // Assign all permissions to Super Admin role
    const existingRolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: superAdminRole.id },
    });

    const existingPermissionIds = new Set(
      existingRolePermissions.map((rp) => rp.permissionId),
    );

    const newRolePermissions = permissions
      .filter((p) => !existingPermissionIds.has(p.id))
      .map((permission) =>
        this.rolePermissionRepository.create({
          roleId: superAdminRole.id,
          permissionId: permission.id,
        }),
      );

    if (newRolePermissions.length > 0) {
      await this.rolePermissionRepository.save(newRolePermissions);
      this.logger.log(`✅ Assigned ${newRolePermissions.length} permissions to Super Admin role`);
    } else {
      this.logger.log('✅ All permissions already assigned to Super Admin role');
    }

    return superAdminRole;
  }

  /**
   * Create Super Admin user
   */
  private async createSuperAdminUser(superAdminRole: Role): Promise<void> {
    this.logger.log('Creating Super Admin user...');

    const adminEmail = 'admin@app.com';
    const adminPassword = '1234';

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log('⚠️  Admin user already exists. Updating role if needed...');
      
      // Update existing admin to have Super Admin role
      if (existingAdmin.roleId !== superAdminRole.id) {
        existingAdmin.roleId = superAdminRole.id;
        existingAdmin.legacyRole = UserRole.ADMIN;
        await this.userRepository.save(existingAdmin);
        this.logger.log('✅ Updated existing admin user with Super Admin role');
      }
      return;
    }

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const adminUser = this.userRepository.create({
        userName: 'admin',
        email: adminEmail,
        contactNumber: '0000000000',
        password: hashedPassword,
        roleId: superAdminRole.id,
        legacyRole: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
        mustChangePassword: false,
      });

      await this.userRepository.save(adminUser);
      this.logger.log('✅ Super Admin user created successfully!');
      this.logger.log('📧 Login Credentials:');
      this.logger.log(`   Email: ${adminEmail}`);
      this.logger.log(`   Password: ${adminPassword}`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        this.logger.warn('⚠️  Admin user already exists (duplicate detected)');
      } else {
        this.logger.error(`Failed to create admin user: ${error.message}`);
        throw error;
      }
    }
  }
}
