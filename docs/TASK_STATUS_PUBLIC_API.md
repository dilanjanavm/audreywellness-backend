# Task Status Public API

## Overview

This document describes the public endpoint for checking task status by order number. This endpoint does **not require authentication** and is designed for customer-facing order tracking.

---

## Endpoint

### Get Task Status by Order Number

**Endpoint:** `GET /api/tasks/public/status/:orderNumber`

**Authentication:** ❌ Not required (Public endpoint)

**Description:** Retrieves the current status of a task by its order number. This endpoint is designed for customers to track their orders without requiring authentication.

---

## Request

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderNumber` | string | ✅ Yes | The order number to search for |

### Example Request

```bash
GET /api/tasks/public/status/232323
```

```bash
curl -X GET "http://localhost:3005/api/tasks/public/status/232323"
```

---

## Response

### Success Response (200 OK)

```json
{
  "data": {
    "orderNumber": "232323",
    "taskId": "TASK-1768758978156-Q3DVVWATR",
    "task": "Pack order ORD-2024-002",
    "status": "pending",
    "phase": {
      "id": "660e8400-e29b-41d4-a716-446655440010",
      "name": "Filling & Packing"
    },
    "customerName": "Vas Ceylone (Pvt) LTD",
    "customerMobile": "0777622051",
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-25T14:30:00.000Z",
    "dueDate": "2026-01-30T18:00:00.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderNumber` | string | The order number |
| `taskId` | string | Unique task identifier |
| `task` | string | Task title/description |
| `status` | string | Current task status (see [Status Values](#status-values)) |
| `phase` | object | Current phase information |
| `phase.id` | string | Phase UUID |
| `phase.name` | string | Phase name (e.g., "R&D", "Blending", "Filling & Packing", "Dispatch") |
| `customerName` | string \| undefined | Customer name (if available) |
| `customerMobile` | string \| undefined | Customer mobile number (if available) |
| `createdAt` | string (ISO 8601) | Task creation timestamp |
| `updatedAt` | string (ISO 8601) | Last update timestamp |
| `dueDate` | string (ISO 8601) \| undefined | Task due date (if set) |

### Status Values

The `status` field can be one of the following values:

- `pending` - Task is pending
- `in_progress` - Task is in progress
- `completed` - Task is completed
- `on_hold` - Task is on hold
- `cancelled` - Task is cancelled

---

## Error Responses

### 400 Bad Request

**When:** Order number is missing or empty

```json
{
  "statusCode": 400,
  "message": "Order number is required",
  "error": "Bad Request"
}
```

### 404 Not Found

**When:** No task found with the provided order number

```json
{
  "statusCode": 404,
  "message": "No task found for order number: 232323",
  "error": "Not Found"
}
```

---

## Use Cases

1. **Customer Order Tracking**: Customers can check their order status by entering their order number
2. **Public Status Page**: Can be embedded in a public-facing order tracking page
3. **SMS/Email Integration**: Can be used in automated notifications to provide order status links

---

## Implementation Notes

- The endpoint searches for tasks by `orderNumber` field
- If multiple tasks exist with the same order number, the most recent one (by creation date) is returned
- The endpoint does not require authentication, making it suitable for public access
- All sensitive information (like internal task IDs, assignees, etc.) is excluded from the response

---

## Example Integration

### Frontend (React/Next.js)

```typescript
async function checkOrderStatus(orderNumber: string) {
  try {
    const response = await fetch(
      `http://localhost:3005/api/tasks/public/status/${orderNumber}`
    );
    
    if (!response.ok) {
      throw new Error('Order not found');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error checking order status:', error);
    throw error;
  }
}
```

### Frontend (HTML/JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Order Status Check</title>
</head>
<body>
  <h1>Check Your Order Status</h1>
  <input type="text" id="orderNumber" placeholder="Enter order number">
  <button onclick="checkStatus()">Check Status</button>
  <div id="result"></div>

  <script>
    async function checkStatus() {
      const orderNumber = document.getElementById('orderNumber').value;
      const resultDiv = document.getElementById('result');
      
      try {
        const response = await fetch(
          `http://localhost:3005/api/tasks/public/status/${orderNumber}`
        );
        
        if (!response.ok) {
          resultDiv.innerHTML = '<p>Order not found</p>';
          return;
        }
        
        const result = await response.json();
        const data = result.data;
        
        resultDiv.innerHTML = `
          <h2>Order Status: ${data.status}</h2>
          <p>Order Number: ${data.orderNumber}</p>
          <p>Phase: ${data.phase.name}</p>
          <p>Created: ${new Date(data.createdAt).toLocaleDateString()}</p>
          ${data.dueDate ? `<p>Due Date: ${new Date(data.dueDate).toLocaleDateString()}</p>` : ''}
        `;
      } catch (error) {
        resultDiv.innerHTML = '<p>Error checking order status</p>';
      }
    }
  </script>
</body>
</html>
```

---

## Security Considerations

- This endpoint is **public** and does not require authentication
- Only non-sensitive information is returned (no internal IDs, assignee details, etc.)
- Consider implementing rate limiting to prevent abuse
- Consider adding CAPTCHA for public-facing forms that use this endpoint

---

## Related Endpoints

- `GET /api/tasks/:taskId` - Get full task details (requires authentication)
- `GET /api/tasks/phases` - List all task phases (requires authentication)

---

**Last Updated:** 2026-01-25
