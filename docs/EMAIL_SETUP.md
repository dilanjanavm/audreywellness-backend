# Email Service Setup Guide

This guide explains how to configure the Google email service for sending emails when users are created.

> **Quick Start**: If you already have OAuth2 credentials, see [GOOGLE_EMAIL_SETUP.md](./GOOGLE_EMAIL_SETUP.md) for a faster setup guide.

## Overview

The email service supports two authentication methods:
1. **Google OAuth2** (Recommended - More Secure)
2. **App Password** (Simpler setup)

## Method 1: Google OAuth2 (Recommended)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in required fields (App name, User support email, etc.)
   - Add your email to test users
   - Save and continue
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Audrey Wellness Email Service"
   - Authorized redirect URIs: `http://localhost:3000` (for testing)
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

### Step 3: Generate Refresh Token

You need to generate a refresh token using the OAuth2 credentials. You can use this Node.js script:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000' // Redirect URI
);

const scopes = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('Refresh Token:', token.refresh_token);
    rl.close();
  });
});
```

Or use an online tool like [Google OAuth Playground](https://developers.google.com/oauthplayground/):
1. Click the gear icon (⚙️) in the top right
2. Check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In the left panel, find "Gmail API v1" > "https://www.googleapis.com/auth/gmail.send"
5. Click "Authorize APIs"
6. After authorization, click "Exchange authorization code for tokens"
7. Copy the **Refresh token**

### Step 4: Configure Environment Variables

Add these to your `.env` file:

```env
# Email Configuration - OAuth2 Method
EMAIL_USE_OAUTH2=true
EMAIL_USER=your-email@gmail.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token

# Optional
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://localhost:3000
```

## Method 2: App Password (Simpler)

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password

1. Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Enter "Audrey Wellness" as the name
4. Click "Generate"
5. Copy the 16-character password (spaces will be removed automatically)

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Email Configuration - App Password Method
EMAIL_USE_OAUTH2=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password

# Optional
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://localhost:3000
```

## Testing the Email Service

### 1. Check Email Service Status

```bash
GET /email/status
```

Response:
```json
{
  "message": "Email service status",
  "data": {
    "initialized": true,
    "configured": true
  }
}
```

### 2. Verify Email Connection

```bash
GET /email/verify
```

Response:
```json
{
  "message": "Email service connection verified",
  "data": {
    "connected": true
  }
}
```

### 3. Send Test Email

```bash
POST /email/test
Content-Type: application/json

{
  "to": "test@example.com"
}
```

### 4. Create User (Automatic Email)

When you create a user, an email will be automatically sent:

```bash
POST /users
Content-Type: application/json

{
  "userName": "john_doe",
  "email": "john@example.com",
  "contactNumber": "1234567890",
  "sendEmail": true
}
```

## Troubleshooting

### Authentication Failed (EAUTH)

- **OAuth2 Method**: Verify your Client ID, Client Secret, and Refresh Token are correct
- **App Password Method**: 
  - Ensure 2-Step Verification is enabled
  - Generate a new App Password
  - Make sure there are no spaces in the password

### Connection Failed (ECONNECTION)

- Check your internet connection
- Verify SMTP settings (host, port)
- Check firewall settings
- For Gmail, ensure "Less secure app access" is not required (use App Password instead)

### Email Not Sending

1. Check the application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test the email service using the `/email/test` endpoint
4. Check spam folder for test emails

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use OAuth2** in production for better security
3. **Rotate credentials** periodically
4. **Use environment-specific** email accounts for development/staging/production
5. **Monitor email sending** for unusual activity

## Environment Variables Summary

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EMAIL_USE_OAUTH2` | No | Use OAuth2 (true) or App Password (false) | `true` |
| `EMAIL_USER` | Yes | Gmail address to send from | `noreply@example.com` |
| `EMAIL_HOST` | No* | SMTP host (required for App Password) | `smtp.gmail.com` |
| `EMAIL_PORT` | No* | SMTP port (required for App Password) | `587` |
| `EMAIL_PASSWORD` | No* | App Password (required for App Password method) | `abcd efgh ijkl mnop` |
| `GOOGLE_CLIENT_ID` | No* | OAuth2 Client ID (required for OAuth2) | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No* | OAuth2 Client Secret (required for OAuth2) | `xxx` |
| `GOOGLE_REFRESH_TOKEN` | No* | OAuth2 Refresh Token (required for OAuth2) | `xxx` |
| `EMAIL_FROM_NAME` | No | Display name for sender | `Audrey Wellness` |
| `EMAIL_REPLY_TO` | No | Reply-to email address | `support@example.com` |
| `FRONTEND_URL` | No | Frontend URL for email links | `https://app.example.com` |

*Required based on the authentication method chosen.

