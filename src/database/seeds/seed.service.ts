// src/database/seed/seed.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { RolePermission } from '../../modules/role-permissions/entities/role-permission.entity';
import { TaskPhaseEntity } from '../../modules/tasks/entities/task-phase.entity';
import { TaskTemplateEntity } from '../../modules/tasks/entities/task-template.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { TaskStatus } from '../../common/enums/task.enum';
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
    @InjectRepository(TaskPhaseEntity)
    private readonly phaseRepository: Repository<TaskPhaseEntity>,
    @InjectRepository(TaskTemplateEntity)
    private readonly templateRepository: Repository<TaskTemplateEntity>,
    private readonly dataSource: DataSource,
<<<<<<< HEAD
  ) {}
=======
  ) { }
>>>>>>> origin/new-dev

  async run() {
    this.logger.log('Starting database seeding...');

    // 1. Create task_templates table if it doesn't exist
    await this.createTaskTemplatesTable();

    // 2. Create all permissions
    const permissions = await this.createPermissions();

    // 3. Create Super Admin role
    const superAdminRole = await this.createSuperAdminRole(permissions);

    // 4. Create Super Admin user
    await this.createSuperAdminUser(superAdminRole);

    // 5. Create initial task phases
    await this.createInitialPhases();

    // 6. Create initial task templates
    await this.createInitialTemplates();

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
<<<<<<< HEAD
=======

      // Recipe Management Permissions
      { name: 'Create Recipe', code: 'RECIPE_CREATE', module: 'recipes', description: 'Permission to create recipes' },
      { name: 'Update Recipe', code: 'RECIPE_UPDATE', module: 'recipes', description: 'Permission to update recipes' },
      { name: 'Delete Recipe', code: 'RECIPE_DELETE', module: 'recipes', description: 'Permission to delete recipes' },
      { name: 'View Recipe', code: 'RECIPE_VIEW', module: 'recipes', description: 'Permission to view recipes' },
>>>>>>> origin/new-dev
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
<<<<<<< HEAD
      
=======

>>>>>>> origin/new-dev
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

  /**
   * Create initial task phases (R&D, Blending, Filling & Packing, Dispatch)
   */
  private async createInitialPhases(): Promise<void> {
    this.logger.log('Creating initial task phases...');

    const phaseDefinitions = [
      {
        name: 'R&D',
        description: 'Research and Development phase',
        color: '#4A90E2', // Blue
        order: 1,
        statuses: [
          TaskStatus.PENDING,
          TaskStatus.ONGOING,
          TaskStatus.REVIEW,
          TaskStatus.COMPLETED,
          TaskStatus.FAILED,
        ],
      },
      {
        name: 'Blending',
        description: 'Blending phase',
        color: '#50C878', // Green
        order: 2,
        statuses: [
          TaskStatus.PENDING,
          TaskStatus.ONGOING,
          TaskStatus.REVIEW,
          TaskStatus.COMPLETED,
          TaskStatus.FAILED,
        ],
      },
      {
        name: 'Filling & Packing',
        description: 'Filling and Packing phase',
        color: '#FF6B6B', // Red/Orange
        order: 3,
        statuses: [
          TaskStatus.PENDING,
          TaskStatus.ONGOING,
          TaskStatus.REVIEW,
          TaskStatus.COMPLETED,
          TaskStatus.FAILED,
        ],
      },
      {
        name: 'Dispatch',
        description: 'Dispatch phase',
        color: '#9B59B6', // Purple
        order: 4,
        statuses: [
          TaskStatus.PENDING,
          TaskStatus.ONGOING,
          TaskStatus.REVIEW,
          TaskStatus.COMPLETED,
          TaskStatus.FAILED,
        ],
      },
    ];

    for (const phaseDef of phaseDefinitions) {
      let phase = await this.phaseRepository.findOne({
        where: { name: phaseDef.name },
      });

      if (!phase) {
        phase = this.phaseRepository.create({
          name: phaseDef.name,
          description: phaseDef.description,
          color: phaseDef.color,
          order: phaseDef.order,
          statuses: phaseDef.statuses,
        });
        phase = await this.phaseRepository.save(phase);
        this.logger.log(`✅ Created phase: ${phaseDef.name}`);
      } else {
        // Update existing phase to ensure it has correct order and statuses
        phase.order = phaseDef.order;
        phase.color = phaseDef.color;
        phase.description = phaseDef.description;
        phase.statuses = phaseDef.statuses;
        phase = await this.phaseRepository.save(phase);
        this.logger.log(`⚠️  Phase already exists, updated: ${phaseDef.name}`);
      }
    }

    this.logger.log('✅ Initial task phases created/verified successfully');
  }

  /**
   * Create task_templates table if it doesn't exist
   */
  private async createTaskTemplatesTable(): Promise<void> {
    this.logger.log('Checking/Creating task_templates table...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check if table exists
      const tableExists = await queryRunner.hasTable('task_templates');

      if (!tableExists) {
        this.logger.log('Creating task_templates table...');

        await queryRunner.query(`
          CREATE TABLE \`task_templates\` (
            \`id\` CHAR(36) PRIMARY KEY,
            \`name\` VARCHAR(255) NOT NULL,
            \`description\` TEXT NULL,
            \`is_default\` BOOLEAN DEFAULT FALSE,
            \`assigned_phase_id\` CHAR(36) NULL,
            \`mandatory_fields\` JSON NOT NULL,
            \`optional_fields\` JSON NULL,
            \`optional_field_config\` JSON NULL,
            \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            \`created_by\` CHAR(36) NULL,
            CONSTRAINT \`fk_template_phase\` FOREIGN KEY (\`assigned_phase_id\`) REFERENCES \`task_phases\` (\`id\`) ON DELETE SET NULL,
            CONSTRAINT \`fk_template_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
            INDEX \`idx_template_phase\` (\`assigned_phase_id\`),
            INDEX \`idx_template_default\` (\`is_default\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        this.logger.log('✅ Created task_templates table');
      } else {
        this.logger.log('⚠️  task_templates table already exists');
      }
    } catch (error: any) {
      // If table already exists or foreign key constraints fail (tables don't exist yet), that's okay
      if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
        this.logger.log('⚠️  Table creation skipped (may exist or dependencies not ready)');
      } else {
        this.logger.warn(`⚠️  Could not create task_templates table: ${error.message}`);
        // Don't throw - let TypeORM handle table creation if needed
      }
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create initial task templates (default template and Filling & Packing template)
   */
  private async createInitialTemplates(): Promise<void> {
    this.logger.log('Creating initial task templates...');

    // 1. Create default template
    let defaultTemplate = await this.templateRepository.findOne({
      where: { isDefault: true },
    });

    if (!defaultTemplate) {
      defaultTemplate = this.templateRepository.create({
        name: 'Default Task Template',
        description: 'Default template for all phases',
        isDefault: true,
        assignedPhaseId: undefined,
        mandatoryFields: {
          taskName: true,
          taskDescription: true,
          assignTo: true,
          priority: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        optionalFields: [],
        optionalFieldConfig: {},
      });

      defaultTemplate = await this.templateRepository.save(defaultTemplate);
      this.logger.log('✅ Created default task template');
    } else {
      this.logger.log('⚠️  Default template already exists');
    }

    // 2. Create Filling & Packing template (if phase exists)
    const fillingPackingPhase = await this.phaseRepository.findOne({
      where: { name: 'Filling & Packing' },
    });

    if (fillingPackingPhase) {
      let fillingPackingTemplate = await this.templateRepository.findOne({
        where: { assignedPhaseId: fillingPackingPhase.id },
      });

      if (!fillingPackingTemplate) {
        fillingPackingTemplate = this.templateRepository.create({
          name: 'Filling & Packing Template',
          description: 'Template for filling and packing phase with customer details',
          isDefault: false,
          assignedPhaseId: fillingPackingPhase.id,
          mandatoryFields: {
            taskName: true,
            taskDescription: true,
            assignTo: true,
            priority: true,
            startDate: true,
            endDate: true,
            status: true,
          },
          optionalFields: ['orderNumber', 'customerName', 'customerAddress', 'customerContact'],
          optionalFieldConfig: {
            orderNumber: { inputType: 'text' },
            customerName: { inputType: 'text' },
            customerAddress: { inputType: 'text' },
            customerContact: { inputType: 'text' },
          },
        });

        fillingPackingTemplate = await this.templateRepository.save(fillingPackingTemplate);
        this.logger.log('✅ Created Filling & Packing template');
      } else {
        this.logger.log('⚠️  Filling & Packing template already exists');
      }
    } else {
      this.logger.log('⚠️  Filling & Packing phase not found, skipping template creation');
    }

    this.logger.log('✅ Initial task templates created/verified successfully');
  }
}
