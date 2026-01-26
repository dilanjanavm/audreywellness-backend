import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

@Injectable()
export class SendlkApiService {
  private readonly logger = new Logger(SendlkApiService.name);
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl: string = 'https://sms.send.lk/api/v3';
  private readonly apiToken: string;
  private readonly defaultSenderId: string;

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

    // Get default sender ID from environment or use a default
    this.defaultSenderId =
      this.configService.get<string>('SMS_SENDER_ID') ||
      this.configService.get<string>('SENDLK_SENDER_ID') ||
      'AUDREY'; // Default fallback

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        Accept: 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.logger.log(`Send.lk API Service initialized with base URL: ${this.baseUrl}`);
    this.logger.log(`Default Sender ID: ${this.defaultSenderId}`);
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
    message: string,
    sender_id?: string,
  ): Promise<any> {
    // Use default sender ID if not provided
    const finalSenderId = sender_id || this.defaultSenderId;
    const startTime = Date.now();
    
    // Log received parameters
    this.logger.log(
      `sendSms - Starting SMS send request`,
    );
    this.logger.debug(
      `sendSms - Received parameters - recipient: ${recipient || 'undefined'} (type: ${typeof recipient}), sender_id: ${sender_id || 'undefined'} (will use: ${finalSenderId}), message: ${message ? `${message.length} chars` : 'undefined'} (type: ${typeof message})`,
    );

    try {
      // Validate inputs with detailed logging
      if (!recipient) {
        this.logger.error('sendSms - Validation failed: recipient is null/undefined');
        throw new BadRequestException('Recipient is required');
      }
      if (typeof recipient !== 'string') {
        this.logger.error(`sendSms - Validation failed: recipient is not a string (type: ${typeof recipient})`);
        throw new BadRequestException('Recipient must be a string');
      }
      if (recipient.trim() === '') {
        this.logger.error('sendSms - Validation failed: recipient is empty string');
        throw new BadRequestException('Recipient cannot be empty');
      }

      // Validate sender_id (use default if not provided)
      if (sender_id && typeof sender_id !== 'string') {
        this.logger.error(`sendSms - Validation failed: sender_id is not a string (type: ${typeof sender_id})`);
        throw new BadRequestException('Sender ID must be a string');
      }
      if (sender_id && sender_id.trim() === '') {
        this.logger.error('sendSms - Validation failed: sender_id is empty string');
        throw new BadRequestException('Sender ID cannot be empty');
      }

      if (!sender_id) {
        this.logger.log(`sendSms - No sender_id provided, using default: ${finalSenderId}`);
      }

      if (!message) {
        this.logger.error('sendSms - Validation failed: message is null/undefined');
        throw new BadRequestException('Message is required');
      }
      if (typeof message !== 'string') {
        this.logger.error(`sendSms - Validation failed: message is not a string (type: ${typeof message})`);
        throw new BadRequestException('Message must be a string');
      }
      if (message.trim() === '') {
        this.logger.error('sendSms - Validation failed: message is empty string');
        throw new BadRequestException('Message cannot be empty');
      }

      this.logger.log(
        `sendSms - Validated: Sending SMS to ${recipient} from ${finalSenderId}`,
      );
      this.logger.debug(
        `sendSms - Message length: ${message.length} characters, Message preview: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      );

      this.logger.debug('sendSms - Input validation passed');

      // Prepare request parameters
      const params = new URLSearchParams();
      params.append('recipient', recipient.trim());
      params.append('sender_id', finalSenderId.trim());
      params.append('message', message.trim());

      this.logger.debug(
        `sendSms - Calling Send.lk API: POST ${this.baseUrl}/sms/send`,
      );
      this.logger.debug(
        `sendSms - Request params: recipient=${recipient}, sender_id=${finalSenderId}`,
      );

      // Make API call
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

      const duration = Date.now() - startTime;
      this.logger.log(
        `sendSms - SMS sent successfully to ${recipient} in ${duration}ms`,
      );
      this.logger.debug(
        `sendSms - API Response status: ${response.status}, Response data: ${JSON.stringify(response.data)}`,
      );

      // Log response details if available
      if (response.data) {
        if (response.data.status === 'success') {
          this.logger.log(
            `sendSms - SMS delivery confirmed: ${JSON.stringify(response.data)}`,
          );
        } else {
          this.logger.warn(
            `sendSms - SMS sent but status is not success: ${JSON.stringify(response.data)}`,
          );
        }
      }

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Log detailed error information
      if (error.response) {
        // API returned an error response
        this.logger.error(
          `sendSms - API Error after ${duration}ms: Status ${error.response.status}, StatusText: ${error.response.statusText}`,
        );
        this.logger.error(
          `sendSms - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
        this.logger.error(
          `sendSms - Request that failed: recipient=${recipient}, sender_id=${finalSenderId}`,
        );
      } else if (error.request) {
        // Request was made but no response received
        this.logger.error(
          `sendSms - Network Error after ${duration}ms: No response received from Send.lk API`,
        );
        this.logger.error(
          `sendSms - Request details: recipient=${recipient}, sender_id=${finalSenderId}`,
        );
      } else {
        // Error in request setup
        this.logger.error(
          `sendSms - Request Setup Error: ${error.message}`,
          error.stack,
        );
      }

      this.logger.error(
        `sendSms - Full error details: ${JSON.stringify({
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        })}`,
      );

      // If it's already a BadRequestException, re-throw it with the original message
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Otherwise, throw a new BadRequestException with appropriate message
      throw new BadRequestException(
        error.response?.data?.message || error.message || 'Failed to send SMS',
      );
    }
  }

  /**
   * View an SMS by UID
   * GET /sms/{uid}
   */
  async viewSms(uid: string): Promise<any> {
    this.logger.log(`viewSms - Retrieving SMS with UID: ${uid}`);
    const startTime = Date.now();

    try {
      const response: AxiosResponse = await this.apiClient.get(`/sms/${uid}`);
      const duration = Date.now() - startTime;
      
      this.logger.log(
        `viewSms - SMS retrieved successfully for UID ${uid} in ${duration}ms`,
      );
      this.logger.debug(
        `viewSms - Response data: ${JSON.stringify(response.data)}`,
      );

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `viewSms - Failed to retrieve SMS ${uid} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `viewSms - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log('viewAllSms - Retrieving all SMS messages');
    const startTime = Date.now();
    try {
      const response: AxiosResponse = await this.apiClient.get('/sms/');
      const duration = Date.now() - startTime;
      this.logger.log(
        `viewAllSms - All SMS messages retrieved successfully in ${duration}ms`,
      );
      this.logger.debug(
        `viewAllSms - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `viewAllSms - Failed to retrieve SMS messages after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `viewAllSms - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(`createContactGroup - Creating contact group: ${name}`);
    const startTime = Date.now();
    try {
      const params = new URLSearchParams();
      params.append('name', name);

      this.logger.debug(
        `createContactGroup - Calling Send.lk API: POST ${this.baseUrl}/contacts`,
      );
      this.logger.debug(`createContactGroup - Group name: ${name}`);

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

      const duration = Date.now() - startTime;
      this.logger.log(
        `createContactGroup - Contact group "${name}" created successfully in ${duration}ms`,
      );
      this.logger.debug(
        `createContactGroup - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `createContactGroup - Failed to create contact group "${name}" after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `createContactGroup - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(`viewContactGroup - Retrieving contact group: ${group_id}`);
    const startTime = Date.now();
    try {
      this.logger.debug(
        `viewContactGroup - Calling Send.lk API: POST ${this.baseUrl}/contacts/${group_id}/show`,
      );
      const response: AxiosResponse = await this.apiClient.post(
        `/contacts/${group_id}/show`,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `viewContactGroup - Contact group ${group_id} retrieved successfully in ${duration}ms`,
      );
      this.logger.debug(
        `viewContactGroup - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `viewContactGroup - Failed to retrieve contact group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `viewContactGroup - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(
      `updateContactGroup - Updating contact group ${group_id} with name: ${name}`,
    );
    const startTime = Date.now();
    try {
      const params = new URLSearchParams();
      params.append('name', name);

      this.logger.debug(
        `updateContactGroup - Calling Send.lk API: PATCH ${this.baseUrl}/contacts/${group_id}`,
      );
      this.logger.debug(`updateContactGroup - New name: ${name}`);

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

      const duration = Date.now() - startTime;
      this.logger.log(
        `updateContactGroup - Contact group ${group_id} updated successfully in ${duration}ms`,
      );
      this.logger.debug(
        `updateContactGroup - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `updateContactGroup - Failed to update contact group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `updateContactGroup - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(`deleteContactGroup - Deleting contact group: ${group_id}`);
    const startTime = Date.now();
    try {
      this.logger.debug(
        `deleteContactGroup - Calling Send.lk API: DELETE ${this.baseUrl}/contacts/${group_id}`,
      );
      const response: AxiosResponse = await this.apiClient.delete(
        `/contacts/${group_id}`,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `deleteContactGroup - Contact group ${group_id} deleted successfully in ${duration}ms`,
      );
      this.logger.debug(
        `deleteContactGroup - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `deleteContactGroup - Failed to delete contact group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `deleteContactGroup - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log('viewAllContactGroups - Retrieving all contact groups');
    const startTime = Date.now();
    try {
      this.logger.debug(
        `viewAllContactGroups - Calling Send.lk API: GET ${this.baseUrl}/contacts/`,
      );
      const response: AxiosResponse = await this.apiClient.get('/contacts/');
      const duration = Date.now() - startTime;
      this.logger.log(
        `viewAllContactGroups - All contact groups retrieved successfully in ${duration}ms`,
      );
      this.logger.debug(
        `viewAllContactGroups - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `viewAllContactGroups - Failed to retrieve contact groups after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `viewAllContactGroups - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(
      `createContact - Creating contact in group ${group_id}: Phone ${phone}, Name: ${first_name || ''} ${last_name || ''}`,
    );
    const startTime = Date.now();
    try {
      const params = new URLSearchParams();
      params.append('phone', phone.toString());
      if (first_name) params.append('first_name', first_name);
      if (last_name) params.append('last_name', last_name);

      this.logger.debug(
        `createContact - Calling Send.lk API: POST ${this.baseUrl}/contacts/${group_id}/store`,
      );
      this.logger.debug(
        `createContact - Contact details: phone=${phone}, first_name=${first_name || 'N/A'}, last_name=${last_name || 'N/A'}`,
      );

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

      const duration = Date.now() - startTime;
      this.logger.log(
        `createContact - Contact created successfully in group ${group_id} in ${duration}ms`,
      );
      this.logger.debug(
        `createContact - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `createContact - Failed to create contact in group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `createContact - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(
      `viewContact - Retrieving contact ${uid} from group ${group_id}`,
    );
    const startTime = Date.now();
    try {
      this.logger.debug(
        `viewContact - Calling Send.lk API: POST ${this.baseUrl}/contacts/${group_id}/search/${uid}`,
      );
      const response: AxiosResponse = await this.apiClient.post(
        `/contacts/${group_id}/search/${uid}`,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `viewContact - Contact ${uid} retrieved successfully in ${duration}ms`,
      );
      this.logger.debug(
        `viewContact - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `viewContact - Failed to retrieve contact ${uid} from group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `viewContact - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(
      `updateContact - Updating contact ${uid} in group ${group_id}: Phone ${phone}, Name: ${first_name || ''} ${last_name || ''}`,
    );
    const startTime = Date.now();
    try {
      const params = new URLSearchParams();
      params.append('phone', phone.toString());
      if (first_name) params.append('first_name', first_name);
      if (last_name) params.append('last_name', last_name);

      this.logger.debug(
        `updateContact - Calling Send.lk API: PATCH ${this.baseUrl}/contacts/${group_id}/update/${uid}`,
      );
      this.logger.debug(
        `updateContact - Updated contact details: phone=${phone}, first_name=${first_name || 'N/A'}, last_name=${last_name || 'N/A'}`,
      );

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

      const duration = Date.now() - startTime;
      this.logger.log(
        `updateContact - Contact ${uid} updated successfully in ${duration}ms`,
      );
      this.logger.debug(
        `updateContact - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `updateContact - Failed to update contact ${uid} in group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `updateContact - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(
      `deleteContact - Deleting contact ${uid} from group ${group_id}`,
    );
    const startTime = Date.now();
    try {
      this.logger.debug(
        `deleteContact - Calling Send.lk API: DELETE ${this.baseUrl}/contacts/${group_id}/delete/${uid}`,
      );
      const response: AxiosResponse = await this.apiClient.delete(
        `/contacts/${group_id}/delete/${uid}`,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `deleteContact - Contact ${uid} deleted successfully in ${duration}ms`,
      );
      this.logger.debug(
        `deleteContact - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `deleteContact - Failed to delete contact ${uid} from group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `deleteContact - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log(
      `viewAllContacts - Retrieving all contacts from group ${group_id}`,
    );
    const startTime = Date.now();
    try {
      this.logger.debug(
        `viewAllContacts - Calling Send.lk API: POST ${this.baseUrl}/contacts/${group_id}/all`,
      );
      const response: AxiosResponse = await this.apiClient.post(
        `/contacts/${group_id}/all`,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `viewAllContacts - All contacts retrieved successfully from group ${group_id} in ${duration}ms`,
      );
      this.logger.debug(
        `viewAllContacts - Response data: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `viewAllContacts - Failed to retrieve contacts from group ${group_id} after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `viewAllContacts - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log('getBalance - Retrieving SMS balance');
    const startTime = Date.now();

    try {
      const response: AxiosResponse = await this.apiClient.get('/balance');
      const duration = Date.now() - startTime;
      
      this.logger.log(`getBalance - Balance retrieved successfully in ${duration}ms`);
      this.logger.debug(
        `getBalance - Balance data: ${JSON.stringify(response.data)}`,
      );

      // Log balance amount if available
      if (response.data?.data?.balance !== undefined) {
        this.logger.log(
          `getBalance - Current SMS balance: ${response.data.data.balance}`,
        );
      }

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `getBalance - Failed to retrieve balance after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `getBalance - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
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
    this.logger.log('getProfile - Retrieving SMS profile');
    const startTime = Date.now();

    try {
      const response: AxiosResponse = await this.apiClient.get('/me');
      const duration = Date.now() - startTime;
      
      this.logger.log(`getProfile - Profile retrieved successfully in ${duration}ms`);
      this.logger.debug(
        `getProfile - Profile data: ${JSON.stringify(response.data)}`,
      );

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `getProfile - Failed to retrieve profile after ${duration}ms: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        this.logger.error(
          `getProfile - API Error Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to retrieve profile',
      );
    }
  }
}
