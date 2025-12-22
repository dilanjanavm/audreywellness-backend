# Email Service API Documentation

**⭐ NEW** - Newly added endpoints  
**🔄 UPDATED** - Recently updated endpoints

## Base URL
```
http://localhost:3003
```

---

## Table of Contents
1. [Email Service APIs](#email-service-apis)
   - [Get Email Service Status](#1-get-email-service-status)
   - [Verify Email Connection](#2-verify-email-connection)
   - [Send Test Email](#3-send-test-email)
2. [User Creation with Email](#user-creation-with-email)
   - [Create User (Sends Welcome Email)](#create-user-sends-welcome-email)
3. [Customer Creation with Email](#customer-creation-with-email)
   - [Create Customer (Sends Welcome Email)](#create-customer-sends-welcome-email)
4. [Email Configuration](#email-configuration)
5. [Error Responses](#error-responses)

---

## Email Service APIs

### 1. Get Email Service Status

Check the current status and configuration of the email service.

**Endpoint:** `GET /email/status`

**Request Headers:**
```
Content-Type: application/json
```

**Example Request:**
```bash
GET /email/status
```

**Response (Success - 200):**
```json
{
  "message": "Email service status",
  "data": {
    "initialized": true,
    "configured": true
  }
}
```

**Response Fields:**
- `initialized` (boolean): Whether the email transporter has been initialized
- `configured` (boolean): Whether all required environment variables are configured

**Example Response (Not Configured):**
```json
{
  "message": "Email service status",
  "data": {
    "initialized": false,
    "configured": false
  }
}
```

---

### 2. Verify Email Connection

Verify that the email service can successfully connect to the email server (Gmail SMTP).

**Endpoint:** `GET /email/verify`

**Request Headers:**
```
Content-Type: application/json
```

**Example Request:**
```bash
GET /email/verify
```

**Response (Success - 200):**
```json
{
  "message": "Email service connection verified",
  "data": {
    "connected": true
  }
}
```

**Response (Connection Failed - 200):**
```json
{
  "message": "Email service connection failed",
  "data": {
    "connected": false
  }
}
```

**Response Fields:**
- `connected` (boolean): Whether the connection to the email server was successful

**Notes:**
- This endpoint tests the SMTP connection and authentication
- If connection fails, check your email credentials in the `.env` file
- Common issues: Invalid credentials, network problems, or firewall blocking SMTP port

---

### 3. Send Test Email

Send a test email to verify the email service is working correctly.

**Endpoint:** `POST /email/test`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": "recipient@example.com"
}
```

**Request Body Fields:**
- `to` (string, required): Email address of the recipient

**Example Request:**
```bash
POST /email/test
Content-Type: application/json

{
  "to": "test@example.com"
}
```

**Response (Success - 200):**
```json
{
  "message": "Test email sent successfully",
  "data": {
    "sent": true,
    "recipient": "test@example.com"
  }
}
```

**Response (Failed - 200):**
```json
{
  "message": "Failed to send test email",
  "data": {
    "sent": false,
    "recipient": "test@example.com"
  }
}
```

**Response Fields:**
- `sent` (boolean): Whether the email was sent successfully
- `recipient` (string): The email address the test email was sent to

**Test Email Content:**
The test email contains:
- Subject: "Test Email from Audrey Wellness"
- Body: A simple HTML message confirming the email service is working
- Timestamp: Current date and time

---

## User Creation with Email

### Create User (Sends Welcome Email)

When creating a user, a welcome email is automatically sent with account credentials.

**Endpoint:** `POST /users`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userName": "john_doe",
  "email": "john.doe@example.com",
  "mobileNumber": "1234567890",           // optional
  "address": "123 Main Street, City",     // optional
  "contactNumber": "1234567890",
  "age": 30,                              // optional
  "gender": "MALE",                       // optional: "MALE" | "FEMALE" | "OTHER"
  "roleId": "uuid-of-role",               // optional
  "permissionIds": ["uuid1", "uuid2"],    // optional
  "password": "custom-password",          // optional - will generate if not provided
  "sendEmail": true                       // optional, default: true
}
```

**Request Body Fields:**
- `userName` (string, required): Username for the new user
- `email` (string, required): Email address (also used as login username)
- `contactNumber` (string, required): Contact phone number
- `mobileNumber` (string, optional): Mobile phone number
- `address` (string, optional): Physical address
- `age` (number, optional): User's age
- `gender` (string, optional): User's gender ("MALE", "FEMALE", "OTHER")
- `roleId` (string, optional): UUID of the role to assign
- `permissionIds` (string[], optional): Array of permission UUIDs
- `password` (string, optional): Custom password (if not provided, a temporary password is generated)
- `sendEmail` (boolean, optional): Whether to send welcome email (default: `true`)

**Example Request:**
```bash
POST /users
Content-Type: application/json

{
  "userName": "john_doe",
  "email": "john.doe@example.com",
  "contactNumber": "1234567890",
  "sendEmail": true
}
```

**Response (Success - 201):**
```json
{
  "message": "User created successfully. Credentials sent via email.",
  "data": {
    "id": "user-uuid-1234",
    "userName": "john_doe",
    "email": "john.doe@example.com",
    "mobileNumber": null,
    "address": null,
    "contactNumber": "1234567890",
    "age": null,
    "gender": null,
    "roleId": null,
    "isActive": true,
    "isEmailVerified": false,
    "mustChangePassword": true,
    "createdAt": "2025-12-13T10:30:00.000Z",
    "updatedAt": "2025-12-13T10:30:00.000Z"
  }
}
```

**Welcome Email Content:**
When `sendEmail` is `true` (default), the following email is sent:

- **Subject**: "Welcome to Audrey Wellness - Your Account Credentials"
- **Recipient**: The email address provided in the request
- **Content**:
  - Welcome message with user's name
  - Login credentials:
    - Username (Email): The email address
    - Temporary Password: Auto-generated or provided password
  - Security notice about changing password on first login
  - Login button linking to the frontend login page
  - Support contact information

**Email Sending Behavior:**
- If `sendEmail` is `false`, no email is sent
- If email sending fails, the user is still created (error is logged)
- In development mode, if email fails, credentials are logged to console

---

## Customer Creation with Email

### Create Customer (Sends Welcome Email)

When creating a customer, a welcome email is automatically sent with customer account details.

**Endpoint:** `POST /customers`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sNo": "1",                              // optional - will be auto-generated if not provided
  "name": "John Doe Company",
  "shortName": "John Doe Co",
  "phone": "1234567890",                   // optional
  "branchName": "Main Branch",
  "cityArea": "Colombo",
  "email": "john.doe@example.com",         // optional - required for email sending
  "smsPhone": "1234567890",
  "currency": "LKR",                       // optional, default: "LKR"
  "salesType": "RETAIL",                   // optional
  "paymentTerms": "COD_IML",               // optional
  "dob": "1990-01-01",                     // optional
  "address": "123 Main Street",            // optional
  "status": "ACTIVE",                      // optional, default: "ACTIVE"
  "salesGroup": "General",
  "customerType": "INDIVIDUAL",            // optional
  "sendEmail": true                        // optional, default: true
}
```

**Request Body Fields:**
- `name` (string, required): Full customer/business name
- `shortName` (string, required): Short name/identifier
- `branchName` (string, required): Branch name
- `cityArea` (string, required): City/Area
- `smsPhone` (string, required): SMS phone number
- `salesGroup` (string, required): Sales Group/Category
- `sNo` (string, optional): Customer number (auto-generated if not provided)
- `phone` (string, optional): Phone number
- `email` (string, optional): Email address (required for email sending)
- `currency` (string, optional): Currency code (default: "LKR")
- `salesType` (string, optional): Sales type (e.g., "RETAIL", "WHOLESALE")
- `paymentTerms` (string, optional): Payment terms (e.g., "COD_IML")
- `dob` (date, optional): Date of birth or establishment
- `address` (string, optional): Physical address
- `status` (string, optional): Status (default: "ACTIVE")
- `customerType` (string, optional): Customer type (e.g., "INDIVIDUAL", "BUSINESS")
- `sendEmail` (boolean, optional): Whether to send welcome email (default: `true`)

**Example Request:**
```bash
POST /customers
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe Company",
  "shortName": "John Doe Co",
  "branchName": "Main Branch",
  "cityArea": "Colombo",
  "email": "john.doe@example.com",
  "smsPhone": "1234567890",
  "salesGroup": "General",
  "sendEmail": true
}
```

**Response (Success - 201):**
```json
{
  "id": "customer-uuid-1234",
  "sNo": "1",
  "name": "John Doe Company",
  "shortName": "John Doe Co",
  "branchName": "Main Branch",
  "cityArea": "Colombo",
  "email": "john.doe@example.com",
  "smsPhone": "1234567890",
  "currency": "LKR",
  "salesType": "RETAIL",
  "paymentTerms": "COD_IML",
  "dob": null,
  "address": null,
  "status": "ACTIVE",
  "salesGroup": "General",
  "customerType": "INDIVIDUAL",
  "createdAt": "2025-12-13T10:30:00.000Z",
  "updatedAt": "2025-12-13T10:30:00.000Z"
}
```

**Welcome Email Content:**
When `sendEmail` is `true` (default) and `email` is provided, the following email is sent:

- **Subject**: "Welcome to Audrey Wellness - Your Customer Account"
- **Recipient**: The email address provided in the request
- **Content**:
  - Welcome message with customer's name
  - Customer account details:
    - Customer Name
    - Customer Number (sNo)
    - Contact Phone (if provided)
  - Information about what's next
  - Link to visit the website
  - Support contact information

**Email Sending Behavior:**
- If `sendEmail` is `false`, no email is sent
- If `email` is not provided, no email is sent (warning is logged)
- If email sending fails, the customer is still created (error is logged)
- In development mode, if email fails, customer details are logged to console

---

## Email Configuration

The email service supports two authentication methods:

### Method 1: Google OAuth2 (Recommended)

**Environment Variables:**
```env
EMAIL_USE_OAUTH2=true
EMAIL_USER=your-email@gmail.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

### Method 2: App Password (Simpler)

**Environment Variables:**
```env
EMAIL_USE_OAUTH2=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

### Optional Configuration

```env
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://localhost:3000
```

**Configuration Notes:**
- `EMAIL_USER`: The Gmail address to send emails from
- `EMAIL_FROM_NAME`: Display name shown in email "From" field
- `EMAIL_REPLY_TO`: Email address for replies (optional)
- `FRONTEND_URL`: Base URL for links in emails (e.g., login button)

For detailed setup instructions, see:
- Quick Setup: `docs/GOOGLE_EMAIL_SETUP.md`
- Full Guide: `docs/EMAIL_SETUP.md`

---

## Error Responses

### 400 Bad Request

**Invalid Email Address:**
```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request"
}
```

**Missing Required Field:**
```json
{
  "statusCode": 400,
  "message": ["to must be an email", "to should not be empty"],
  "error": "Bad Request"
}
```

### 500 Internal Server Error

**Email Service Not Configured:**
```json
{
  "statusCode": 500,
  "message": "Email transporter could not be initialized",
  "error": "Internal Server Error"
}
```

**Email Sending Failed:**
```json
{
  "statusCode": 500,
  "message": "Failed to send email: Authentication failed",
  "error": "Internal Server Error"
}
```

### Common Error Codes

- **EAUTH**: Authentication failed - Check your email credentials
- **ECONNECTION**: Connection failed - Check network and SMTP settings
- **ETIMEDOUT**: Connection timeout - Check firewall settings

---

## Usage Examples

### Example 1: Check Email Service Status

```bash
# Check if email service is configured and ready
curl -X GET http://localhost:3003/email/status
```

### Example 2: Verify Email Connection

```bash
# Test the connection to Gmail SMTP
curl -X GET http://localhost:3003/email/verify
```

### Example 3: Send Test Email

```bash
# Send a test email
curl -X POST http://localhost:3003/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### Example 4: Create User with Email

```bash
# Create a new user (email will be sent automatically)
curl -X POST http://localhost:3003/users \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "jane_smith",
    "email": "jane.smith@example.com",
    "contactNumber": "9876543210",
    "sendEmail": true
  }'
```

### Example 5: Create User Without Email

```bash
# Create a new user without sending email
curl -X POST http://localhost:3003/users \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "jane_smith",
    "email": "jane.smith@example.com",
    "contactNumber": "9876543210",
    "sendEmail": false
  }'
```

### Example 6: Create Customer with Email

```bash
# Create a new customer (email will be sent automatically)
curl -X POST http://localhost:3003/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "John Doe Company",
    "shortName": "John Doe Co",
    "branchName": "Main Branch",
    "cityArea": "Colombo",
    "email": "john.doe@example.com",
    "smsPhone": "1234567890",
    "salesGroup": "General",
    "sendEmail": true
  }'
```

### Example 7: Create Customer Without Email

```bash
# Create a new customer without sending email
curl -X POST http://localhost:3003/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Jane Smith Ltd",
    "shortName": "Jane Smith",
    "branchName": "Main Branch",
    "cityArea": "Kandy",
    "email": "jane.smith@example.com",
    "smsPhone": "9876543210",
    "salesGroup": "General",
    "sendEmail": false
  }'
```

---

## Notes

1. **Email Service Initialization**: The email service initializes automatically when the application starts
2. **Authentication Methods**: OAuth2 is recommended for production, App Password is simpler for development
3. **Error Handling**: Email sending failures don't prevent user creation (errors are logged)
4. **Development Mode**: In development, if email fails, credentials are logged to console
5. **Password Generation**: If no password is provided, a secure 12-character temporary password is generated
6. **Email Templates**: Welcome emails use HTML templates with styling
7. **Security**: Never commit `.env` file with credentials to version control

---

## Troubleshooting

### Email Service Not Initialized

**Problem**: `initialized: false` in status response

**Solutions**:
1. Check that all required environment variables are set
2. Restart the application after adding environment variables
3. Verify `.env` file is in the project root

### Connection Verification Fails

**Problem**: `connected: false` in verify response

**Solutions**:
1. Verify email credentials are correct
2. For OAuth2: Check that refresh token is valid
3. For App Password: Ensure 2-Step Verification is enabled and app password is correct
4. Check network connectivity and firewall settings

### Test Email Not Received

**Problem**: Test email endpoint returns success but email not received

**Solutions**:
1. Check spam/junk folder
2. Verify recipient email address is correct
3. Check email service logs for detailed error messages
4. Verify sender email address is authorized to send emails

### Authentication Errors

**Problem**: EAUTH error when sending emails

**Solutions**:
1. **OAuth2**: Regenerate refresh token
2. **App Password**: Generate a new app password from Google Account settings
3. Verify `EMAIL_USER` matches the authorized account

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-13  
**Generated For:** Frontend Development Team

