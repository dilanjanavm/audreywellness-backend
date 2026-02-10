import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum NotificationType {
    MENTION = 'MENTION',
    ASSIGN = 'ASSIGN',
    COMMENT = 'COMMENT', // General comment notification
    SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User; // The user receiving the notification

    @Column({ name: 'user_id' })
    userId: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.SYSTEM,
    })
    type: NotificationType;

    @Column({ name: 'resource_id', nullable: true })
    resourceId?: string; // ID of the related resource (e.g., Task ID)

    @Column({ name: 'resource_type', nullable: true })
    resourceType?: string; // Type of resource (e.g., 'task')

    @Column({ type: 'text' })
    message: string;

    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'sender_id' })
    sender?: User; // The user who triggered the notification

    @Column({ name: 'sender_id', nullable: true })
    senderId?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
