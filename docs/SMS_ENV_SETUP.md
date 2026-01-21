# SMS Gateway Environment Configuration

## Overview

The SMS Gateway uses Send.lk API service for sending SMS messages, managing contacts, and checking account balance. This guide explains how to configure the SMS API token.

## Required Configuration

### Step 1: Get Your Send.lk API Token

1. **Log in to Send.lk Dashboard**
   - Visit: https://sms.send.lk
   - Log in with your account credentials

2. **Navigate to API Settings**
   - Go to Dashboard
   - Click on "API Settings" or "API Configuration"
   - You'll see your API Endpoint and API Token

3. **Copy Your API Token**
   - The token format is: `{id}|{token}`
   - Example: `1896|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ`
   - Copy the entire token string

### Step 2: Add Token to Environment File

#### For Development

Add to `.env.development` or `.env`:

```env
# ============================================
# SMS Gateway (Send.lk) Configuration
# ============================================
# Get your API token from: https://sms.send.lk (Dashboard -> API Settings)
# Token format: {id}|{token}
# Example: 1896|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ
SENDLK_API_TOKEN=1896|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ
```

#### For Production

Add to `.env.production`:

```env
# ============================================
# SMS Gateway (Send.lk) Configuration
# ============================================
# Production SMS API Token
SENDLK_API_TOKEN=your-production-send-lk-api-token-here
```

### Step 3: Alternative Variable Name

You can also use `SMS_API_TOKEN` instead of `SENDLK_API_TOKEN` (both work):

```env
# Either of these will work:
SENDLK_API_TOKEN=your-token-here
# OR
SMS_API_TOKEN=your-token-here
```

## Environment Variable Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SENDLK_API_TOKEN` | Yes* | Send.lk API token | `1896\|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ` |
| `SMS_API_TOKEN` | No* | Alternative variable name (same as above) | Same as above |

*Required only if you want to use SMS functionality. If not configured, SMS endpoints will log a warning but won't crash the application.

## Token Format

The Send.lk API token follows this format:
```
{account_id}|{token_string}
```

**Example:**
```
1896|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ
```

Where:
- `1896` = Account/API ID
- `|` = Separator (pipe character)
- `K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ` = Token string

## Verification

After adding the token:

1. **Restart your server:**
   ```bash
   npm run start:dev
   ```

2. **Check server logs** - You should see:
   ```
   Send.lk API Service initialized with base URL: https://sms.send.lk/api/v3
   ```

3. **If token is missing**, you'll see a warning:
   ```
   Send.lk API token not configured. SMS service will not work.
   ```

## Testing the Configuration

Once configured, test the SMS service:

```bash
# Check SMS balance
curl -X GET http://localhost:3005/sms/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send a test SMS
curl -X POST http://localhost:3005/sms/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "31612345678",
    "sender_id": "TestSender",
    "message": "Test message"
  }'
```

## Troubleshooting

### Issue: "Send.lk API token not configured" warning

**Solution:**
- Verify the token is in your `.env.development` or `.env.production` file
- Check for typos in the variable name (`SENDLK_API_TOKEN` or `SMS_API_TOKEN`)
- Ensure there are no extra spaces or quotes around the token
- Restart the server after adding the token

### Issue: "401 Unauthorized" errors

**Solution:**
- Verify your API token is correct
- Check if the token has expired (regenerate from Send.lk dashboard)
- Ensure the token format is correct: `{id}|{token}`

### Issue: "Failed to send SMS" errors

**Solution:**
- Check your Send.lk account balance
- Verify the recipient phone number format
- Check sender_id restrictions (max 11 characters for alphanumeric)
- Review Send.lk API documentation for rate limits

## Security Best Practices

1. **Never commit API tokens to Git**
   - `.env` files are in `.gitignore`
   - Use environment variables, not hardcoded tokens

2. **Use different tokens for dev/prod**
   - Create separate Send.lk accounts or API keys
   - Use different tokens in `.env.development` vs `.env.production`

3. **Rotate tokens regularly**
   - Regenerate tokens periodically
   - Revoke old tokens when creating new ones

4. **Monitor usage**
   - Check Send.lk dashboard for unexpected usage
   - Set up alerts for low balance

## Related Documentation

- Complete SMS API Documentation: `docs/SMS_API_DOCUMENTATION.md`
- Quick Reference: `docs/SMS_API_QUICK_REFERENCE.md`
- Environment Setup: `ENV_TEMPLATE.md`
