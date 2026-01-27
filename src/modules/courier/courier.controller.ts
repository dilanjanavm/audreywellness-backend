import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  ParseArrayPipe,
} from '@nestjs/common';
import express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CourierTrackingService } from './services/courier-tracking.service';
import { CitypakApiService } from './services/citypak-api.service';
import { CreateCourierOrderDto } from './dto/create-courier-order.dto';
import { CourierWebhookDto } from './dto/webhook.dto';
import { CourierOrderDto } from './dto/courier-order-response.dto';

@Controller('courier')
export class CourierController {
  constructor(
    private readonly courierTrackingService: CourierTrackingService,
    private readonly citypakApiService: CitypakApiService,
  ) {}

  /**
   * Create a new courier order
   * POST /courier/orders
   */
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body() createOrderDto: CreateCourierOrderDto,
  ): Promise<CourierOrderDto> {
    return this.courierTrackingService.createOrder(createOrderDto);
  }

  /**
   * Track an order by tracking number
   * GET /courier/track/:trackingNumber
   */
  @Get('track/:trackingNumber')
  @UseGuards(JwtAuthGuard)
  async trackOrder(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<CourierOrderDto> {
    return this.courierTrackingService.trackOrder(trackingNumber);
  }

  /**
   * Get all courier orders
   * GET /courier/orders
   */
  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getAllOrders(): Promise<CourierOrderDto[]> {
    return this.courierTrackingService.getAllOrders();
  }

  /**
   * Get order by ID
   * GET /courier/orders/:id
   */
  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id') id: string): Promise<CourierOrderDto> {
    return this.courierTrackingService.getOrderById(id);
  }

  /**
   * Print waybills by order ID
   * GET /courier/orders/:orderId/waybills
   */
  @Get('orders/:orderId/waybills')
  @UseGuards(JwtAuthGuard)
  async printWaybillsByOrderId(
    @Param('orderId') orderId: number,
    @Res() res: express.Response,
    @Query('page_size') pageSize: 'A4' | '4X6' = 'A4',
    @Query('per_page_waybill_count') perPageWaybillCount: number = 4,
  ): Promise<void> {
    const pdfBuffer = await this.citypakApiService.printWaybillsByOrderId(
      Number(orderId),
      pageSize,
      perPageWaybillCount,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="waybill-${orderId}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  /**
   * Print waybills by tracking numbers
   * GET /courier/waybills?tracking_numbers=TRACKING1,TRACKING2
   * or GET /courier/waybills?tracking_numbers[]=TRACKING1&tracking_numbers[]=TRACKING2
   */
  @Get('waybills')
  @UseGuards(JwtAuthGuard)
  async printWaybillsByTrackingNumbers(
    @Res() res: express.Response,
    @Query('tracking_numbers', new ParseArrayPipe({ items: String, separator: ',', optional: true }))
    trackingNumbers?: string | string[],
    @Query('page_size') pageSize: 'A4' | '4X6' = 'A4',
    @Query('per_page_waybill_count') perPageWaybillCount: number = 4,
  ): Promise<void> {
    // Handle both array and comma-separated string formats
    let trackingNumbersArray: string[] = [];
    if (Array.isArray(trackingNumbers)) {
      trackingNumbersArray = trackingNumbers;
    } else if (typeof trackingNumbers === 'string') {
      trackingNumbersArray = trackingNumbers.split(',');
    } else {
      throw new Error('tracking_numbers parameter is required');
    }

    const pdfBuffer =
      await this.citypakApiService.printWaybillsByTrackingNumbers(
        trackingNumbersArray,
        pageSize,
        perPageWaybillCount,
      );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="waybills.pdf"',
    );
    res.send(pdfBuffer);
  }

  /**
   * Webhook endpoint for Citypak push API
   * POST /courier/webhook
   * NOTE: This endpoint should NOT use JWT auth guard as it's called by Citypak
   */
  @Post('webhook')
  async handleWebhook(@Body() webhookDto: CourierWebhookDto): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.courierTrackingService.handleWebhook(webhookDto);
    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }
}

