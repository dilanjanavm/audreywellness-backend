# Development Environment Setup Guide

This guide explains how to set up and use the `.env.development` file for local development.

## Overview

The application supports environment-specific configuration files:
- **`.env`** - Base environment file (loaded first, fallback)
- **`.env.development`** - Development-specific overrides (loaded when `NODE_ENV=development`)
- **`.env.production`** - Production-specific overrides (loaded when `NODE_ENV=production`)

## Quick Start

### Step 1: Create Development Environment File

1. Copy the example file:
   ```bash
   cp .env.development.example .env.development
   ```

2. Open `.env.development` in your editor:
   ```bash
   # On Windows
   notepad .env.development

   # On Mac/Linux
   nano .env.development
   # or
   code .env.development
   ```

3. Update the values with your local development settings (database credentials, ports, etc.)

### Step 2: Set NODE_ENV (if not in file)

The `.env.development` file should have `NODE_ENV=development`. If you want to set it manually:

**Windows (Command Prompt):**
```cmd
set NODE_ENV=development
```

**Windows (PowerShell):**
```powershell
$env:NODE_ENV="development"
```

**Mac/Linux:**
```bash
export NODE_ENV=development
```

### Step 3: Run the Server

```bash
# Development mode (with hot reload)
npm run start:dev

# Or explicitly set environment
NODE_ENV=development npm run start:dev
```

## How Environment Files Work

The application loads environment files in this order:

1. **`.env`** - Loaded first (base configuration)
2. **`.env.development`** or **`.env.production`** - Loaded second (overrides `.env`)

Values in the environment-specific file will override values in `.env`.

### Example

**`.env`** (base):
```env
PORT=3005
DB_HOST=localhost
DB_PORT=3306
```

**`.env.development`** (override):
```env
NODE_ENV=development
DB_PORT=3366  # This overrides the .env value
```

**Result:** Server runs on port 3005, database on port 3366

## Required Configuration

### Database Configuration

Update these values to match your local MySQL setup:

```env
DB_HOST=localhost
DB_PORT=3366              # Your local MySQL port
DB_USERNAME=root          # Your MySQL username
DB_PASSWORD=your_password # Your MySQL password
DB_NAME=audreywellnessdb  # Your database name
```

### Server Configuration

```env
PORT=3005                 # Backend server port
NODE_ENV=development      # Environment mode
```

### JWT Configuration

```env
JWT_SECRET=your-development-jwt-secret-key
JWT_EXPIRES_IN=1d        # Token expiration (1 day)
```

## Optional Configuration

### CORS Configuration

Add your frontend development URLs:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8080
```

### Email Configuration

For development, you can use Gmail App Password or OAuth2:

**Option 1: App Password (Simpler)**
```env
EMAIL_USE_OAUTH2=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

**Option 2: OAuth2 (More Secure)**
```env
EMAIL_USE_OAUTH2=true
EMAIL_USER=your-email@gmail.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

### Courier Service Configuration

If you're testing courier integration:

```env
CITYPAK_STAGING_URL=https://staging.citypak.lk
CITYPAK_STAGING_API_TOKEN=your-staging-token
```

### SMS Gateway Configuration

To use SMS functionality (Send.lk integration):

```env
# Get your API token from: https://sms.send.lk (Dashboard -> API Settings)
# Token format: {id}|{token} (e.g., 1896|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ)
SENDLK_API_TOKEN=your-send-lk-api-token-here
# Alternative variable name (both work):
# SMS_API_TOKEN=your-send-lk-api-token-here
```

**How to get your Send.lk API token:**
1. Log in to https://sms.send.lk
2. Go to Dashboard -> API Settings
3. Copy your API token (format: `{id}|{token}`)
4. Paste it in your `.env.development` file

## Running Commands

### Start Development Server

```bash
# Standard development mode
npm run start:dev

# With explicit environment
NODE_ENV=development npm run start:dev

# Using cross-env (cross-platform)
npx cross-env NODE_ENV=development npm run start:dev
```

### Start Production Build (for testing)

```bash
# Build first
npm run build

# Then start
NODE_ENV=production npm run start:prod
```

### Run Database Seeder

The seeder runs automatically on startup, but you can also run it manually:

```bash
npm run seed
```

## Verification

After starting the server, you should see:

```
🔧 Environment: development
📄 Loaded environment files: .env, .env.development
🔍 Current NODE_ENV: development
🌐 CORS Allowed Origins: [...]
✅ Database seeding completed successfully!
🚀 Application is running on:3005
```

## Troubleshooting

### Issue: `.env.development` not loading

**Solution:** Make sure:
1. File is named exactly `.env.development` (not `.env.development.txt`)
2. File is in the project root (same directory as `package.json`)
3. `NODE_ENV=development` is set

### Issue: Database connection fails

**Solution:** 
1. Check your MySQL server is running
2. Verify database credentials in `.env.development`
3. Ensure database exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS audreywellnessdb;
   ```

### Issue: Port already in use

**Solution:** Change the port in `.env.development`:
```env
PORT=3006  # Or any available port
```

### Issue: CORS errors

**Solution:** Add your frontend URL to `CORS_ORIGINS`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
```

## File Structure

```
project-root/
├── .env                      # Base environment (optional, for defaults)
├── .env.development          # Development overrides
├── .env.development.example  # Example template
├── .env.production           # Production overrides
├── src/
├── package.json
└── ...
```

## Security Notes

⚠️ **Important:**
- Never commit `.env.development` to Git (it's in `.gitignore`)
- Use `.env.development.example` as a template for team members
- Don't use production credentials in development
- Use strong, unique JWT secrets for each environment

## Next Steps

1. ✅ Create `.env.development` from example
2. ✅ Update database credentials
3. ✅ Configure optional services (email, courier)
4. ✅ Start development server: `npm run start:dev`
5. ✅ Verify server is running on configured port

## Additional Resources

- See `ENV_TEMPLATE.md` for complete environment variable reference
- See `ENV_FILES_SETUP.md` for detailed environment setup
- See `docs/PROJECT_DOCUMENTATION.md` for project overview
