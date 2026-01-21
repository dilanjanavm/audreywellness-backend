import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

@Injectable()
export class SendlkApiService {
  private readonly logger = new Logger(SendlkApiService.name);
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl: string = 'https://sms.send.lk/api/v3';
  private readonly apiToken: string;

  constructor(private configService: ConfigService) {
    this.apiToken =
      this.configService.get<string>('SENDLK_API_TOKEN') ||
      this.configService.get<string>('SMS_API_TOKEN') ||
      '';

    if (!this.apiToken) {
      this.logger.warn(
        'Send.lk API token not configured. SMS service will not work.',
      );
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        Accept: 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.logger.log(`Send.lk API Service initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      Accept: 'application/json',
    };
  }

  /**
   * Send SMS
   * POST /sms/send
   */
  async sendSms(
    recipient: string,
    sender_id: string,
    message: string,
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('recipient', recipient);
      params.append('sender_id', sender_id);
      params.append('message', message);

      const response: AxiosResponse = await this.apiClient.post(
        '/sms/send',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...this.getAuthHeaders(),
          },
        },
      );

      this.logger.log(`SMS sent successfully to ${recipient}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to send SMS',
      );
    }
  }

  /**
   * View an SMS by UID
   * GET /sms/{uid}
   */
  async viewSms(uid: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.get(`/sms/${uid}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to view SMS: ${error.message}`, error.stack);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve SMS',
      );
    }
  }

  /**
   * View all SMS messages
   * GET /sms/
   */
  async viewAllSms(): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.get('/sms/');
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve SMS messages: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve SMS messages',
      );
    }
  }

  /**
   * Create a contact group
   * POST /contacts
   */
  async createContactGroup(name: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('name', name);

      const response: AxiosResponse = await this.apiClient.post(
        '/contacts',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...this.getAuthHeaders(),
          },
        },
      );

      this.logger.log(`Contact group created: ${name}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to create contact group: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to create contact group',
      );
    }
  }

  /**
   * View a contact group
   * POST /contacts/{group_id}/show
   */
  async viewContactGroup(group_id: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.post(
        `/contacts/${group_id}/show`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to view contact group: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve contact group',
      );
    }
  }

  /**
   * Update a contact group
   * PATCH /contacts/{group_id}
   */
  async updateContactGroup(group_id: string, name: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('name', name);

      const response: AxiosResponse = await this.apiClient.patch(
        `/contacts/${group_id}`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...this.getAuthHeaders(),
          },
        },
      );

      this.logger.log(`Contact group updated: ${group_id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to update contact group: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to update contact group',
      );
    }
  }

  /**
   * Delete a contact group
   * DELETE /contacts/{group_id}
   */
  async deleteContactGroup(group_id: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.delete(
        `/contacts/${group_id}`,
      );
      this.logger.log(`Contact group deleted: ${group_id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to delete contact group: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to delete contact group',
      );
    }
  }

  /**
   * View all contact groups
   * GET /contacts/
   */
  async viewAllContactGroups(): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.get('/contacts/');
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve contact groups: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve contact groups',
      );
    }
  }

  /**
   * Create a contact
   * POST /contacts/{group_id}/store
   */
  async createContact(
    group_id: string,
    phone: number,
    first_name?: string,
    last_name?: string,
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('phone', phone.toString());
      if (first_name) params.append('first_name', first_name);
      if (last_name) params.append('last_name', last_name);

      const response: AxiosResponse = await this.apiClient.post(
        `/contacts/${group_id}/store`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...this.getAuthHeaders(),
          },
        },
      );

      this.logger.log(`Contact created in group ${group_id}: ${phone}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to create contact: ${error.message}`, error.stack);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to create contact',
      );
    }
  }

  /**
   * View a contact
   * POST /contacts/{group_id}/search/{uid}
   */
  async viewContact(group_id: string, uid: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.post(
        `/contacts/${group_id}/search/${uid}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to view contact: ${error.message}`, error.stack);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve contact',
      );
    }
  }

  /**
   * Update a contact
   * PATCH /contacts/{group_id}/update/{uid}
   */
  async updateContact(
    group_id: string,
    uid: string,
    phone: number,
    first_name?: string,
    last_name?: string,
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('phone', phone.toString());
      if (first_name) params.append('first_name', first_name);
      if (last_name) params.append('last_name', last_name);

      const response: AxiosResponse = await this.apiClient.patch(
        `/contacts/${group_id}/update/${uid}`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...this.getAuthHeaders(),
          },
        },
      );

      this.logger.log(`Contact updated: ${uid}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to update contact: ${error.message}`, error.stack);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to update contact',
      );
    }
  }

  /**
   * Delete a contact
   * DELETE /contacts/{group_id}/delete/{uid}
   */
  async deleteContact(group_id: string, uid: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.delete(
        `/contacts/${group_id}/delete/${uid}`,
      );
      this.logger.log(`Contact deleted: ${uid}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to delete contact: ${error.message}`, error.stack);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to delete contact',
      );
    }
  }

  /**
   * View all contacts in a group
   * POST /contacts/{group_id}/all
   */
  async viewAllContacts(group_id: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.post(
        `/contacts/${group_id}/all`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve contacts: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve contacts',
      );
    }
  }

  /**
   * View SMS balance
   * GET /balance
   */
  async getBalance(): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.get('/balance');
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve balance: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve balance',
      );
    }
  }

  /**
   * View profile
   * GET /me
   */
  async getProfile(): Promise<any> {
    try {
      const response: AxiosResponse = await this.apiClient.get('/me');
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve profile: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve profile',
      );
    }
  }
}
