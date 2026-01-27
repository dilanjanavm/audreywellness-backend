// src/modules/email/email.controller.ts
import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Get email service status
   */
  @Get('status')
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

