// src/modules/email/email.controller.ts
import { Controller, Get, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { EmailService } from './email.service';

@Controller('email')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) { }

  /**
   * Get email service status
   */
  @Get('status')
  @Permissions('EMAIL_VIEW')
  async getStatus() {
    const status = this.emailService.getStatus();
    return {
      message: 'Email service status',
      data: status,
    };
  }

  /**
   * Verify email connection
   */
  @Get('verify')
  @Permissions('EMAIL_VIEW')
  async verifyConnection() {
    this.logger.log('Verifying email connection...');
    const isConnected = await this.emailService.verifyConnection();
    return {
      message: isConnected
        ? 'Email service connection verified'
        : 'Email service connection failed',
      data: {
        connected: isConnected,
      },
    };
  }

  /**
   * Send a test email
   */
  @Post('test')
  @Permissions('EMAIL_SEND')
  async sendTestEmail(@Body() body: { to: string }) {
    this.logger.log(`Sending test email to ${body.to}`);
    const sent = await this.emailService.sendTestEmail(body.to);
    return {
      message: sent
        ? 'Test email sent successfully'
        : 'Failed to send test email',
      data: {
        sent,
        recipient: body.to,
      },
    };
  }
}

