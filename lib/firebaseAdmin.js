// lib/firebaseAdmin.js

// CRITICAL FIX for SSL/DECODER error on Windows and Vercel
// Must be set BEFORE importing firebase-admin
// Always prefer REST API to avoid gRPC SSL issues
if (typeof process !== 'undefined') {
  process.env.FIRESTORE_PREFER_REST = 'true';
  process.env.GOOGLE_CLOUD_FIRESTORE_PREFER_REST = 'true';
  
  // Additional settings for Windows
  if (process.platform === 'win32') {
    process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // For development only
    process.env.GRPC_ENABLE_FORK_SUPPORT = '0';
    process.env.GRPC_POLL_STRATEGY = 'poll';
  }
} 

import admin from 'firebase-admin';

let db = null;

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  // Try multiple methods to initialize Firebase Admin
  let initialized = false;
  
  // Method 1: Use base64-encoded service account JSON (most reliable for Vercel)
  if (!initialized && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      console.log('🔐 Initializing Firebase Admin with base64-encoded service account');
      const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      // CRITICAL: Ensure private key has proper newlines
      // The private_key might have escaped newlines (\n) as literal string "\n"
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        // Replace literal \n with actual newline characters
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      console.log('✅ Firebase Admin initialized successfully with base64 method');
      initialized = true;
    } catch (error) {
      console.error('❌ Base64 method failed:', error.message);
      console.error('Full error:', error);
    }
  }
  
  // Method 2: Use individual environment variables
  if (!initialized && process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL && 
      process.env.FIREBASE_PROJECT_ID) {
    try {
      console.log('🔐 Initializing Firebase Admin with environment variables');
      
      // Handle private key - it might have escaped newlines or be a JSON string
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // If the key is wrapped in quotes (from JSON), remove them
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      console.log('✅ Firebase Admin initialized successfully with env vars');
      initialized = true;
    } catch (error) {
      console.error('❌ Environment variables method failed:', error.message);
    }
  }
  
  // Method 3: Use service account key file (local development)
  if (!initialized) {
    try {
      console.log('🔐 Initializing Firebase Admin with service account key');
      const serviceAccount = require('../serviceAccountKey.json');
      
      // Add SSL settings for development on Windows
      if (process.platform === 'win32') {
        console.log('🪟 Detected Windows - applying SSL and REST API fix');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      console.log('✅ Firebase Admin initialized successfully with service account file');
      initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error.message);
      console.error('Please set environment variables or add serviceAccountKey.json');
      throw new Error('Firebase Admin initialization failed. Check environment variables.');
    }
  }
  
  if (!initialized) {
    throw new Error('Firebase Admin could not be initialized with any method. Check your environment variables.');
  }
  
  // Initialize Firestore with REST API settings IMMEDIATELY after admin init
  db = admin.firestore();
  
  // Apply REST API settings to avoid gRPC SSL/decoder issues
  const firestoreSettings = {
    ignoreUndefinedProperties: true,
    preferRest: true, // Always use REST API to avoid SSL/decoder errors
  };
  
  // Disable SSL for local development only
  if (process.env.NODE_ENV !== 'production') {
    firestoreSettings.ssl = false;
    console.log('🔧 Firestore configured with REST API (SSL disabled for dev)');
  } else {
    firestoreSettings.ssl = true;
    console.log('🔧 Firestore configured with REST API for production');
  }
  
  db.settings(firestoreSettings);
  console.log('✅ Firestore initialized successfully');
} else {
  // Already initialized
  db = admin.firestore();
}

export const adminDb = db;
export default admin;
