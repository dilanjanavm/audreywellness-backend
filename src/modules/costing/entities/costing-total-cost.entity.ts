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

// src/modules/costing/entities/costing-total-cost.entity.ts
@Entity('costing_total_costs')
export class CostingTotalCost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CostingEntity, (costing) => costing.totalCosts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'costingId' })
  costing: CostingEntity;

  @Column()
  costingId: string;

  @Column({
    type: 'enum',
    enum: BatchSize,
  })
  batchSize: BatchSize;

  @Column('decimal', { precision: 15, scale: 2 })
  cost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  kg: number;

  // Breakdown for validation
  @Column('decimal', { precision: 15, scale: 4 })
  rawMaterialCost: number;

  @Column('decimal', { precision: 15, scale: 4 })
  additionalCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
