# SMS Gateway API Documentation

This document describes the SMS Gateway API endpoints integrated with Send.lk-SMS service.

## Base URL

All SMS endpoints are prefixed with: `/sms`

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Environment Configuration

Add the following to your `.env` or `.env.development` file:

```env
SENDLK_API_TOKEN=your-send-lk-api-token-here
# OR
SMS_API_TOKEN=your-send-lk-api-token-here
```

---

## SMS Endpoints

### 1. Send SMS

Send an outbound SMS message.

**Endpoint:** `POST /sms/send`

**Request Body:**
```json
{
  "recipient": "31612345678",
  "sender_id": "YourName",
  "message": "This is a test message"
}
```

**Response:**
```json
{
  "status": "success",
  "data": "sms reports with all details"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "A human-readable description of the error."
}
```

---

### 2. View an SMS

Retrieve information about a specific SMS message by UID.

**Endpoint:** `GET /sms/messages/:uid`

**Path Parameters:**
- `uid` (string, required) - The unique message UID returned when SMS was sent

**Response:**
```json
{
  "status": "success",
  "data": "sms data with all details"
}
```

---

### 3. View All SMS Messages

Retrieve all SMS messages with pagination.

**Endpoint:** `GET /sms/messages`

**Response:**
```json
{
  "status": "success",
  "data": "sms reports with pagination"
}
```

---

## Contact Groups Endpoints

### 1. Create a Contact Group

Create a new contact group.

**Endpoint:** `POST /sms/contact-groups`

**Request Body:**
```json
{
  "name": "Customer Group"
}
```

**Response:**
```json
{
  "status": "success",
  "data": "group data with all details"
}
```

---

### 2. View a Contact Group

Retrieve information about a specific contact group.

**Endpoint:** `GET /sms/contact-groups/:group_id`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)

**Response:**
```json
{
  "status": "success",
  "data": "group data with all details"
}
```

---

### 3. Update a Contact Group

Update an existing contact group.

**Endpoint:** `PATCH /sms/contact-groups/:group_id`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)

**Request Body:**
```json
{
  "name": "Updated Group Name"
}
```

**Response:**
```json
{
  "status": "success",
  "data": "groups data with all details"
}
```

---

### 4. Delete a Contact Group

Delete a contact group.

**Endpoint:** `DELETE /sms/contact-groups/:group_id`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)

**Response:**
```json
{
  "status": "success",
  "data": null
}
```

---

### 5. View All Contact Groups

Retrieve all contact groups with pagination.

**Endpoint:** `GET /sms/contact-groups`

**Response:**
```json
{
  "status": "success",
  "data": "group data with pagination"
}
```

---

## Contacts Endpoints

### 1. Create a Contact

Create a new contact in a specific group.

**Endpoint:** `POST /sms/contact-groups/:group_id/contacts`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)

**Request Body:**
```json
{
  "phone": 31612345678,
  "first_name": "John",
  "last_name": "Doe"
}
```

**Note:** `first_name` and `last_name` are optional.

**Response:**
```json
{
  "status": "success",
  "data": "contacts data with all details"
}
```

---

### 2. View a Contact

Retrieve information about a specific contact.

**Endpoint:** `GET /sms/contact-groups/:group_id/contacts/:uid`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)
- `uid` (string, required) - The unique contact UID

**Response:**
```json
{
  "status": "success",
  "data": "contacts data with all details"
}
```

---

### 3. Update a Contact

Update an existing contact.

**Endpoint:** `PATCH /sms/contact-groups/:group_id/contacts/:uid`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)
- `uid` (string, required) - The unique contact UID

**Request Body:**
```json
{
  "phone": 31612345678,
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Note:** `first_name` and `last_name` are optional, but `phone` is required.

**Response:**
```json
{
  "status": "success",
  "data": "contacts data with all details"
}
```

---

### 4. Delete a Contact

Delete a contact from a group.

**Endpoint:** `DELETE /sms/contact-groups/:group_id/contacts/:uid`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)
- `uid` (string, required) - The unique contact UID

**Response:**
```json
{
  "status": "success",
  "data": "contacts data with all details"
}
```

---

### 5. View All Contacts in a Group

Retrieve all contacts in a specific group with pagination.

**Endpoint:** `GET /sms/contact-groups/:group_id/contacts`

**Path Parameters:**
- `group_id` (string, required) - The unique group ID (UID)

**Response:**
```json
{
  "status": "success",
  "data": "contacts data with pagination"
}
```

---

## Profile Endpoints

### 1. View SMS Balance

Retrieve remaining SMS units and account balance.

**Endpoint:** `GET /sms/balance`

**Response:**
```json
{
  "status": "success",
  "data": "sms unit with all details"
}
```

---

### 2. View Profile

Retrieve account profile information.

**Endpoint:** `GET /sms/profile`

**Response:**
```json
{
  "status": "success",
  "data": "profile data with all details"
}
```

---

## Error Handling

All endpoints return a consistent error response format:

```json
{
  "status": "error",
  "message": "A human-readable description of the error."
}
```

Common error scenarios:
- **400 Bad Request**: Invalid request parameters or missing required fields
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Resource not found (e.g., invalid group_id or uid)
- **500 Internal Server Error**: Server-side error or Send.lk API error

---

## Example Usage

### Send SMS

```bash
curl -X POST http://localhost:3005/sms/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "31612345678",
    "sender_id": "AudreyWellness",
    "message": "Hello from Audrey Wellness!"
  }'
```

### Create Contact Group

```bash
curl -X POST http://localhost:3005/sms/contact-groups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customers"
  }'
```

### Create Contact

```bash
curl -X POST http://localhost:3005/sms/contact-groups/GROUP_ID/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": 31612345678,
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Check SMS Balance

```bash
curl -X GET http://localhost:3005/sms/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes

1. **Phone Number Format**: Phone numbers should be provided as numbers (without leading + or country code prefix if not required by Send.lk).

2. **Sender ID**: The `sender_id` for SMS must be:
   - A telephone number (including country code), OR
   - An alphanumeric string (max 11 characters)

3. **API Token**: The Send.lk API token must be configured in your environment variables (`SENDLK_API_TOKEN` or `SMS_API_TOKEN`).

4. **Rate Limiting**: Be aware of Send.lk's rate limiting policies. Check their documentation for details.

5. **Error Responses**: Errors from the Send.lk API are passed through to the client with appropriate HTTP status codes.
