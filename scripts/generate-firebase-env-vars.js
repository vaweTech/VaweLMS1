#!/usr/bin/env node

/**
 * Generate individual environment variables for Firebase Admin SDK
 * Alternative to base64 encoding method
 */

const fs = require('fs');
const path = require('path');

try {
  // Read the service account key file
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Validate required fields
  const requiredFields = ['project_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !serviceAccount[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  console.log('\n✅ Firebase Environment Variables Generated!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Copy these to your Vercel Environment Variables:\n');
  
  console.log('1️⃣  FIREBASE_PROJECT_ID');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(serviceAccount.project_id);
  console.log('');
  
  console.log('2️⃣  FIREBASE_CLIENT_EMAIL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(serviceAccount.client_email);
  console.log('');
  
  console.log('3️⃣  FIREBASE_PRIVATE_KEY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  IMPORTANT: Copy the EXACT string below (including quotes):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(serviceAccount.private_key);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 Vercel Setup Instructions:\n');
  console.log('1. Go to: https://vercel.com/');
  console.log('2. Select your project → Settings → Environment Variables');
  console.log('3. Add THREE new environment variables:\n');
  console.log('   Variable 1:');
  console.log('   Name: FIREBASE_PROJECT_ID');
  console.log('   Value:', serviceAccount.project_id);
  console.log('');
  console.log('   Variable 2:');
  console.log('   Name: FIREBASE_CLIENT_EMAIL');
  console.log('   Value:', serviceAccount.client_email);
  console.log('');
  console.log('   Variable 3:');
  console.log('   Name: FIREBASE_PRIVATE_KEY');
  console.log('   Value: [Copy the private key from above - including \\n characters]');
  console.log('');
  console.log('4. For EACH variable, select ALL environments (Production, Preview, Development)');
  console.log('5. Click Save for each one');
  console.log('6. REMOVE the old FIREBASE_SERVICE_ACCOUNT_BASE64 variable if it exists');
  console.log('7. Redeploy your application\n');
  
  console.log('✅ The private key contains \\n characters - this is correct!');
  console.log('   Vercel will automatically handle them properly.\n');
  console.log('✅ Your firebaseAdmin.js already has code to handle this method.\n');
  
  // Also create a .env.example file
  const envExample = `# Firebase Admin SDK Configuration
# Use these individual environment variables instead of FIREBASE_SERVICE_ACCOUNT_BASE64

FIREBASE_PROJECT_ID=${serviceAccount.project_id}
FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"

# Note: The private_key should include the \\n characters exactly as shown
# Your code will automatically convert \\n to actual newlines
`;

  fs.writeFileSync(path.join(__dirname, '..', '.env.firebase.example'), envExample);
  console.log('📄 Created .env.firebase.example file for reference\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nMake sure serviceAccountKey.json exists in the project root.');
  process.exit(1);
}

