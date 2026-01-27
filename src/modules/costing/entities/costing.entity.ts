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
import { Status } from '../../../common/enums/common.enum';
import { CostingRawMaterial } from './costing-raw-material.entity';
import { CostingAdditionalCost } from './costing-additional-cost.entity';
import { CostingTotalCost } from './costing-total-cost.entity';

@Entity('costings')
export class CostingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => ItemEntity, { eager: true })
  @JoinColumn({ name: 'itemId' })
  item: ItemEntity;

  @Column()
  itemId: string;

  @Column()
  itemName: string;

  @Column()
  itemCode: string;

  @OneToMany(() => CostingRawMaterial, (rawMaterial) => rawMaterial.costing, {
    cascade: true,
    eager: true,
  })
  rawMaterials: CostingRawMaterial[];

  @OneToMany(
    () => CostingAdditionalCost,
    (additionalCost) => additionalCost.costing,
    {
      cascade: true,
      eager: true,
    },
  )
  additionalCosts: CostingAdditionalCost[];

  @OneToMany(() => CostingTotalCost, (totalCost) => totalCost.costing, {
    cascade: true,
    eager: true,
  })
  totalCosts: CostingTotalCost[];

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

  @Column('decimal', { precision: 18, scale: 4, default: 0 })
  totalRawMaterialCost: number;

  @Column('decimal', { precision: 18, scale: 4, default: 0 })
  totalAdditionalCost: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  totalPercentage: number;
}
