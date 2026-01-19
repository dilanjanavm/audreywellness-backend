# Quick Start: Development Environment

## Setup `.env.development` File

### Step 1: Create the file

**Windows:**
```cmd
type nul > .env.development
```

**Mac/Linux:**
```bash
touch .env.development
```

### Step 2: Add Configuration

Open `.env.development` and paste this template:

```env
NODE_ENV=development

# Server
PORT=3005

# Database
DB_HOST=localhost
DB_PORT=3366
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=audreywellnessdb

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=1d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8080

# Email (Optional)
EMAIL_USE_OAUTH2=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Courier (Optional)
CITYPAK_STAGING_URL=https://staging.citypak.lk
CITYPAK_STAGING_API_TOKEN=your-token
```

**Update the values** with your local settings (especially database credentials).

### Step 3: Run the Server

```bash
# Development mode (automatically uses .env.development)
npm run start:dev
```

## Verification

You should see in the console:
```
🔧 Environment: development
📄 Loaded environment files: .env, .env.development
🚀 Application is running on:3005
```

## Alternative: Use Base `.env` File

If you don't create `.env.development`, the app will use `.env` as fallback.

---

**Full Documentation:** See `docs/DEVELOPMENT_ENV_SETUP.md` for detailed instructions.
