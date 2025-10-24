// src/modules/costing/entities/costing.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { ItemEntity } from '../../item/entities/item.entity';
import { User } from '../../users/user.entity';
import { Status } from '../../../common/enums/status';
import { CostingRawMaterial } from './costing-raw-material.entity';
import { CostingAdditionalCost } from './costing-additional-cost.entity';
import { CostingTotalCost } from './costing-total-cost.entity';

@Entity('costings')
export class CostingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 1 })
  version: number; // For version control (1, 2, 3, ...)

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Only one active version per item

  // Link to main product item
  @ManyToOne(() => ItemEntity, { eager: true })
  @JoinColumn({ name: 'itemId' })
  item: ItemEntity;

  @Column()
  itemId: string;

  @Column()
  itemName: string;

  @Column()
  itemCode: string;

  // Raw materials with percentages and costs
  @OneToMany(() => CostingRawMaterial, (rawMaterial) => rawMaterial.costing, {
    cascade: true,
    eager: true,
  })
  rawMaterials: CostingRawMaterial[];

  // Additional costs (electricity, labor, packaging, etc.)
  @OneToMany(
    () => CostingAdditionalCost,
    (additionalCost) => additionalCost.costing,
    {
      cascade: true,
      eager: true,
    },
  )
  additionalCosts: CostingAdditionalCost[];

  // Total costs per batch size
  @OneToMany(() => CostingTotalCost, (totalCost) => totalCost.costing, {
    cascade: true,
    eager: true,
  })
  totalCosts: CostingTotalCost[];

  // Audit fields - linked to your existing User entity (USBSTS table)
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User;

  @Column({ nullable: true })
  updatedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  entityVersion: number;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;

  // Calculation metadata
  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  totalRawMaterialCost: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  totalAdditionalCost: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  totalPercentage: number; // Should be 100%
}
