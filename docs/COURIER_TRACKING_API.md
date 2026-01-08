# Courier Tracking API Documentation

## Overview

The Courier Tracking API integrates with Citypak (Falcon) courier service to create orders, track packages, and receive webhook updates. This module provides full tracking functionality for courier packages.

## Environment Configuration

### Required Environment Variables

Add the following environment variables to your `.env` file:

#### For Staging/Testing Environment:

```env
# Citypak Staging Configuration
CITYPAK_STAGING_URL=https://staging.citypak.lk
CITYPAK_STAGING_API_TOKEN=your-staging-api-token-here
```

#### For Production Environment:

```env
# Citypak Production Configuration
CITYPAK_PRODUCTION_URL=https://falcon.citypak.lk
CITYPAK_PRODUCTION_API_TOKEN=your-production-api-token-here
```

#### Alternative (Environment-based):

If you want to use a single set of variables based on NODE_ENV:

```env
# Citypak Configuration (used when specific environment vars not set)
CITYPAK_API_TOKEN=your-api-token-here
NODE_ENV=production  # or development
```

**Note:** The service automatically selects the appropriate configuration based on `NODE_ENV`. Production environment will use `CITYPAK_PRODUCTION_*` variables if available, otherwise falls back to `CITYPAK_STAGING_*` or `CITYPAK_API_TOKEN`.

### Environment Variables Summary

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CITYPAK_STAGING_API_TOKEN` | No* | API token for staging environment | `103-64a6ac16-2a17-4128-bcc7-458c81e1e10e` |
| `CITYPAK_PRODUCTION_API_TOKEN` | No* | API token for production environment | `135-8f2028d1-01a2-4970-a7f0-3cde42941fbd` |
| `CITYPAK_STAGING_URL` | No | Staging API base URL (default: `https://staging.citypak.lk`) | `https://staging.citypak.lk` |
| `CITYPAK_PRODUCTION_URL` | No | Production API base URL (default: `https://falcon.citypak.lk`) | `https://falcon.citypak.lk` |
| `CITYPAK_API_TOKEN` | No* | Fallback API token (used when environment-specific token not set) | `your-api-token-here` |
| `NODE_ENV` | No | Environment type (`production` or `development`) | `production` |

*At least one API token must be configured.

## API Endpoints

### 1. Create Courier Order

**POST** `/courier/orders`

Create a new courier order with Citypak.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reference": "REF-001",
  "fromName": "Sender Name",
  "fromAddressLine1": "123 Main Street",
  "fromAddressLine2": "Suite 100",
  "fromAddressLine3": "",
  "fromAddressLine4": "Colombo",
  "fromContactName": "John Doe",
  "fromContact1": "0771234567",
  "fromContact2": "",
  "toName": "Receiver Name",
  "toAddressLine1": "456 Oak Avenue",
  "toAddressLine2": "",
  "toAddressLine3": "",
  "toAddressLine4": "Kandy",
  "toContactName": "Jane Doe",
  "toContact1": "0779876543",
  "toContact2": "",
  "toNic": "",
  "description": "Package contents",
  "weightG": 500,
  "cashOnDeliveryAmount": 0,
  "numberOfPieces": 1
}
```

**Response:**
```json
{
  "id": "uuid",
  "citypakOrderId": 55,
  "trackingNumber": "D00008987",
  "reference": "REF-001",
  "fromName": "Sender Name",
  "fromAddressLine1": "123 Main Street",
  "isDelivered": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Track Order by Tracking Number

**GET** `/courier/track/:trackingNumber`

Track an order by its tracking number. This endpoint will sync with Citypak API to get the latest status.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "id": "uuid",
  "trackingNumber": "D00008987",
  "reference": "REF-001",
  "isDelivered": true,
  "receiverName": "Jane Doe",
  "receiverNic": "",
  "podImageUrl": "",
  "trackingHistory": [
    {
      "date": "2024-01-01",
      "time": "13:45:12",
      "statusType": "FIRST MILE RECEIVE SCAN",
      "statusCode": "UD",
      "description": "",
      "location": "COLOMBO"
    },
    {
      "date": "2024-01-01",
      "time": "13:49:36",
      "statusType": "DELIVERED",
      "statusCode": "DL",
      "description": "",
      "location": "KANDY"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. Get All Orders

**GET** `/courier/orders`

Get all courier orders in the system.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "trackingNumber": "D00008987",
    "reference": "REF-001",
    "isDelivered": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 4. Get Order by ID

**GET** `/courier/orders/:id`

Get a specific order by its internal ID.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

### 5. Print Waybills by Order ID

**GET** `/courier/orders/:orderId/waybills`

Print waybills for an order by Citypak order ID. Returns a PDF file.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `page_size` (optional): `A4` or `4X6` (default: `A4`)
- `per_page_waybill_count` (optional): Number of waybills per page. For A4: 1, 2, or 4. For 4X6: 1. (default: 4)

**Example:**
```
GET /courier/orders/55/waybills?page_size=A4&per_page_waybill_count=4
```

**Response:** PDF file (Content-Type: application/pdf)

### 6. Print Waybills by Tracking Numbers

**GET** `/courier/waybills`

Print waybills for multiple tracking numbers. Returns a PDF file.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `tracking_numbers` (required): Comma-separated list of tracking numbers or array format
- `page_size` (optional): `A4` or `4X6` (default: `A4`)
- `per_page_waybill_count` (optional): Number of waybills per page (default: 4)

**Examples:**
```
GET /courier/waybills?tracking_numbers=D00008987,D00008988
GET /courier/waybills?tracking_numbers[]=D00008987&tracking_numbers[]=D00008988
```

**Response:** PDF file (Content-Type: application/pdf)

### 7. Webhook Endpoint

**POST** `/courier/webhook`

Webhook endpoint for Citypak push API. Citypak will call this endpoint when package status changes.

**Note:** This endpoint does NOT require authentication as it's called by Citypak.

**Request Body Examples:**

**FIRST MILE RECEIVE SCAN:**
```json
{
  "tracking_number": "D00010032",
  "reference": "MI-129496",
  "item_id": "10032",
  "status_type": "UD",
  "status": "FIRST MILE RECEIVE SCAN",
  "action_datetime": "19-06-2024 13:30:59"
}
```

**OUT FOR DELIVERY:**
```json
{
  "tracking_number": "D00010032",
  "reference": "MI-129496",
  "item_id": "10032",
  "status_type": "UD",
  "status": "OUT FOR DELIVERY",
  "action_datetime": "19-06-2024 13:30:59"
}
```

**NOT DELIVERED:**
```json
{
  "tracking_number": "D00010032",
  "reference": "MI-129496",
  "item_id": "10032",
  "status_type": "UD",
  "status": "NOT DELIVERED",
  "reason": "Unable to contact",
  "action_datetime": "19-06-2024 13:30:59"
}
```

**DELIVERED:**
```json
{
  "tracking_number": "D00010032",
  "reference": "MI-129496",
  "item_id": "10032",
  "status_type": "DL",
  "status": "DELIVERED",
  "delivered_datetime": "19-06-2024 13:30:59"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Webhook Setup

To enable webhook notifications from Citypak:

1. Contact your Citypak account coordinator
2. Request access to push API
3. Provide the following details:
   - **Push Endpoint URL:** `https://your-domain.com/courier/webhook`
   - **Push API key:** (Optional - for authentication)
   - **Push API custom headers:** (Optional)

## Database Schema

### Courier Orders Table (`courier_orders`)

Stores courier order information including sender/receiver details and tracking status.

### Courier Tracking History Table (`courier_tracking_history`)

Stores tracking history entries for each order, including status updates, locations, and timestamps.

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
  description: 'Package contents',
});
```

### Track an Order

```typescript
const trackingInfo = await courierTrackingService.trackOrder('D00008987');
console.log('Status:', trackingInfo.isDelivered ? 'Delivered' : 'In Transit');
console.log('History:', trackingInfo.trackingHistory);
```

## Error Handling

### Common Errors

**401 Unauthorized:**
- API token is missing or invalid
- Check your environment variables

**400 Bad Request:**
- Invalid request data
- Missing required fields
- Invalid tracking number

**404 Not Found:**
- Order or tracking number not found
- Check if the order exists in Citypak system

**500 Internal Server Error:**
- Citypak API is unavailable
- Database connection issues
- Check server logs for details

## Migration

To create the database tables, you'll need to run a migration:

```bash
npm run migration:run
```

Or create a new migration file:

```typescript
// Example migration structure
export class CreateCourierTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create courier_orders table
    // Create courier_tracking_history table
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
  }
}
```

## Testing

### Test with Staging Environment

1. Set `NODE_ENV=development` or configure `CITYPAK_STAGING_API_TOKEN`
2. Use the staging URL and token provided by Citypak
3. Test with sample orders

### Test Webhook

You can test the webhook endpoint using curl:

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

## Notes

- All endpoints require JWT authentication except `/courier/webhook`
- Tracking data is automatically synced with Citypak API
- Webhook updates are stored in the tracking history
- Waybill PDFs are generated server-side to keep API tokens secure
- The service supports both staging and production environments

## Support

For issues or questions:
- Check Citypak API documentation
- Review server logs for detailed error messages
- Contact Citypak support for API-related issues

