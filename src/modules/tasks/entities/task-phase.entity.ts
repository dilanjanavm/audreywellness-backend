import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../../../common/enums/task.enum';
import { TaskEntity } from './task.entity';

@Entity('task_phases')
export class TaskPhaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ length: 32, default: '#d9d9d9' })
  color: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'order_index', type: 'int', unsigned: true, default: 0 })
  order: number;

  @Column({ type: 'simple-array' })
  statuses: TaskStatus[];

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TaskEntity, (task) => task.phase, { cascade: false })
  tasks?: TaskEntity[];
}
