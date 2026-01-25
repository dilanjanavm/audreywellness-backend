import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SendlkApiService } from './services/sendlk-api.service';
import { SendSmsDto } from './dto/send-sms.dto';
import {
  CreateContactGroupDto,
  UpdateContactGroupDto,
} from './dto/contact-group.dto';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import {
  SendSmsResponse,
  ContactGroupResponse,
  ContactResponse,
  ProfileResponse,
  BalanceResponse,
  SmsMessageResponse,
} from './dto/sms-response.dto';

@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(private readonly sendlkApiService: SendlkApiService) {}

  /**
   * Send SMS
   * POST /sms/send
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendSms(@Body() dto: any): Promise<SendSmsResponse> {
    this.logger.log(`POST /sms/send - Request received`);
    this.logger.debug(
      `POST /sms/send - Raw request body: ${JSON.stringify(dto)}`,
    );
    this.logger.debug(
      `POST /sms/send - DTO type: ${typeof dto}, Keys: ${dto ? Object.keys(dto).join(', ') : 'null'}`,
    );

    // Normalize field names (handle both camelCase and snake_case)
    const recipient = dto?.recipient || dto?.phone || dto?.phoneNumber || dto?.to;
    const sender_id = dto?.sender_id || dto?.senderId || dto?.sender || dto?.from;
    const message = dto?.message || dto?.text || dto?.content || dto?.msg;

    this.logger.debug(
      `POST /sms/send - Normalized values - Recipient: ${recipient || 'undefined'}, Sender ID: ${sender_id || 'undefined'}, Message length: ${message?.length || 0} characters`,
    );

    // Validate required fields
    if (!recipient || (typeof recipient === 'string' && recipient.trim() === '')) {
      this.logger.error(
        `POST /sms/send - Validation failed: recipient is missing or empty. Received fields: ${JSON.stringify(Object.keys(dto || {}))}`,
      );
      throw new BadRequestException(
        'recipient (or phone/phoneNumber/to) is required and cannot be empty',
      );
    }
    if (!sender_id || (typeof sender_id === 'string' && sender_id.trim() === '')) {
      this.logger.error(
        `POST /sms/send - Validation failed: sender_id is missing or empty. Received fields: ${JSON.stringify(Object.keys(dto || {}))}`,
      );
      throw new BadRequestException(
        'sender_id (or senderId/sender/from) is required and cannot be empty',
      );
    }
    if (!message || (typeof message === 'string' && message.trim() === '')) {
      this.logger.error(
        `POST /sms/send - Validation failed: message is missing or empty. Received fields: ${JSON.stringify(Object.keys(dto || {}))}`,
      );
      throw new BadRequestException(
        'message (or text/content/msg) is required and cannot be empty',
      );
    }

    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.sendSms(
        String(recipient).trim(),
        String(sender_id).trim(),
        String(message).trim(),
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `POST /sms/send - Success: SMS sent to ${recipient} in ${duration}ms`,
      );
      this.logger.debug(
        `POST /sms/send - Response: ${JSON.stringify(result)}`,
      );

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `POST /sms/send - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `POST /sms/send - Request details: recipient=${recipient || 'undefined'}, sender_id=${sender_id || 'undefined'}, original DTO: ${JSON.stringify(dto)}`,
      );
      throw error;
    }
  }

  /**
   * View an SMS by UID
   * GET /sms/messages/:uid
   */
  @Get('messages/:uid')
  async viewSms(@Param('uid') uid: string): Promise<SmsMessageResponse> {
    this.logger.log(`GET /sms/messages/${uid} - Request received`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.viewSms(uid);
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/messages/${uid} - Success: SMS retrieved in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/messages/${uid} - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * View all SMS messages
   * GET /sms/messages
   */
  @Get('messages')
  async viewAllSms(): Promise<SmsMessageResponse> {
    this.logger.log(`GET /sms/messages - Request received`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.viewAllSms();
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/messages - Success: Retrieved all SMS messages in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/messages - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contact Groups - Create a group
   * POST /sms/contact-groups
   */
  @Post('contact-groups')
  @HttpCode(HttpStatus.OK)
  async createContactGroup(
    @Body() dto: CreateContactGroupDto,
  ): Promise<ContactGroupResponse> {
    this.logger.log(`POST /sms/contact-groups - Request received`);
    this.logger.debug(`POST /sms/contact-groups - Group name: ${dto.name}`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.createContactGroup(dto.name);
      const duration = Date.now() - startTime;
      this.logger.log(
        `POST /sms/contact-groups - Success: Contact group "${dto.name}" created in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `POST /sms/contact-groups - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contact Groups - View a group
   * GET /sms/contact-groups/:group_id
   */
  @Get('contact-groups/:group_id')
  async viewContactGroup(
    @Param('group_id') group_id: string,
  ): Promise<ContactGroupResponse> {
    this.logger.log(`GET /sms/contact-groups/${group_id} - Request received`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.viewContactGroup(group_id);
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/contact-groups/${group_id} - Success: Contact group retrieved in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/contact-groups/${group_id} - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contact Groups - Update a group
   * PATCH /sms/contact-groups/:group_id
   */
  @Patch('contact-groups/:group_id')
  async updateContactGroup(
    @Param('group_id') group_id: string,
    @Body() dto: UpdateContactGroupDto,
  ): Promise<ContactGroupResponse> {
    this.logger.log(`PATCH /sms/contact-groups/${group_id} - Request received`);
    this.logger.debug(`PATCH /sms/contact-groups/${group_id} - New name: ${dto.name}`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.updateContactGroup(group_id, dto.name);
      const duration = Date.now() - startTime;
      this.logger.log(
        `PATCH /sms/contact-groups/${group_id} - Success: Contact group updated in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `PATCH /sms/contact-groups/${group_id} - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contact Groups - Delete a group
   * DELETE /sms/contact-groups/:group_id
   */
  @Delete('contact-groups/:group_id')
  async deleteContactGroup(
    @Param('group_id') group_id: string,
  ): Promise<ContactGroupResponse> {
    this.logger.log(`DELETE /sms/contact-groups/${group_id} - Request received`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.deleteContactGroup(group_id);
      const duration = Date.now() - startTime;
      this.logger.log(
        `DELETE /sms/contact-groups/${group_id} - Success: Contact group deleted in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `DELETE /sms/contact-groups/${group_id} - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contact Groups - View all groups
   * GET /sms/contact-groups
   */
  @Get('contact-groups')
  async viewAllContactGroups(): Promise<ContactGroupResponse> {
    this.logger.log(`GET /sms/contact-groups - Request received`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.viewAllContactGroups();
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/contact-groups - Success: Retrieved all contact groups in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/contact-groups - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contacts - Create a contact
   * POST /sms/contact-groups/:group_id/contacts
   */
  @Post('contact-groups/:group_id/contacts')
  @HttpCode(HttpStatus.OK)
  async createContact(
    @Param('group_id') group_id: string,
    @Body() dto: CreateContactDto,
  ): Promise<ContactResponse> {
    this.logger.log(
      `POST /sms/contact-groups/${group_id}/contacts - Request received`,
    );
    this.logger.debug(
      `POST /sms/contact-groups/${group_id}/contacts - Phone: ${dto.phone}, Name: ${dto.first_name} ${dto.last_name || ''}`,
    );
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.createContact(
        group_id,
        dto.phone,
        dto.first_name,
        dto.last_name,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `POST /sms/contact-groups/${group_id}/contacts - Success: Contact created in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `POST /sms/contact-groups/${group_id}/contacts - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contacts - View a contact
   * GET /sms/contact-groups/:group_id/contacts/:uid
   */
  @Get('contact-groups/:group_id/contacts/:uid')
  async viewContact(
    @Param('group_id') group_id: string,
    @Param('uid') uid: string,
  ): Promise<ContactResponse> {
    this.logger.log(
      `GET /sms/contact-groups/${group_id}/contacts/${uid} - Request received`,
    );
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.viewContact(group_id, uid);
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/contact-groups/${group_id}/contacts/${uid} - Success: Contact retrieved in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/contact-groups/${group_id}/contacts/${uid} - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contacts - Update a contact
   * PATCH /sms/contact-groups/:group_id/contacts/:uid
   */
  @Patch('contact-groups/:group_id/contacts/:uid')
  async updateContact(
    @Param('group_id') group_id: string,
    @Param('uid') uid: string,
    @Body() dto: UpdateContactDto,
  ): Promise<ContactResponse> {
    this.logger.log(
      `PATCH /sms/contact-groups/${group_id}/contacts/${uid} - Request received`,
    );
    this.logger.debug(
      `PATCH /sms/contact-groups/${group_id}/contacts/${uid} - Phone: ${dto.phone}, Name: ${dto.first_name} ${dto.last_name || ''}`,
    );
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.updateContact(
        group_id,
        uid,
        dto.phone,
        dto.first_name,
        dto.last_name,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `PATCH /sms/contact-groups/${group_id}/contacts/${uid} - Success: Contact updated in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `PATCH /sms/contact-groups/${group_id}/contacts/${uid} - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contacts - Delete a contact
   * DELETE /sms/contact-groups/:group_id/contacts/:uid
   */
  @Delete('contact-groups/:group_id/contacts/:uid')
  async deleteContact(
    @Param('group_id') group_id: string,
    @Param('uid') uid: string,
  ): Promise<ContactResponse> {
    this.logger.log(
      `DELETE /sms/contact-groups/${group_id}/contacts/${uid} - Request received`,
    );
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.deleteContact(group_id, uid);
      const duration = Date.now() - startTime;
      this.logger.log(
        `DELETE /sms/contact-groups/${group_id}/contacts/${uid} - Success: Contact deleted in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `DELETE /sms/contact-groups/${group_id}/contacts/${uid} - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Contacts - View all contacts in a group
   * GET /sms/contact-groups/:group_id/contacts
   */
  @Get('contact-groups/:group_id/contacts')
  async viewAllContacts(
    @Param('group_id') group_id: string,
  ): Promise<ContactResponse> {
    this.logger.log(
      `GET /sms/contact-groups/${group_id}/contacts - Request received`,
    );
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.viewAllContacts(group_id);
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/contact-groups/${group_id}/contacts - Success: Retrieved all contacts in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/contact-groups/${group_id}/contacts - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Profile - View SMS balance
   * GET /sms/balance
   */
  @Get('balance')
  async getBalance(): Promise<BalanceResponse> {
    this.logger.log(`GET /sms/balance - Request received`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.getBalance();
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/balance - Success: Balance retrieved in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/balance - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Profile - View profile
   * GET /sms/profile
   */
  @Get('profile')
  async getProfile(): Promise<ProfileResponse> {
    this.logger.log(`GET /sms/profile - Request received`);
    const startTime = Date.now();
    try {
      const result = await this.sendlkApiService.getProfile();
      const duration = Date.now() - startTime;
      this.logger.log(
        `GET /sms/profile - Success: Profile retrieved in ${duration}ms`,
      );
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `GET /sms/profile - Failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
