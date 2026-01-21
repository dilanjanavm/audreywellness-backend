# Environment Files Templates

Copy the content below to create your environment files.

## For Development: Create `.env.development` file

**Recommended:** Use `.env.development` for development-specific configuration.

1. Copy this template:
   ```bash
   # Create .env.development file
   touch .env.development
   # or on Windows
   type nul > .env.development
   ```

2. Copy the content below into `.env.development`:

```env
# ============================================
# Audrey Wellness Backend - Development Environment
# ============================================
# This file overrides .env when NODE_ENV=development

NODE_ENV=development

# ============================================
# Server Configuration
# ============================================
PORT=3005

# ============================================
# Database Configuration
# ============================================
DB_HOST=localhost
DB_PORT=3366
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=audreywellnessdb

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your-development-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=1d

# ============================================
# CORS Configuration
# ============================================
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8080,http://localhost:3001,http://localhost:3002,http://localhost:3004

# ============================================
# Email Configuration
# ============================================
# Method 1: App Password (Easier)
EMAIL_USE_OAUTH2=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password-here

# Method 2: OAuth2 (More Secure - Uncomment to use)
# EMAIL_USE_OAUTH2=true
# GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-client-secret
# GOOGLE_REFRESH_TOKEN=your-refresh-token

# Optional Email Settings
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://localhost:3000

# ============================================
# Courier Service (Citypak) Configuration
# ============================================
# Staging Configuration
CITYPAK_STAGING_URL=https://staging.citypak.lk
CITYPAK_STAGING_API_TOKEN=your-staging-api-token-here

# Production Configuration
CITYPAK_PRODUCTION_URL=https://falcon.citypak.lk
CITYPAK_PRODUCTION_API_TOKEN=your-production-api-token-here

# ============================================
# SMS Gateway (Send.lk) Configuration
# ============================================
# Get your API token from: https://sms.send.lk (Dashboard -> API Settings)
# Token format: {id}|{token}
# Example: 1896|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ
SENDLK_API_TOKEN=your-send-lk-api-token-here
# Alternative variable name (both work):
# SMS_API_TOKEN=your-send-lk-api-token-here
```

---

## For Production: Create `.env.production` file

```env
# ============================================
# Audrey Wellness Backend - Production Environment
# ============================================
NODE_ENV=production

# ============================================
# Server Configuration
# ============================================
PORT=3005

# ============================================
# Database Configuration (Production)
# ============================================
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USERNAME=your-production-db-username
DB_PASSWORD=your-production-db-password
DB_NAME=audreywellnessdb_prod

# ============================================
# CORS Configuration (Production)
# ============================================
CORS_ORIGINS=http://206.189.82.117:8080,http://206.189.82.117:3003

# ============================================
# Email Configuration (Production)
# ============================================
# Recommended: Use OAuth2 for production
EMAIL_USE_OAUTH2=true
EMAIL_USER=your-production-email@gmail.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token

# Optional Email Settings
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://206.189.82.117:8080

# ============================================
# Courier Service (Citypak) Configuration
# ============================================
# Production Configuration
CITYPAK_PRODUCTION_URL=https://falcon.citypak.lk
CITYPAK_PRODUCTION_API_TOKEN=your-production-api-token-here

# ============================================
# SMS Gateway (Send.lk) Configuration
# ============================================
# Get your API token from: https://sms.send.lk (Dashboard -> API Settings)
# Token format: {id}|{token}
# Example: 1896|K9RwzV0LqmbwnKXfPwvuWo66qTEaC8WbBISd72xZ
SENDLK_API_TOKEN=your-send-lk-api-token-here
# Alternative variable name (both work):
# SMS_API_TOKEN=your-send-lk-api-token-here
```

---

## Quick Setup Commands

### Development
```bash
# Create .env file
cat > .env << 'EOF'
# Paste development template above
EOF

# Edit with your values
nano .env  # or use your preferred editor
```

### Production
```bash
# Create .env.production file
cat > .env.production << 'EOF'
# Paste production template above
EOF

# Edit with your production values
nano .env.production  # or use your preferred editor
```

## Important Notes

1. **Never commit `.env` or `.env.production` files to Git**
   - These files contain sensitive information
   - They are automatically ignored by `.gitignore`

2. **Update all placeholder values**
   - Replace `your-*` placeholders with actual values
   - Use strong, unique passwords in production

3. **Verify file location**
   - Files must be in the project root directory
   - Same directory as `package.json`

4. **Restart server after changes**
   - Environment variables are loaded at startup
   - Changes require server restart

