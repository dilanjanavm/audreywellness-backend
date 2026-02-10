import { Controller, Get, Post, Param, UseGuards, Request, Put, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(@Request() req) {
        const userId = req.user.userId || req.user.id;
        return await this.notificationsService.findAll(userId);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        const userId = req.user.userId || req.user.id;
        const count = await this.notificationsService.getUnreadCount(userId);
        return { count };
    }

    @Put(':id/read')
    async markAsRead(@Param('id') id: string) {
        return await this.notificationsService.markAsRead(id);
    }

    @Put('read-all')
    async markAllAsRead(@Request() req) {
        const userId = req.user.userId || req.user.id;
        return await this.notificationsService.markAllAsRead(userId);
    }
}
