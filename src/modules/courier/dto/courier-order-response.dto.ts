export class CourierOrderItemDto {
  trackingNumber: string;
  reference: string;
  deliveryFacilityCode?: string;
}

export class CreateCourierOrderResponseDto {
  success: boolean;
  message: string;
  data: {
    orderId: number;
    items: CourierOrderItemDto[];
  };
}

export class CourierTrackingStatusDto {
  date: string;
  time: string;
  statusType: string;
  statusCode?: string;
  description?: string;
  location?: string;
}

export class TrackCourierOrderResponseDto {
  isSuccess: boolean;
  data: {
    trackingNumber: string;
    reference: string;
    isDelivered: boolean;
    receiverName?: string;
    receiverNic?: string;
    podImageUrl?: string;
    trackingHistory: CourierTrackingStatusDto[];
  };
}

export class CourierOrderDto {
  id: string;
  citypakOrderId?: number;
  trackingNumber: string;
  reference: string;
  fromName: string;
  fromAddressLine1: string;
  fromAddressLine2?: string;
  fromAddressLine3?: string;
  fromAddressLine4?: string;
  fromContactName?: string;
  fromContact1: string;
  fromContact2?: string;
  toName: string;
  toAddressLine1: string;
  toAddressLine2?: string;
  toAddressLine3?: string;
  toAddressLine4?: string;
  toContactName?: string;
  toContact1: string;
  toContact2?: string;
  toNic?: string;
  description?: string;
  weightG: number;
  cashOnDeliveryAmount: number;
  numberOfPieces: number;
  isDelivered: boolean;
  receiverName?: string;
  receiverNic?: string;
  podImageUrl?: string;
  deliveryFacilityCode?: string;
  trackingHistory?: CourierTrackingStatusDto[];
  createdAt: Date;
  updatedAt: Date;
}

