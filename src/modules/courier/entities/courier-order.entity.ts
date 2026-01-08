import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CourierTrackingHistoryEntity } from './courier-tracking-history.entity';

@Entity('courier_orders')
export class CourierOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  citypakOrderId?: number; // Order ID from Citypak API

  @Column({ unique: true })
  trackingNumber: string; // Tracking number from Citypak

  @Column()
  reference: string; // Reference number for the order

  // From Address
  @Column({ name: 'from_name' })
  fromName: string;

  @Column({ name: 'from_address_line_1' })
  fromAddressLine1: string;

  @Column({ name: 'from_address_line_2', nullable: true })
  fromAddressLine2?: string;

  @Column({ name: 'from_address_line_3', nullable: true })
  fromAddressLine3?: string;

  @Column({ name: 'from_address_line_4', nullable: true })
  fromAddressLine4?: string;

  @Column({ name: 'from_contact_name', nullable: true })
  fromContactName?: string;

  @Column({ name: 'from_contact_1' })
  fromContact1: string;

  @Column({ name: 'from_contact_2', nullable: true })
  fromContact2?: string;

  // To Address
  @Column({ name: 'to_name' })
  toName: string;

  @Column({ name: 'to_address_line_1' })
  toAddressLine1: string;

  @Column({ name: 'to_address_line_2', nullable: true })
  toAddressLine2?: string;

  @Column({ name: 'to_address_line_3', nullable: true })
  toAddressLine3?: string;

  @Column({ name: 'to_address_line_4', nullable: true })
  toAddressLine4?: string;

  @Column({ name: 'to_contact_name', nullable: true })
  toContactName?: string;

  @Column({ name: 'to_contact_1' })
  toContact1: string;

  @Column({ name: 'to_contact_2', nullable: true })
  toContact2?: string;

  @Column({ name: 'to_nic', nullable: true })
  toNic?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'weight_g', type: 'int' })
  weightG: number;

  @Column({ name: 'cash_on_delivery_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  cashOnDeliveryAmount: number;

  @Column({ name: 'number_of_pieces', type: 'int', default: 1 })
  numberOfPieces: number;

  // Tracking Status
  @Column({ name: 'is_delivered', type: 'boolean', default: false })
  isDelivered: boolean;

  @Column({ name: 'receiver_name', nullable: true })
  receiverName?: string;

  @Column({ name: 'receiver_nic', nullable: true })
  receiverNic?: string;

  @Column({ name: 'pod_image_url', nullable: true, type: 'text' })
  podImageUrl?: string;

  @Column({ name: 'delivery_facility_code', nullable: true })
  deliveryFacilityCode?: string;

  // Tracking History
  @OneToMany(() => CourierTrackingHistoryEntity, (history) => history.order, { cascade: true })
  trackingHistory: CourierTrackingHistoryEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

