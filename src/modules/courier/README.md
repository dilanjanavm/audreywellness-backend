# Courier Tracking Module

## Overview

This module provides integration with Citypak (Falcon) courier service for creating orders, tracking packages, and receiving webhook updates.

## Features

- ✅ Create courier orders via Citypak API
- ✅ Track packages by tracking number
- ✅ Store tracking history in database
- ✅ Receive webhook updates from Citypak
- ✅ Print waybills (PDF) by order ID or tracking numbers
- ✅ Support for staging and production environments
- ✅ Automatic status synchronization with Citypak API

## Module Structure

```
courier/
├── entities/
│   ├── courier-order.entity.ts          # Courier order entity
│   └── courier-tracking-history.entity.ts # Tracking history entity
├── dto/
│   ├── create-courier-order.dto.ts      # Create order DTO
│   ├── courier-order-response.dto.ts    # Response DTOs
│   └── webhook.dto.ts                   # Webhook DTO
├── services/
│   ├── citypak-api.service.ts           # Citypak API integration
│   └── courier-tracking.service.ts      # Business logic service
├── courier.controller.ts                 # API endpoints
├── courier.module.ts                     # Module definition
└── README.md                             # This file
```

## Setup

### 1. Install Dependencies

```bash
npm install axios
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# For Staging
CITYPAK_STAGING_URL=https://staging.citypak.lk
CITYPAK_STAGING_API_TOKEN=your-staging-token

# For Production
CITYPAK_PRODUCTION_URL=https://falcon.citypak.lk
CITYPAK_PRODUCTION_API_TOKEN=your-production-token
```

See `docs/COURIER_TRACKING_API.md` for detailed configuration.

### 3. Run Database Migration

Create and run a migration to create the tables:

```bash
# Generate migration
npm run migration:generate -- -n CreateCourierTables

# Run migration
npm run migration:run
```

The migration should create:
- `courier_orders` table
- `courier_tracking_history` table

### 4. Register Module

The module is already registered in `app.module.ts`.

## API Endpoints

### Create Order
```
POST /courier/orders
```

### Track Order
```
GET /courier/track/:trackingNumber
```

### Get All Orders
```
GET /courier/orders
```

### Get Order by ID
```
GET /courier/orders/:id
```

### Print Waybills by Order ID
```
GET /courier/orders/:orderId/waybills
```

### Print Waybills by Tracking Numbers
```
GET /courier/waybills?tracking_numbers=TRACKING1,TRACKING2
```

### Webhook Endpoint
```
POST /courier/webhook
```

**Note:** Webhook endpoint does NOT require authentication.

## Usage Examples

### Create an Order

```typescript
const order = await courierTrackingService.createOrder({
  reference: 'ORD-001',
  fromName: 'Sender Name',
  fromAddressLine1: '123 Main St',
  fromContact1: '0771234567',
  toName: 'Receiver Name',
  toAddressLine1: '456 Oak Ave',
  toContact1: '0779876543',
  weightG: 500,
});
```

### Track an Order

```typescript
const tracking = await courierTrackingService.trackOrder('D00008987');
console.log('Status:', tracking.isDelivered ? 'Delivered' : 'In Transit');
console.log('History:', tracking.trackingHistory);
```

## Webhook Setup

To enable webhook notifications:

1. Contact your Citypak account coordinator
2. Request access to push API
3. Provide webhook URL: `https://your-domain.com/courier/webhook`
4. Optional: Provide webhook API key for authentication

## Testing

### Test Create Order

```bash
curl -X POST http://localhost:3005/courier/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST-001",
    "fromName": "Test Sender",
    "fromAddressLine1": "123 Test St",
    "fromContact1": "0771234567",
    "toName": "Test Receiver",
    "toAddressLine1": "456 Test Ave",
    "toContact1": "0779876543",
    "weightG": 500
  }'
```

### Test Track Order

```bash
curl -X GET http://localhost:3005/courier/track/D00008987 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Webhook

```bash
curl -X POST http://localhost:3005/courier/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_number": "D00010032",
    "reference": "TEST-001",
    "item_id": "10032",
    "status_type": "UD",
    "status": "FIRST MILE RECEIVE SCAN",
    "action_datetime": "19-06-2024 13:30:59"
  }'
```

## Documentation

For detailed API documentation, see:
- `docs/COURIER_TRACKING_API.md` - Complete API documentation
- Citypak API Documentation - Provided by Citypak

## Notes

- All endpoints require JWT authentication except `/courier/webhook`
- Tracking data is automatically synced with Citypak API
- Webhook updates are stored in the tracking history
- Waybill PDFs are generated server-side to keep API tokens secure
- The service supports both staging and production environments

## Troubleshooting

### Error: API token not configured

Make sure you have set the appropriate environment variables:
- `CITYPAK_STAGING_API_TOKEN` for development
- `CITYPAK_PRODUCTION_API_TOKEN` for production

### Error: Tracking number not found

- Check if the tracking number exists in Citypak system
- Verify your API token has access to this order
- Check if the order was created successfully

### Webhook not receiving updates

- Verify webhook URL is accessible from Citypak servers
- Check if webhook endpoint is properly configured with Citypak
- Review server logs for incoming webhook requests
- Ensure webhook endpoint does NOT require authentication

## Support

For issues or questions:
- Check `docs/COURIER_TRACKING_API.md` for detailed documentation
- Review server logs for error details
- Contact Citypak support for API-related issues

