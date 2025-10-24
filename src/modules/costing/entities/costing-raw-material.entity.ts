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
import { ItemEntity } from '../../item/entities/item.entity';

// src/modules/costing/entities/costing-raw-material.entity.ts
@Entity('costing_raw_materials')
export class CostingRawMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CostingEntity, (costing) => costing.rawMaterials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'costingId' })
  costing: CostingEntity;

  @Column()
  costingId: string;

  // Link to actual raw material item from your items table
  @ManyToOne(() => ItemEntity, { eager: true })
  @JoinColumn({ name: 'rawMaterialItemId' })
  rawMaterialItem: ItemEntity;

  @Column()
  rawMaterialItemId: string;

  @Column()
  rawMaterialName: string;

  @Column('decimal', { precision: 10, scale: 4 })
  percentage: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number; // Snapshot of price at costing time

  // Link to supplier from your suppliers table
  @Column()
  supplierId: string;

  @Column()
  supplierName: string;

  @Column()
  category: string;

  @Column()
  categoryId: string;

  @Column()
  units: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amountNeeded: number;

  // Calculated fields
  @Column('decimal', { precision: 15, scale: 4 })
  totalCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
