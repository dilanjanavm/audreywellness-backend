// src/modules/costing/entities/costing-raw-material.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CostingEntity } from './costing.entity';
import { ItemEntity } from '../../item/entities/item.entity';

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

  @ManyToOne(() => ItemEntity, { eager: true })
  @JoinColumn({ name: 'rawMaterialItemId' })
  rawMaterialItem: ItemEntity;

  @Column()
  rawMaterialItemId: string;

  @Column()
  rawMaterialName: string;

  @Column('decimal', { precision: 10, scale: 4 })
  percentage: number;

  @Column('decimal', { precision: 18, scale: 2 })
  unitPrice: number;

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

  @Column('decimal', { precision: 18, scale: 2 })
  amountNeeded: number;

  // Store batch calculations as JSON
  @Column('json')
  batchCalculations: {
    batch0_5kg: { cost: number; kg: number };
    batch1kg: { cost: number; kg: number };
    batch10kg: { cost: number; kg: number };
    batch25kg: { cost: number; kg: number };
    batch50kg: { cost: number; kg: number };
    batch100kg: { cost: number; kg: number };
    batch150kg: { cost: number; kg: number };
    batch200kg: { cost: number; kg: number };
<<<<<<< HEAD
=======
    batch250kg: { cost: number; kg: number };
>>>>>>> origin/new-dev
  };

  // Calculated fields
  @Column('decimal', { precision: 15, scale: 4 })
  totalCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
