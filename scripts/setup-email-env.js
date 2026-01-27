/**
 * Script to add email configuration to .env file
 * Run: node scripts/setup-email-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Email configuration template
const emailConfig = `
# ============================================
# Email Configuration - TEMPORARY VALUES (UPDATE THESE)
# ============================================
# Choose ONE method: OAuth2 (recommended) or App Password

# Method 1: Google OAuth2 (Recommended)
# Set EMAIL_USE_OAUTH2=true and configure OAuth2 credentials below
EMAIL_USE_OAUTH2=false
EMAIL_USER=your-email@gmail.com
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE

# Method 2: App Password (Simpler - Use this for quick setup)
# Set EMAIL_USE_OAUTH2=false and configure App Password below
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_PASSWORD=your-16-character-app-password-here

# Optional Email Settings
EMAIL_FROM_NAME=Audrey Wellness
EMAIL_REPLY_TO=support@audreywellness.com
FRONTEND_URL=http://localhost:3000
`;

console.log('\n========================================');
console.log('Email Configuration Setup');
console.log('========================================\n');

try {
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env file\n');
    
    // Check if email config already exists
    if (envContent.includes('EMAIL_USER')) {
      console.log('⚠️  Email configuration already exists in .env file');
      console.log('   Please update the values manually or remove them first.\n');
      console.log('Current email configuration:');
      const lines = envContent.split('\n');
      let inEmailSection = false;
      lines.forEach(line => {
        if (line.includes('EMAIL_') || line.includes('GOOGLE_') || line.includes('FRONTEND_URL')) {
          if (!inEmailSection) {
            console.log('\n--- Email Configuration ---');
            inEmailSection = true;
          }
          console.log(line);
        }
      });
      console.log('\n');
    } else {
      // Append email config to .env
      console.log('📝 Adding email configuration to .env file...');
      fs.appendFileSync(envPath, emailConfig);
      console.log('✅ Email configuration added successfully!\n');
    }
  } else {
    // Create new .env file with email config
    console.log('📝 Creating new .env file with email configuration...');
    fs.writeFileSync(envPath, emailConfig);
    console.log('✅ .env file created with email configuration!\n');
  }
  
  console.log('========================================');
  console.log('Next Steps:');
  console.log('========================================\n');
  console.log('1. Open .env file and update EMAIL_USER with your Gmail address');
  console.log('2. Choose one method:\n');
  console.log('   Option A - App Password (Easier):');
  console.log('   - Set EMAIL_USE_OAUTH2=false');
  console.log('   - Generate App Password: https://myaccount.google.com/apppasswords');
  console.log('   - Update EMAIL_PASSWORD with the 16-character app password\n');
  console.log('   Option B - OAuth2 (More Secure):');
  console.log('   - Set EMAIL_USE_OAUTH2=true');
  console.log('   - Get refresh token from: https://developers.google.com/oauthplayground/');
  console.log('   - Update GOOGLE_REFRESH_TOKEN\n');
  console.log('3. Restart your server after updating .env file');
  console.log('4. Test email: GET /email/status\n');
  console.log('For detailed instructions, see: docs/GOOGLE_EMAIL_SETUP.md\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nPlease manually add the following to your .env file:\n');
  console.log(emailConfig);
  process.exit(1);
}


