// src/modules/email/email.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  /**
   * Initialize email transporter with Google OAuth2 or App Password
   */
  private async initializeTransporter(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('⚙️  EMAIL SERVICE: Initializing transporter...');
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const emailUser = this.configService.get<string>('EMAIL_USER');
      const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
      const emailHost = this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com';
      const emailPort = parseInt(this.configService.get<string>('EMAIL_PORT') || '587');
      const useOAuth2 = this.configService.get<string>('EMAIL_USE_OAUTH2') === 'true';

      this.logger.log('📋 Configuration Check:');
      this.logger.log(`   EMAIL_USER: ${emailUser ? '✅ Set' : '❌ NOT SET'}`);
      this.logger.log(`   EMAIL_HOST: ${emailHost}`);
      this.logger.log(`   EMAIL_PORT: ${emailPort}`);
      this.logger.log(`   EMAIL_USE_OAUTH2: ${useOAuth2}`);

      if (!emailUser) {
        this.logger.error('❌ EMAIL_USER not configured. Email service will not work.');
        this.logger.error('   Please set EMAIL_USER in your .env file');
        return;
      }

      // Use OAuth2 if configured
      if (useOAuth2) {
        this.logger.log('🔐 Using OAuth2 authentication method...');
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');

        this.logger.log(`   GOOGLE_CLIENT_ID: ${clientId ? '✅ Set' : '❌ NOT SET'}`);
        this.logger.log(`   GOOGLE_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ NOT SET'}`);
        this.logger.log(`   GOOGLE_REFRESH_TOKEN: ${refreshToken ? '✅ Set' : '❌ NOT SET'}`);

        if (clientId && clientSecret && refreshToken) {
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: emailUser,
              clientId,
              clientSecret,
              refreshToken,
              accessToken: undefined, // Will be generated automatically from refresh token
              expires: 0, // Will be set automatically
            },
          });
          this.logger.log('✅ Email service initialized with Google OAuth2');
        } else {
          this.logger.warn('⚠️  OAuth2 credentials incomplete. Falling back to app password method.');
          this.initializeWithAppPassword(emailUser, emailPassword, emailHost, emailPort);
        }
      } else {
        // Use App Password method (default)
        this.logger.log('🔑 Using App Password authentication method...');
        this.logger.log(`   EMAIL_PASSWORD: ${emailPassword ? '✅ Set' : '❌ NOT SET'}`);
        this.initializeWithAppPassword(emailUser, emailPassword, emailHost, emailPort);
      }

      // Verify connection
      if (this.transporter) {
        this.logger.log('🔍 Verifying email connection...');
        const isConnected = await this.verifyConnection();
        if (isConnected) {
          this.isInitialized = true;
          this.logger.log('✅ Email service initialization completed successfully');
        } else {
          this.logger.warn('⚠️  Email service initialized but connection verification failed');
          this.logger.warn('   Emails may still work, but connection test failed');
          this.isInitialized = true; // Still mark as initialized to allow sending
        }
      } else {
        this.logger.error('❌ Failed to create email transporter');
        this.isInitialized = false;
      }
      
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error: any) {
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error(`❌ Failed to initialize email transporter: ${error.message}`);
      this.logger.error(`   Stack: ${error.stack}`);
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.isInitialized = false;
    }
  }

  /**
   * Initialize transporter with App Password method
   */
  private initializeWithAppPassword(
    emailUser: string,
    emailPassword: string | undefined,
    emailHost: string,
    emailPort: number,
  ): void {
    if (!emailPassword) {
      this.logger.error('❌ EMAIL_PASSWORD not configured. Email service will not work.');
      this.logger.error('   Please set EMAIL_PASSWORD in your .env file');
      this.logger.error('   For Gmail, generate an App Password from: https://myaccount.google.com/apppasswords');
      return;
    }

    this.logger.log(`   Creating transporter for ${emailHost}:${emailPort}`);
    this.logger.log(`   Secure connection: ${emailPort === 465}`);
    
    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      // Additional Gmail-specific options
      ...(emailHost.includes('gmail.com') && {
        service: 'gmail',
        tls: {
          rejectUnauthorized: false,
        },
      }),
    });
    this.logger.log(`✅ Email service initialized with App Password method (${emailHost}:${emailPort})`);
  }

  /**
   * Send welcome email with temporary password
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    tempPassword: string,
  ): Promise<boolean> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('📧 EMAIL SERVICE: Starting email sending process');
    this.logger.log(`   Recipient: ${to}`);
    this.logger.log(`   Username: ${userName}`);
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // STEP 1: Check transporter initialization
      this.logger.log('📧 STEP 1: Checking email transporter initialization...');
      this.logger.log(`   isInitialized: ${this.isInitialized}`);
      this.logger.log(`   transporter exists: ${!!this.transporter}`);
      
      if (!this.isInitialized || !this.transporter) {
        this.logger.warn('⚠️  STEP 1 WARNING: Email transporter not initialized');
        this.logger.log('   Attempting to reinitialize transporter...');
        await this.initializeTransporter();
        
        if (!this.transporter) {
          this.logger.error('❌ STEP 1 FAILED: Email transporter could not be initialized');
          this.logger.error('   Please check your email configuration in .env file');
          throw new Error('Email transporter could not be initialized');
        }
        this.logger.log('✅ STEP 1 COMPLETED: Transporter reinitialized successfully');
      } else {
        this.logger.log('✅ STEP 1 PASSED: Transporter is initialized');
      }

      // STEP 2: Get email configuration
      this.logger.log('📧 STEP 2: Retrieving email configuration...');
      const emailUser = this.configService.get<string>('EMAIL_USER');
      const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Audrey Wellness';
      const replyTo = this.configService.get<string>('EMAIL_REPLY_TO');
      const useOAuth2 = this.configService.get<string>('EMAIL_USE_OAUTH2') === 'true';
      
      this.logger.log(`   EMAIL_USER: ${emailUser ? '✅ Set' : '❌ NOT SET'}`);
      this.logger.log(`   EMAIL_FROM_NAME: ${fromName}`);
      this.logger.log(`   EMAIL_REPLY_TO: ${replyTo || 'Not set'}`);
      this.logger.log(`   EMAIL_USE_OAUTH2: ${useOAuth2}`);
      
      if (!emailUser) {
        this.logger.error('❌ STEP 2 FAILED: EMAIL_USER is not configured');
        throw new Error('EMAIL_USER environment variable is not set');
      }
      this.logger.log('✅ STEP 2 COMPLETED: Email configuration retrieved');

      // STEP 3: Prepare email content
      this.logger.log('📧 STEP 3: Preparing email content...');
      this.logger.log(`   From: "${fromName}" <${emailUser}>`);
      this.logger.log(`   To: ${to}`);
      this.logger.log(`   Subject: Welcome to Audrey Wellness - Your Account Credentials`);
      
      const mailOptions = {
        from: `"${fromName}" <${emailUser}>`,
        to,
        subject: 'Welcome to Audrey Wellness - Your Account Credentials',
        html: this.getWelcomeEmailTemplate(userName, to, tempPassword),
        // Add reply-to if configured
        ...(replyTo && {
          replyTo: replyTo,
        }),
      };
      
      if (replyTo) {
        this.logger.log(`   Reply-To: ${replyTo}`);
      }
      this.logger.log('✅ STEP 3 COMPLETED: Email content prepared');

      // STEP 4: Send email
      this.logger.log('📧 STEP 4: Sending email via SMTP...');
      this.logger.log('   Connecting to email server...');
      
      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log('✅ STEP 4 COMPLETED: Email sent successfully');
      this.logger.log(`   Message ID: ${info.messageId}`);
      this.logger.log(`   Response: ${info.response || 'Success'}`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`✅ EMAIL SENT SUCCESSFULLY TO: ${to}`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return true;
    } catch (error: any) {
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error('❌ EMAIL SENDING FAILED');
      this.logger.error(`   Recipient: ${to}`);
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(`   Error Code: ${error.code || 'N/A'}`);
      this.logger.error(`   Stack: ${error.stack}`);
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        this.logger.error('🔐 AUTHENTICATION ERROR:');
        this.logger.error('   - Check your EMAIL_USER and EMAIL_PASSWORD in .env');
        this.logger.error('   - For OAuth2: Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN');
        this.logger.error('   - For App Password: Ensure 2-Step Verification is enabled and app password is correct');
      } else if (error.code === 'ECONNECTION') {
        this.logger.error('🌐 CONNECTION ERROR:');
        this.logger.error('   - Check your network connection');
        this.logger.error('   - Verify EMAIL_HOST and EMAIL_PORT in .env');
        this.logger.error('   - Check firewall settings');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('⏱️  TIMEOUT ERROR:');
        this.logger.error('   - Email server is not responding');
        this.logger.error('   - Check network connectivity');
      } else if (error.message?.includes('transporter could not be initialized')) {
        this.logger.error('⚙️  INITIALIZATION ERROR:');
        this.logger.error('   - Email service is not properly configured');
        this.logger.error('   - Check all required environment variables are set');
      }

      // In development, log the email details instead of failing
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.warn('🔧 DEV MODE: Email details (for testing)');
        this.logger.warn(`   Would send to: ${to}`);
        this.logger.warn(`   Username: ${userName}`);
        this.logger.warn(`   Temporary Password: ${tempPassword}`);
        this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
   * Send welcome email to customer
   */
  async sendCustomerWelcomeEmail(
    to: string,
    customerName: string,
    customerNumber: string,
    phone?: string,
  ): Promise<boolean> {
    try {
      // Ensure transporter is initialized
      if (!this.isInitialized || !this.transporter) {
        this.logger.warn('Email transporter not initialized. Attempting to reinitialize...');
        await this.initializeTransporter();
        if (!this.transporter) {
          throw new Error('Email transporter could not be initialized');
        }
      }

      const emailUser = this.configService.get<string>('EMAIL_USER');
      const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Audrey Wellness';

      const mailOptions = {
        from: `"${fromName}" <${emailUser}>`,
        to,
        subject: 'Welcome to Audrey Wellness - Your Customer Account',
        html: this.getCustomerWelcomeEmailTemplate(customerName, customerNumber, phone),
        // Add reply-to if configured
        ...(this.configService.get<string>('EMAIL_REPLY_TO') && {
          replyTo: this.configService.get<string>('EMAIL_REPLY_TO'),
        }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Customer welcome email sent successfully to ${to}`);
      this.logger.debug(`Email message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send customer welcome email to ${to}: ${error.message}`, error.stack);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        this.logger.error('Authentication failed. Please check your email credentials.');
      } else if (error.code === 'ECONNECTION') {
        this.logger.error('Connection failed. Please check your network and SMTP settings.');
      }

      // In development, log the email details instead of failing
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[DEV MODE] Customer welcome email would be sent to ${to}`);
        this.logger.warn(`[DEV MODE] Customer: ${customerName}, Customer Number: ${customerNumber}`);
      }
      return false;
    }
  }

  /**
   * Generate customer welcome email template
   */
  private getCustomerWelcomeEmailTemplate(
    customerName: string,
    customerNumber: string,
    phone?: string,
  ): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    
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
            <p>Dear ${customerName},</p>
            
            <p>Thank you for becoming a valued customer of Audrey Wellness! We are delighted to have you with us.</p>
            
            <p>Your customer account has been successfully created. Here are your account details:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${customerName}</p>
              <p style="margin: 5px 0;"><strong>Customer Number:</strong> <code style="background-color: #e9ecef; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${customerNumber}</code></p>
              ${phone ? `<p style="margin: 5px 0;"><strong>Contact Phone:</strong> ${phone}</p>` : ''}
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your customer account is now active and ready to use</li>
              <li>You can place orders and access our services</li>
              <li>Our team will be in touch to assist you with your needs</li>
              <li>If you have any questions, please don't hesitate to contact us</li>
            </ul>
            
            <p style="margin-top: 30px;">
              <a href="${frontendUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visit Our Website
              </a>
            </p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #6c757d;">
              If you have any questions or need assistance, please contact our support team. We're here to help!
            </p>
            
            <p style="margin-top: 20px; font-size: 12px; color: #6c757d;">
              <strong>Best regards,</strong><br>
              The Audrey Wellness Team
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
      if (!this.transporter) {
        this.logger.error('Email transporter not initialized');
        return false;
      }
      await this.transporter.verify();
      this.logger.log('✅ Email service connection verified');
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Email service connection failed: ${error.message}`);
      if (error.code === 'EAUTH') {
        this.logger.error('Authentication failed. Please verify your email credentials.');
      }
      return false;
    }
  }

  /**
   * Send a test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const emailUser = this.configService.get<string>('EMAIL_USER');
      const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Audrey Wellness';

      const mailOptions = {
        from: `"${fromName}" <${emailUser}>`,
        to,
        subject: 'Test Email from Audrey Wellness',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email from Audrey Wellness email service.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Test email sent successfully to ${to}`);
      this.logger.debug(`Email message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send test email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get email service status
   */
  getStatus(): { initialized: boolean; configured: boolean } {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
    const useOAuth2 = this.configService.get<string>('EMAIL_USE_OAUTH2') === 'true';
    
    let configured = false;
    if (useOAuth2) {
      const hasOAuth2 =
        this.configService.get<string>('GOOGLE_CLIENT_ID') &&
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') &&
        this.configService.get<string>('GOOGLE_REFRESH_TOKEN');
      configured = !!emailUser && !!hasOAuth2;
    } else {
      configured = !!emailUser && !!emailPassword;
    }

    return {
      initialized: this.isInitialized,
      configured,
    };
  }
}

