// src/modules/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  mobileNumber?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column()
  contactNumber: string;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender?: Gender;

  @Column()
  password: string;

  @Column({ nullable: true })
  tempPassword?: string; // Temporary password for first login

  @Column({ nullable: true })
  roleId?: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  // Keep legacy role enum for backward compatibility (will be deprecated)
  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: true,
  })
  legacyRole?: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  mustChangePassword: boolean; // Force password change on first login

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
