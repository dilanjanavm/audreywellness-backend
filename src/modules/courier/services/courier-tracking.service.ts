import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourierOrderEntity } from '../entities/courier-order.entity';
import { CourierTrackingHistoryEntity } from '../entities/courier-tracking-history.entity';
import { CitypakApiService } from './citypak-api.service';
import { CreateCourierOrderDto } from '../dto/create-courier-order.dto';
import {
  CourierOrderDto,
  CourierTrackingStatusDto,
} from '../dto/courier-order-response.dto';
import { CourierWebhookDto } from '../dto/webhook.dto';

@Injectable()
export class CourierTrackingService {
  private readonly logger = new Logger(CourierTrackingService.name);

  constructor(
    @InjectRepository(CourierOrderEntity)
    private readonly courierOrderRepository: Repository<CourierOrderEntity>,
    @InjectRepository(CourierTrackingHistoryEntity)
    private readonly trackingHistoryRepository: Repository<CourierTrackingHistoryEntity>,
    private readonly citypakApiService: CitypakApiService,
  ) {}

  /**
   * Create a new courier order
   */
  async createOrder(dto: CreateCourierOrderDto): Promise<CourierOrderDto> {
    try {
      // Create order via Citypak API
      const apiResponse = await this.citypakApiService.createOrder(dto);

      if (!apiResponse.success || !apiResponse.data.items.length) {
        throw new BadRequestException(
          apiResponse.message || 'Failed to create order',
        );
      }

      const orderItem = apiResponse.data.items[0];

      // Check if order with this tracking number already exists
      const existingOrder = await this.courierOrderRepository.findOne({
        where: { trackingNumber: orderItem.trackingNumber },
      });

      if (existingOrder) {
        this.logger.warn(
          `Order with tracking number ${orderItem.trackingNumber} already exists`,
        );
        return this.mapToDto(existingOrder);
      }

      // Create courier order entity
      const courierOrder = this.courierOrderRepository.create({
        citypakOrderId: apiResponse.data.orderId,
        trackingNumber: orderItem.trackingNumber,
        reference: orderItem.reference,
        deliveryFacilityCode: orderItem.deliveryFacilityCode,
        fromName: dto.fromName,
        fromAddressLine1: dto.fromAddressLine1,
        fromAddressLine2: dto.fromAddressLine2,
        fromAddressLine3: dto.fromAddressLine3,
        fromAddressLine4: dto.fromAddressLine4,
        fromContactName: dto.fromContactName,
        fromContact1: dto.fromContact1,
        fromContact2: dto.fromContact2,
        toName: dto.toName,
        toAddressLine1: dto.toAddressLine1,
        toAddressLine2: dto.toAddressLine2,
        toAddressLine3: dto.toAddressLine3,
        toAddressLine4: dto.toAddressLine4,
        toContactName: dto.toContactName,
        toContact1: dto.toContact1,
        toContact2: dto.toContact2,
        toNic: dto.toNic,
        description: dto.description,
        weightG: dto.weightG,
        cashOnDeliveryAmount: dto.cashOnDeliveryAmount || 0,
        numberOfPieces: dto.numberOfPieces || 1,
        isDelivered: false,
      });

      const savedOrder = await this.courierOrderRepository.save(courierOrder);

      this.logger.log(
        `Courier order created successfully. Tracking Number: ${savedOrder.trackingNumber}`,
      );

      return this.mapToDto(savedOrder);
    } catch (error: any) {
      this.logger.error(`Error creating courier order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Track an order by tracking number
   */
  async trackOrder(trackingNumber: string): Promise<CourierOrderDto> {
    try {
      // Find order in database
      let courierOrder = await this.courierOrderRepository.findOne({
        where: { trackingNumber },
        relations: ['trackingHistory'],
        order: { trackingHistory: { createdAt: 'ASC' } },
      });

      // If not found, try to fetch from API and create
      if (!courierOrder) {
        this.logger.warn(
          `Order not found in database. Fetching from API: ${trackingNumber}`,
        );
        const apiResponse = await this.citypakApiService.trackOrder(
          trackingNumber,
        );

        if (!apiResponse.isSuccess) {
          throw new NotFoundException(
            `Tracking number ${trackingNumber} not found`,
          );
        }

        // Create order entity from API response
        courierOrder = this.courierOrderRepository.create({
          trackingNumber: apiResponse.data.trackingNumber,
          reference: apiResponse.data.reference,
          isDelivered: apiResponse.data.isDelivered,
          receiverName: apiResponse.data.receiverName,
          receiverNic: apiResponse.data.receiverNic,
          podImageUrl: apiResponse.data.podImageUrl,
        });

        courierOrder = await this.courierOrderRepository.save(courierOrder);

        // Save tracking history
        if (apiResponse.data.trackingHistory?.length) {
          await this.syncTrackingHistory(courierOrder, apiResponse.data.trackingHistory);
        }
      } else {
        // Sync with API to get latest status
        try {
          const apiResponse = await this.citypakApiService.trackOrder(
            trackingNumber,
          );

          if (apiResponse.isSuccess) {
            // Update order status
            courierOrder.isDelivered = apiResponse.data.isDelivered;
            if (apiResponse.data.receiverName) {
              courierOrder.receiverName = apiResponse.data.receiverName;
            }
            if (apiResponse.data.receiverNic) {
              courierOrder.receiverNic = apiResponse.data.receiverNic;
            }
            if (apiResponse.data.podImageUrl) {
              courierOrder.podImageUrl = apiResponse.data.podImageUrl;
            }

            await this.courierOrderRepository.save(courierOrder);

            // Sync tracking history
            if (apiResponse.data.trackingHistory?.length) {
              await this.syncTrackingHistory(
                courierOrder,
                apiResponse.data.trackingHistory,
              );
            }

            // Reload with updated history
            courierOrder = await this.courierOrderRepository.findOne({
              where: { trackingNumber },
              relations: ['trackingHistory'],
              order: { trackingHistory: { createdAt: 'ASC' } },
            });
          }
        } catch (error: any) {
          this.logger.warn(
            `Failed to sync with API for ${trackingNumber}: ${error.message}. Using cached data.`,
          );
        }
      }

      if (!courierOrder) {
        throw new NotFoundException(
          `Tracking number ${trackingNumber} not found`,
        );
      }

      return this.mapToDto(courierOrder);
    } catch (error: any) {
      this.logger.error(
        `Error tracking order ${trackingNumber}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sync tracking history from API response
   */
  private async syncTrackingHistory(
    order: CourierOrderEntity,
    apiHistory: CourierTrackingStatusDto[],
  ): Promise<void> {
    for (const historyItem of apiHistory) {
      // Parse date and time
      const [day, month, year] = historyItem.date.split('-').map(Number);
      const [hours, minutes, seconds] = historyItem.time
        .split(':')
        .map(Number);
      const actionDatetime = new Date(year, month - 1, day, hours, minutes, seconds);

      // Check if history entry already exists
      const existingHistory = await this.trackingHistoryRepository.findOne({
        where: {
          courierOrderId: order.id,
          trackingNumber: order.trackingNumber,
          statusType: historyItem.statusType,
          actionDatetime,
        },
      });

      if (!existingHistory) {
        const historyEntity = this.trackingHistoryRepository.create({
          courierOrderId: order.id,
          trackingNumber: order.trackingNumber,
          statusType: historyItem.statusType,
          statusCode: historyItem.statusCode,
          description: historyItem.description,
          location: historyItem.location,
          date: actionDatetime,
          time: historyItem.time,
          actionDatetime,
        });

        await this.trackingHistoryRepository.save(historyEntity);
      }
    }
  }

  /**
   * Handle webhook from Citypak
   */
  async handleWebhook(webhookDto: CourierWebhookDto): Promise<void> {
    try {
      this.logger.log(
        `Received webhook for tracking number: ${webhookDto.tracking_number}, status: ${webhookDto.status}`,
      );

      // Find or create order
      let order = await this.courierOrderRepository.findOne({
        where: { trackingNumber: webhookDto.tracking_number },
      });

      if (!order) {
        this.logger.warn(
          `Order not found for tracking number: ${webhookDto.tracking_number}. Creating new order.`,
        );
        order = this.courierOrderRepository.create({
          trackingNumber: webhookDto.tracking_number,
          reference: webhookDto.reference,
        });
        order = await this.courierOrderRepository.save(order);
      }

      // Parse action datetime
      let actionDatetime: Date | undefined;
      if (webhookDto.action_datetime) {
        const [datePart, timePart] = webhookDto.action_datetime.split(' ');
        const [day, month, year] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        actionDatetime = new Date(year, month - 1, day, hours, minutes, seconds);
      }

      // Parse delivered datetime if available
      let deliveredDatetime: Date | undefined;
      if (webhookDto.delivered_datetime) {
        const [datePart, timePart] = webhookDto.delivered_datetime.split(' ');
        const [day, month, year] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        deliveredDatetime = new Date(year, month - 1, day, hours, minutes, seconds);
      }

      // Check if history entry already exists
      const existingHistory = actionDatetime
        ? await this.trackingHistoryRepository.findOne({
            where: {
              courierOrderId: order.id,
              trackingNumber: webhookDto.tracking_number,
              statusType: webhookDto.status,
              actionDatetime,
            },
          })
        : null;

      if (!existingHistory) {
        const historyEntity = this.trackingHistoryRepository.create({
          courierOrderId: order.id,
          trackingNumber: webhookDto.tracking_number,
          statusType: webhookDto.status,
          statusCode: webhookDto.status_type,
          actionDatetime,
          deliveredDatetime,
          reason: webhookDto.reason,
        });

        await this.trackingHistoryRepository.save(historyEntity);
        this.logger.log(
          `Tracking history saved for ${webhookDto.tracking_number}: ${webhookDto.status}`,
        );
      }

      // Update order status if delivered
      if (
        webhookDto.status === 'DELIVERED' &&
        webhookDto.status_type === 'DL'
      ) {
        order.isDelivered = true;
        if (deliveredDatetime) {
          // You might want to store this separately
        }
        await this.courierOrderRepository.save(order);
        this.logger.log(
          `Order ${webhookDto.tracking_number} marked as delivered`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Error handling webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getAllOrders(): Promise<CourierOrderDto[]> {
    const orders = await this.courierOrderRepository.find({
      relations: ['trackingHistory'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => this.mapToDto(order));
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<CourierOrderDto> {
    const order = await this.courierOrderRepository.findOne({
      where: { id },
      relations: ['trackingHistory'],
      order: { trackingHistory: { createdAt: 'ASC' } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapToDto(order);
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(order: CourierOrderEntity): CourierOrderDto {
    return {
      id: order.id,
      citypakOrderId: order.citypakOrderId,
      trackingNumber: order.trackingNumber,
      reference: order.reference,
      fromName: order.fromName,
      fromAddressLine1: order.fromAddressLine1,
      fromAddressLine2: order.fromAddressLine2,
      fromAddressLine3: order.fromAddressLine3,
      fromAddressLine4: order.fromAddressLine4,
      fromContactName: order.fromContactName,
      fromContact1: order.fromContact1,
      fromContact2: order.fromContact2,
      toName: order.toName,
      toAddressLine1: order.toAddressLine1,
      toAddressLine2: order.toAddressLine2,
      toAddressLine3: order.toAddressLine3,
      toAddressLine4: order.toAddressLine4,
      toContactName: order.toContactName,
      toContact1: order.toContact1,
      toContact2: order.toContact2,
      toNic: order.toNic,
      description: order.description,
      weightG: order.weightG,
      cashOnDeliveryAmount: Number(order.cashOnDeliveryAmount),
      numberOfPieces: order.numberOfPieces,
      isDelivered: order.isDelivered,
      receiverName: order.receiverName,
      receiverNic: order.receiverNic,
      podImageUrl: order.podImageUrl,
      deliveryFacilityCode: order.deliveryFacilityCode,
      trackingHistory: order.trackingHistory?.map((h) => ({
        date: h.date ? h.date.toISOString().split('T')[0] : '',
        time: h.time || '',
        statusType: h.statusType,
        statusCode: h.statusCode,
        description: h.description,
        location: h.location,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

