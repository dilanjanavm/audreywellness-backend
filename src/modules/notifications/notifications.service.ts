import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationEntity)
        private notificationRepository: Repository<NotificationEntity>,
    ) { }

    async create(data: Partial<NotificationEntity>): Promise<NotificationEntity> {
        const notification = this.notificationRepository.create(data);
        return await this.notificationRepository.save(notification);
    }

    async findAll(userId: string): Promise<NotificationEntity[]> {
        return await this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            relations: ['sender'],
            take: 20, // Limit to last 20 notifications
        });
    }

    async markAsRead(id: string): Promise<void> {
        await this.notificationRepository.update(id, { isRead: true });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return await this.notificationRepository.count({
            where: { userId, isRead: false },
        });
    }
}
