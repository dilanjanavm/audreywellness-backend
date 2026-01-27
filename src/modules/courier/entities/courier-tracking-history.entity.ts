import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { CourierOrderEntity } from './courier-order.entity';

@Entity('courier_tracking_history')
export class CourierTrackingHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourierOrderEntity, (order) => order.trackingHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courier_order_id' })
  order: CourierOrderEntity;

  @Column({ name: 'courier_order_id' })
  courierOrderId: string;

  @Column({ name: 'tracking_number' })
  trackingNumber: string;

  @Column({ name: 'status_type' })
  statusType: string; // e.g., "FIRST MILE RECEIVE SCAN", "OUT FOR DELIVERY", "DELIVERED"

  @Column({ name: 'status_code', nullable: true })
  statusCode?: string; // e.g., "UD", "DL", "RT", "RTM"

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'date', nullable: true })
  date?: Date;

  @Column({ type: 'time', nullable: true })
  time?: string;

  @Column({ name: 'action_datetime', type: 'datetime', nullable: true })
  actionDatetime?: Date;

  @Column({ nullable: true })
  reason?: string; // For "NOT DELIVERED" status

  @Column({ name: 'delivered_datetime', type: 'datetime', nullable: true })
  deliveredDatetime?: Date;

  @CreateDateColumn()
  createdAt: Date;
}

