import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CostingEntity } from './costing.entity';
import { BatchSize } from '../../../common/enums/batch.enum';

// src/modules/costing/entities/costing-additional-cost.entity.ts
@Entity('costing_additional_costs')
export class CostingAdditionalCost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CostingEntity, (costing) => costing.additionalCosts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'costingId' })
  costing: CostingEntity;

  @Column()
  costingId: string;

  @Column()
  costName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  costPerUnit: number;

  // Store batch costs in JSON
  @Column('json')
  batchCosts: Record<BatchSize, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
