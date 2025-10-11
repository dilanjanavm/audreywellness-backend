/**
 * Script to generate Google OAuth2 Refresh Token for Email Service
 * 
 * Usage:
 * 1. Install dependencies: npm install googleapis
 * 2. Update the credentials below
 * 3. Run: node scripts/generate-google-refresh-token.js
 * 4. Follow the instructions to authorize and get the refresh token
 */

const { google } = require('googleapis');
const readline = require('readline');

// Your OAuth2 credentials from Google Cloud Console
// IMPORTANT: Replace these with your own credentials from Google Cloud Console
// Get them from: https://console.cloud.google.com/apis/credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000';

// Scopes needed for sending emails
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Required to get refresh token
  scope: SCOPES,
  prompt: 'consent', // Force consent screen to ensure refresh token is returned
});

console.log('\n========================================');
console.log('Google OAuth2 Refresh Token Generator');
console.log('========================================\n');
console.log('Step 1: Authorize this application');
console.log('Visit this URL in your browser:\n');
console.log(authUrl);
console.log('\n');

// Read authorization code from user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Step 2: After authorizing, paste the authorization code from the URL here: ', async (code) => {
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n========================================');
    console.log('✅ Success! Your tokens:');
    console.log('========================================\n');
    console.log('Refresh Token:');
    console.log(tokens.refresh_token);
    console.log('\n');
    console.log('Access Token (expires in 1 hour):');
    console.log(tokens.access_token);
    console.log('\n');
    console.log('========================================');
    console.log('Add these to your .env file:');
    console.log('========================================\n');
    console.log('EMAIL_USE_OAUTH2=true');
    console.log('EMAIL_USER=your-email@gmail.com'); // Replace with your Gmail
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n');
    
    rl.close();
  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
    console.error('\nMake sure you:');
    console.error('1. Copied the full authorization code from the URL');
    console.error('2. The code hasn\'t expired (authorize again if needed)');
    console.error('3. Your redirect URI matches: http://localhost:3000');
    rl.close();
    process.exit(1);
  }
});

