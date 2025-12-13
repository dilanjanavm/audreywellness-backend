// src/modules/permissions/entities/permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from '../../role-permissions/entities/role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string; // e.g., 'USER_CREATE', 'USER_UPDATE', 'TASK_DELETE'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  module: string; // e.g., 'users', 'tasks', 'costing', 'customers'

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
    { cascade: true },
  )
  rolePermissions: RolePermission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

