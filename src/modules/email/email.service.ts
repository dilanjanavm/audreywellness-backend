// src/modules/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Initialize email transporter
    // For production, configure with your SMTP settings
    // For development, you can use Gmail or other services
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('EMAIL_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  /**
   * Send welcome email with temporary password
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    tempPassword: string,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Audrey Wellness" <${this.configService.get<string>('EMAIL_USER')}>`,
        to,
        subject: 'Welcome to Audrey Wellness - Your Account Credentials',
        html: this.getWelcomeEmailTemplate(userName, to, tempPassword),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to ${to}`);
      this.logger.debug(`Email message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}: ${error.message}`, error.stack);
      // In development, log the email details instead of failing
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[DEV MODE] Email would be sent to ${to}`);
        this.logger.warn(`[DEV MODE] Username: ${to}, Temp Password: ${tempPassword}`);
      }
      return false;
    }
  }

  /**
   * Generate email template
   */
  private getWelcomeEmailTemplate(
    userName: string,
    email: string,
    tempPassword: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Audrey Wellness</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2c3e50; text-align: center;">Welcome to Audrey Wellness!</h1>
          
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p>Hello ${userName},</p>
            
            <p>Your account has been successfully created. Please use the following credentials to log in:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Username (Email):</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${tempPassword}</code></p>
            </div>
            
            <p><strong>Important Security Notice:</strong></p>
            <ul>
              <li>You will be required to change your password on first login</li>
              <li>Please keep your credentials secure and do not share them with anyone</li>
              <li>If you did not request this account, please contact support immediately</li>
            </ul>
            
            <p style="margin-top: 30px;">
              <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/login" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login to Your Account
              </a>
            </p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #6c757d;">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 12px; color: #6c757d;">
              © ${new Date().getFullYear()} Audrey Wellness. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error(`Email service connection failed: ${error.message}`);
      return false;
    }
  }
}

