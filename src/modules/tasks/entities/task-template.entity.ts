import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskPhaseEntity } from './task-phase.entity';
import { User } from '../../users/user.entity';

export interface MandatoryFields {
  taskName: boolean;
  taskDescription?: boolean;
  assignTo: boolean;
  priority: boolean;
  startDate: boolean;
  endDate: boolean;
  status: boolean;
}

export interface OptionalFieldConfig {
  [fieldKey: string]: {
    inputType: 'text' | 'number' | 'select' | 'ratios' | 'check' | 'radio' | 'checkboxGroup';
  };
}

@Entity('task_templates')
@Index(['assignedPhaseId'])
@Index(['isDefault'], { where: 'isDefault = true' })
export class TaskTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @ManyToOne(() => TaskPhaseEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_phase_id' })
  assignedPhase?: TaskPhaseEntity;

  @Column({ name: 'assigned_phase_id', type: 'uuid', nullable: true })
  assignedPhaseId?: string;

  @Column({ name: 'mandatory_fields', type: 'json' })
  mandatoryFields: MandatoryFields;

  @Column({ name: 'optional_fields', type: 'json', nullable: true })
  optionalFields?: string[];

  @Column({ name: 'optional_field_config', type: 'json', nullable: true })
  optionalFieldConfig?: OptionalFieldConfig;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
