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
  constructor(private readonly sendlkApiService: SendlkApiService) {}

  /**
   * Send SMS
   * POST /sms/send
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendSms(@Body() dto: SendSmsDto): Promise<SendSmsResponse> {
    return this.sendlkApiService.sendSms(
      dto.recipient,
      dto.sender_id,
      dto.message,
    );
  }

  /**
   * View an SMS by UID
   * GET /sms/messages/:uid
   */
  @Get('messages/:uid')
  async viewSms(@Param('uid') uid: string): Promise<SmsMessageResponse> {
    return this.sendlkApiService.viewSms(uid);
  }

  /**
   * View all SMS messages
   * GET /sms/messages
   */
  @Get('messages')
  async viewAllSms(): Promise<SmsMessageResponse> {
    return this.sendlkApiService.viewAllSms();
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
    return this.sendlkApiService.createContactGroup(dto.name);
  }

  /**
   * Contact Groups - View a group
   * GET /sms/contact-groups/:group_id
   */
  @Get('contact-groups/:group_id')
  async viewContactGroup(
    @Param('group_id') group_id: string,
  ): Promise<ContactGroupResponse> {
    return this.sendlkApiService.viewContactGroup(group_id);
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
    return this.sendlkApiService.updateContactGroup(group_id, dto.name);
  }

  /**
   * Contact Groups - Delete a group
   * DELETE /sms/contact-groups/:group_id
   */
  @Delete('contact-groups/:group_id')
  async deleteContactGroup(
    @Param('group_id') group_id: string,
  ): Promise<ContactGroupResponse> {
    return this.sendlkApiService.deleteContactGroup(group_id);
  }

  /**
   * Contact Groups - View all groups
   * GET /sms/contact-groups
   */
  @Get('contact-groups')
  async viewAllContactGroups(): Promise<ContactGroupResponse> {
    return this.sendlkApiService.viewAllContactGroups();
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
    return this.sendlkApiService.createContact(
      group_id,
      dto.phone,
      dto.first_name,
      dto.last_name,
    );
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
    return this.sendlkApiService.viewContact(group_id, uid);
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
    return this.sendlkApiService.updateContact(
      group_id,
      uid,
      dto.phone,
      dto.first_name,
      dto.last_name,
    );
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
    return this.sendlkApiService.deleteContact(group_id, uid);
  }

  /**
   * Contacts - View all contacts in a group
   * GET /sms/contact-groups/:group_id/contacts
   */
  @Get('contact-groups/:group_id/contacts')
  async viewAllContacts(
    @Param('group_id') group_id: string,
  ): Promise<ContactResponse> {
    return this.sendlkApiService.viewAllContacts(group_id);
  }

  /**
   * Profile - View SMS balance
   * GET /sms/balance
   */
  @Get('balance')
  async getBalance(): Promise<BalanceResponse> {
    return this.sendlkApiService.getBalance();
  }

  /**
   * Profile - View profile
   * GET /sms/profile
   */
  @Get('profile')
  async getProfile(): Promise<ProfileResponse> {
    return this.sendlkApiService.getProfile();
  }
}
