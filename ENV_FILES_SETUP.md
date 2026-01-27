# Environment Files Setup Guide

## Overview

This project supports environment-specific configuration files. The application will automatically load the appropriate `.env` file based on the `NODE_ENV` environment variable.

## Environment Files

### Development (Default)
- **File:** `.env`
- **NODE_ENV:** `development` or not set
- **Purpose:** Local development configuration

### Production
- **File:** `.env.production`
- **NODE_ENV:** `production`
- **Purpose:** Production server configuration

## Setup Instructions

### Step 1: Create Development Environment File

1. Copy the template below and create a `.env` file in the project root:

```env
# ============================================
# Audrey Wellness Backend - Development Environment
# ============================================
NODE_ENV=development

# Server Configuration
PORT=3005

# Database Configuration
DB_HOST=localhost
DB_PORT=3366
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=audreywellnessdb

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8080

# Email Configuration (App Password Method)
EMAIL_USE_OAUTH2=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password-here
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://localhost:3000

# Courier Service (Citypak) - Staging
CITYPAK_STAGING_URL=https://staging.citypak.lk
CITYPAK_STAGING_API_TOKEN=your-staging-api-token-here
```

### Step 2: Create Production Environment File

1. Create a `.env.production` file in the project root:

```env
# ============================================
# Audrey Wellness Backend - Production Environment
# ============================================
NODE_ENV=production

# Server Configuration
PORT=3005

# Database Configuration (Production)
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USERNAME=your-production-db-username
DB_PASSWORD=your-production-db-password
DB_NAME=audreywellnessdb_prod

# CORS Configuration (Production)
CORS_ORIGINS=http://206.189.82.117:8080,http://206.189.82.117:3003

# Email Configuration (Production - Recommended: OAuth2)
EMAIL_USE_OAUTH2=true
EMAIL_USER=your-production-email@gmail.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://206.189.82.117:8080

# Courier Service (Citypak) - Production
CITYPAK_PRODUCTION_URL=https://falcon.citypak.lk
CITYPAK_PRODUCTION_API_TOKEN=your-production-api-token-here
```

## How It Works

The application automatically loads environment files based on `NODE_ENV`:

1. **Development Mode** (default):
   - Loads `.env` file
   - Used when `NODE_ENV` is not set or set to `development`

2. **Production Mode**:
   - Loads `.env.production` file first
   - Falls back to `.env` file for any missing variables
   - Used when `NODE_ENV=production`

## Running the Application

### Development Mode
```bash
# Default (development)
npm run start:dev

# Or explicitly set
NODE_ENV=development npm run start:dev
```

### Production Mode
```bash
# Set NODE_ENV to production
NODE_ENV=production npm run start:prod

# Or on the server
export NODE_ENV=production
npm run start:prod
```

## Environment Variables Reference

### Required Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `DB_HOST` | ✅ | ✅ | Database host |
| `DB_PORT` | ✅ | ✅ | Database port |
| `DB_USERNAME` | ✅ | ✅ | Database username |
| `DB_PASSWORD` | ✅ | ✅ | Database password |
| `DB_NAME` | ✅ | ✅ | Database name |
| `EMAIL_USER` | ✅ | ✅ | Email sender address |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3005` | Server port |
| `CORS_ORIGINS` | See defaults | Comma-separated allowed origins |
| `EMAIL_USE_OAUTH2` | `false` | Use OAuth2 for email |
| `CITYPAK_STAGING_API_TOKEN` | - | Citypak staging token |
| `CITYPAK_PRODUCTION_API_TOKEN` | - | Citypak production token |
| `SENDLK_API_TOKEN` or `SMS_API_TOKEN` | - | Send.lk SMS API token (format: `{id}|{token}`) |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for email links |

## CORS Configuration

### Development Defaults
- `http://localhost:3000`
- `http://localhost:4200`
- `http://localhost:8080`
- Other localhost variants

### Production Defaults
- `http://206.189.82.117:8080` (Frontend)
- `http://206.189.82.117:3003` (Backend)

### Custom Configuration
Set `CORS_ORIGINS` environment variable (comma-separated, no spaces):
```env
CORS_ORIGINS=http://206.189.82.117:8080,https://your-domain.com
```

## Security Best Practices

1. **Never commit `.env` files to version control**
   - `.env` and `.env.production` are in `.gitignore`
   - Only commit `.env.example` files (if any)

2. **Use strong passwords in production**
   - Generate random, complex passwords
   - Use OAuth2 for email in production (more secure)

3. **Limit CORS origins**
   - Only include trusted domains
   - Don't use wildcards (`*`) in production

4. **Rotate credentials regularly**
   - Change API tokens periodically
   - Update passwords regularly

5. **Use environment-specific values**
   - Never use production credentials in development
   - Use separate database instances

## Troubleshooting

### Issue: Environment variables not loading

**Solution:**
- Check that `.env` or `.env.production` file exists in project root
- Verify `NODE_ENV` is set correctly
- Restart the server after changing environment files

### Issue: CORS errors in production

**Solution:**
1. Check that production frontend URL is in `CORS_ORIGINS`
2. Verify the URL matches exactly (including http/https, port)
3. Check server logs for CORS warnings
4. Restart server after updating CORS configuration

### Issue: Database connection fails

**Solution:**
- Verify database credentials in `.env.production`
- Check database host/port are accessible
- Ensure database exists
- Check firewall rules

## Example .env Files

See the templates above, or refer to:
- Development setup: `ENV_SETUP_INSTRUCTIONS.md`
- Email setup: `docs/EMAIL_SETUP.md`
- Courier API setup: `docs/COURIER_TRACKING_API.md`

## Quick Start

1. **Development:**
   ```bash
   cp .env.example .env  # If .env.example exists
   # Edit .env with your local settings
   npm run start:dev
   ```

2. **Production:**
   ```bash
   # Create .env.production on server
   # Edit with production values
   NODE_ENV=production npm run start:prod
   ```

