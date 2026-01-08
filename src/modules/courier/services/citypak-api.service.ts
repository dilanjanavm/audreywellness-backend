import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CreateCourierOrderDto } from '../dto/create-courier-order.dto';
import {
  CreateCourierOrderResponseDto,
  TrackCourierOrderResponseDto,
} from '../dto/courier-order-response.dto';

@Injectable()
export class CitypakApiService {
  private readonly logger = new Logger(CitypakApiService.name);
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(private configService: ConfigService) {
    // Determine environment
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    this.baseUrl = isProduction
      ? this.configService.get<string>('CITYPAK_PRODUCTION_URL') ||
        'https://falcon.citypak.lk'
      : this.configService.get<string>('CITYPAK_STAGING_URL') ||
        'https://staging.citypak.lk';

    this.apiToken = isProduction
      ? this.configService.get<string>('CITYPAK_PRODUCTION_API_TOKEN') ||
        this.configService.get<string>('CITYPAK_API_TOKEN')
      : this.configService.get<string>('CITYPAK_STAGING_API_TOKEN') ||
        this.configService.get<string>('CITYPAK_API_TOKEN');

    if (!this.apiToken) {
      this.logger.warn(
        'Citypak API token not configured. Courier service will not work.',
      );
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.logger.log(
      `Citypak API Service initialized with base URL: ${this.baseUrl}`,
    );
  }

  /**
   * Create a new courier order
   */
  async createOrder(
    dto: CreateCourierOrderDto,
  ): Promise<CreateCourierOrderResponseDto> {
    try {
      const requestBody = {
        token: this.apiToken,
        reference: dto.reference,
        from_name: dto.fromName,
        from_address_line_1: dto.fromAddressLine1,
        from_address_line_2: dto.fromAddressLine2 || '',
        from_address_line_3: dto.fromAddressLine3 || '',
        from_address_line_4: dto.fromAddressLine4 || '',
        from_contact_name: dto.fromContactName || '',
        from_contact_1: dto.fromContact1,
        from_contact_2: dto.fromContact2 || '',
        to_name: dto.toName,
        to_address_line_1: dto.toAddressLine1,
        to_address_line_2: dto.toAddressLine2 || '',
        to_address_line_3: dto.toAddressLine3 || '',
        to_address_line_4: dto.toAddressLine4 || '',
        to_contact_name: dto.toContactName || '',
        to_contact_1: dto.toContact1,
        to_contact_2: dto.toContact2 || '',
        to_nic: dto.toNic || '',
        description: dto.description || '',
        weight_g: dto.weightG,
        cash_on_delivery_amount: dto.cashOnDeliveryAmount || 0,
        number_of_pieces: dto.numberOfPieces || 1,
      };

      this.logger.debug(
        `Creating courier order with reference: ${dto.reference}`,
      );

      const response: AxiosResponse<CreateCourierOrderResponseDto> =
        await this.apiClient.post('/customer_api/v1/orders', requestBody);

      if (response.data.success) {
        this.logger.log(
          `Order created successfully. Order ID: ${response.data.data.orderId}`,
        );
        return response.data;
      } else {
        throw new BadRequestException(
          response.data.message || 'Failed to create order',
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Error creating courier order: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        throw new BadRequestException(
          error.response.data?.message ||
            `Failed to create order: ${error.message}`,
        );
      }
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Track an order by tracking number
   */
  async trackOrder(
    trackingNumber: string,
  ): Promise<TrackCourierOrderResponseDto> {
    try {
      this.logger.debug(`Tracking order: ${trackingNumber}`);

      const response: AxiosResponse<TrackCourierOrderResponseDto> =
        await this.apiClient.get('/customer_api/v1/track', {
          params: {
            tracking_number: trackingNumber,
          },
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        });

      if (response.data.isSuccess) {
        this.logger.log(
          `Tracking info retrieved for: ${trackingNumber}. Delivered: ${response.data.data.isDelivered}`,
        );
        return response.data;
      } else {
        throw new BadRequestException('Failed to retrieve tracking information');
      }
    } catch (error: any) {
      this.logger.error(
        `Error tracking order ${trackingNumber}: ${error.message}`,
        error.stack,
      );
      if (error.response?.status === 404) {
        throw new BadRequestException(
          `Tracking number ${trackingNumber} not found`,
        );
      }
      if (error.response) {
        throw new BadRequestException(
          error.response.data?.message ||
            `Failed to track order: ${error.message}`,
        );
      }
      throw new BadRequestException(`Failed to track order: ${error.message}`);
    }
  }

  /**
   * Print waybills by order ID
   */
  async printWaybillsByOrderId(
    orderId: number,
    pageSize: 'A4' | '4X6' = 'A4',
    perPageWaybillCount: number = 4,
  ): Promise<Buffer> {
    try {
      this.logger.debug(`Printing waybills for order ID: ${orderId}`);

      const response: AxiosResponse<Buffer> = await this.apiClient.get(
        `/customer_api/v1/orders/${orderId}/waybills`,
        {
          params: {
            page_size: pageSize,
            per_page_waybill_count: perPageWaybillCount,
          },
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
          responseType: 'arraybuffer',
        },
      );

      this.logger.log(`Waybills PDF generated for order ID: ${orderId}`);
      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(
        `Error printing waybills for order ${orderId}: ${error.message}`,
        error.stack,
      );
      if (error.response?.status === 404) {
        throw new BadRequestException(`Order ID ${orderId} not found`);
      }
      throw new BadRequestException(
        `Failed to print waybills: ${error.message}`,
      );
    }
  }

  /**
   * Print waybills by tracking numbers
   */
  async printWaybillsByTrackingNumbers(
    trackingNumbers: string[],
    pageSize: 'A4' | '4X6' = 'A4',
    perPageWaybillCount: number = 4,
  ): Promise<Buffer> {
    try {
      this.logger.debug(
        `Printing waybills for tracking numbers: ${trackingNumbers.join(', ')}`,
      );

      // Build params - need to format tracking_numbers[] as array parameters
      const params = new URLSearchParams();
      params.append('page_size', pageSize);
      params.append('per_page_waybill_count', perPageWaybillCount.toString());
      
      // Add tracking numbers as array parameters: tracking_numbers[]=value1&tracking_numbers[]=value2
      trackingNumbers.forEach((tn) => {
        params.append('tracking_numbers[]', tn);
      });

      const response: AxiosResponse<Buffer> = await this.apiClient.get(
        `/customer_api/v1/waybills?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
          responseType: 'arraybuffer',
        },
      );

      this.logger.log(
        `Waybills PDF generated for ${trackingNumbers.length} tracking numbers`,
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(
        `Error printing waybills: ${error.message}`,
        error.stack,
      );
      if (error.response?.status === 404) {
        throw new BadRequestException('Waybills not found');
      }
      throw new BadRequestException(
        `Failed to print waybills: ${error.message}`,
      );
    }
  }
}

