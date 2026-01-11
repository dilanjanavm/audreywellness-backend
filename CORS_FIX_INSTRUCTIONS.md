# Critical CORS Fix - Production Deployment

## Problem
The production URL `http://206.189.82.117:8080` is being blocked because the server is not recognizing it as production environment.

## Root Cause
The `NODE_ENV` environment variable is not set to `production` on the server, causing the code to use development CORS defaults (only localhost URLs).

## Solutions

### Solution 1: Set NODE_ENV Environment Variable (RECOMMENDED)

On your production server, set the NODE_ENV environment variable:

```bash
export NODE_ENV=production
npm run start:prod
```

Or create/update `.env.production` file with:
```env
NODE_ENV=production
CORS_ORIGINS=http://206.189.82.117:8080,http://206.189.82.117:3003
```

### Solution 2: Use PM2 or Process Manager (RECOMMENDED for Production)

If using PM2:
```bash
# ecosystem.config.js or command line
pm2 start dist/main.js --name backend --env production

# Or set in ecosystem config:
# env: {
#   NODE_ENV: 'production'
# }
```

### Solution 3: Explicitly Set CORS_ORIGINS

Create `.env.production` file with explicit CORS configuration:
```env
CORS_ORIGINS=http://206.189.82.117:8080,http://206.189.82.117:3003
```

### Solution 4: Quick Fix - Update Code (Already Applied)

The code has been updated to:
1. Check `process.env.NODE_ENV` at runtime (after .env files are loaded)
2. Include production URLs in development defaults as a safety measure

This means production URLs will be allowed even if NODE_ENV is not set correctly.

## Verification Steps

After applying the fix:

1. **Check server logs** - You should see:
   ```
   🔍 Current NODE_ENV: production
   🌐 CORS Allowed Origins: [ 'http://206.189.82.117:8080', 'http://206.189.82.117:3003' ]
   ```

2. **Test the request** - Try logging in from `http://206.189.82.117:8080`

3. **Check for CORS errors** - Should see:
   ```
   ✅ CORS: Allowing origin: http://206.189.82.117:8080
   ```

## Immediate Action Required

1. **Restart your production server** after the code update
2. **Verify NODE_ENV is set** to `production` on the server
3. **Check the logs** to confirm production URLs are in the allowed list

## Production Server Setup

```bash
# On production server
cd /var/www/html/audreywellness-backend

# Create .env.production if it doesn't exist
nano .env.production

# Add these lines:
NODE_ENV=production
CORS_ORIGINS=http://206.189.82.117:8080,http://206.189.82.117:3003

# Restart the server
# If using PM2:
pm2 restart backend

# If using systemd:
sudo systemctl restart audreywellness-backend

# Or if running directly:
export NODE_ENV=production
npm run start:prod
```

