// src/modules/category/entities/category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ItemEntity } from '../../item/entities/item.entity';
import { Status } from 'src/common/enums/status';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  categoryId: string;

  @Column()
  categoryName: string;

  @Column({ type: 'text', nullable: true })
  categoryDesc: string;

  @Column({ nullable: true })
  categoryColor: string;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;

  @OneToMany(() => ItemEntity, (item) => item.category)
  items: ItemEntity[];
}
