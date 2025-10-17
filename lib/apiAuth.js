// lib/apiAuth.js - Server-side API Authentication Middleware
import { NextResponse } from 'next/server';
import admin, { adminDb } from '@/lib/firebaseAdmin';

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Usage: export async function POST(req) { return await withAuth(req, handler); }
 */
export async function withAuth(req, handler) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader?.split('Bearer ')[1];
    
    if (!idToken || idToken.length < 10) {
      console.error('Invalid token format');
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token verified for user:', decodedToken.email);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user'
    };

    return await handler(req);
  } catch (error) {
    console.error('Auth verification failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages
    let errorMessage = 'Authentication failed';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired. Please refresh and try again.';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid token. Please log in again.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'User account has been disabled.';
    }
    
    return NextResponse.json(
      { error: errorMessage, code: error.code },
      { status: 401 }
    );
  }
}

/**
 * Middleware to verify admin role
 */
export async function withAdminAuth(req, handler) {
  // 1) Verify token and role
  try {
    console.log('🔐 Starting admin authentication check...');
    
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing authorization header for admin request');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const idToken = authHeader?.split('Bearer ')[1];
    if (!idToken || idToken.length < 10) {
      console.error('❌ Invalid token format for admin request');
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }

    console.log('🔍 Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Admin token verified for user:', decodedToken.email);

    console.log('🔍 Checking user role in Firestore...');
    let role = 'user';
    try {
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        console.error('❌ User document not found for:', decodedToken.email);
        return NextResponse.json({ error: 'User not found in system' }, { status: 404 });
      }
      const userData = userDoc.data();
      role = userData.role || 'user';
      console.log('📋 User role:', role);
    } catch (firestoreErr) {
      // OpenSSL fallback — allow if token is verified and email is in allowlist
      const msg = String(firestoreErr?.message || '');
      const isDecoderError = msg.includes('DECODER routines') || firestoreErr.code === 'ERR_OSSL_UNSUPPORTED';
      const userEmail = decodedToken.email;
      const allowlistEmails = process.env.ADMIN_EMAIL_ALLOWLIST?.split(',').map(e => e.trim()) || ['admin@gmail.com'];
      
      console.log('🔍 OpenSSL fallback check:', {
        isDecoderError,
        userEmail,
        allowlistEmails,
        hasAllowlist: !!process.env.ADMIN_EMAIL_ALLOWLIST,
        nodeEnv: process.env.NODE_ENV
      });
      
      if (isDecoderError && allowlistEmails.includes(userEmail)) {
        console.warn(`⚠️ Firestore role check failed due to OpenSSL. Allowing ${userEmail} via allowlist.`);
        role = 'admin';
      } else if (process.env.NODE_ENV === 'development' && isDecoderError) {
        console.warn('⚠️ Firestore role check failed due to OpenSSL. Allowing admin in development.');
        role = 'admin';
      } else {
        console.error('❌ OpenSSL fallback failed:', { userEmail, allowlistEmails, isDecoderError });
        throw firestoreErr;
      }
    }

    if (role !== 'admin' && role !== 'superadmin') {
      console.error('❌ Non-admin user attempted admin access:', decodedToken.email, 'Role:', role);
      return NextResponse.json({ error: 'Admin access required. Your role: ' + role }, { status: 403 });
    }

    req.user = { uid: decodedToken.uid, email: decodedToken.email, role };
    console.log('✅ Admin access granted to:', decodedToken.email);
  } catch (error) {
    console.error('❌ Admin auth verification failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    let errorMessage = 'Admin authentication failed';
    if (error.code === 'auth/id-token-expired') errorMessage = 'Admin token has expired. Please refresh and try again.';
    else if (error.code === 'auth/invalid-id-token') errorMessage = 'Invalid admin token. Please log in again.';
    else if (error.code === 'auth/user-disabled') errorMessage = 'Admin account has been disabled.';
    
    return NextResponse.json({ error: errorMessage, code: error.code }, { status: 401 });
  }

  // 2) Call the handler; if it fails, return a 500 not a 401
  try {
    return await handler(req);
  } catch (error) {
    console.error('❌ Handler execution failed:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

/**
 * Middleware to verify super admin role (for sensitive operations like analytics)
 */
export async function withSuperAdminAuth(req, handler) {
  // 1) Verify token and role
  try {
    console.log('🔐 Starting superadmin authentication check...');
    
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing authorization header for super admin request');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader?.split('Bearer ')[1];
    
    if (!idToken || idToken.length < 10) {
      console.error('❌ Invalid token format for super admin request');
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }
    
    console.log('🔍 Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Super admin token verified for user:', decodedToken.email);
    
    console.log('🔍 Checking user role in Firestore...');
    let role = 'user';
    try {
      // Check if user is super admin in Firestore
      const userDoc = await adminDb
        .collection('users')
        .doc(decodedToken.uid)
        .get();
      
      if (!userDoc.exists) {
        console.error('❌ User document not found for:', decodedToken.email);
        return NextResponse.json(
          { error: 'User not found in system' },
          { status: 404 }
        );
      }

      const userData = userDoc.data();
      role = userData.role || 'user';
      console.log('📋 User role:', role);
    } catch (firestoreErr) {
      // OpenSSL fallback — allow if token is verified and email is in superadmin allowlist
      const msg = String(firestoreErr?.message || '');
      const isDecoderError = msg.includes('DECODER routines') || firestoreErr.code === 'ERR_OSSL_UNSUPPORTED';
      const userEmail = decodedToken.email;
      const allowlistEmails = process.env.SUPERADMIN_EMAIL_ALLOWLIST?.split(',').map(e => e.trim()) || 
                             process.env.ADMIN_EMAIL_ALLOWLIST?.split(',').map(e => e.trim()) || 
                             ['admin@gmail.com'];
      
      console.log('🔍 OpenSSL fallback check (superadmin):', {
        isDecoderError,
        userEmail,
        allowlistEmails,
        hasSuperAdminAllowlist: !!process.env.SUPERADMIN_EMAIL_ALLOWLIST,
        hasAdminAllowlist: !!process.env.ADMIN_EMAIL_ALLOWLIST,
        nodeEnv: process.env.NODE_ENV
      });
      
      if (isDecoderError && allowlistEmails.includes(userEmail)) {
        console.warn(`⚠️ Firestore role check failed due to OpenSSL. Allowing ${userEmail} as superadmin via allowlist.`);
        role = 'superadmin';
      } else if (process.env.NODE_ENV === 'development' && isDecoderError) {
        console.warn('⚠️ Firestore role check failed due to OpenSSL. Allowing superadmin in development.');
        role = 'superadmin';
      } else {
        console.error('❌ OpenSSL fallback failed:', { userEmail, allowlistEmails, isDecoderError });
        throw firestoreErr;
      }
    }
    
    if (role !== 'superadmin') {
      console.error('❌ Non-superadmin user attempted superadmin access:', decodedToken.email, 'Role:', role);
      return NextResponse.json(
        { error: 'Super admin access required. Your role: ' + (role || 'none') },
        { status: 403 }
      );
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: role
    };

    console.log('✅ Super admin access granted to:', decodedToken.email);
  } catch (error) {
    console.error('❌ Super admin auth verification failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Super admin authentication failed';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired. Please refresh and try again.';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid token. Please log in again.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Account has been disabled.';
    }
    
    return NextResponse.json(
      { error: errorMessage, code: error.code },
      { status: 401 }
    );
  }
  
  // 2) Call the handler; if it fails, return a 500 not a 401
  try {
    return await handler(req);
  } catch (error) {
    console.error('❌ Handler execution failed:', error);
    console.error('Handler error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map();

export function withRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return async function(req, handler) {
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, data] of rateLimitMap.entries()) {
      if (data.timestamp < windowStart) {
        rateLimitMap.delete(key);
      }
    }
    
    const key = `${clientIP}-${req.url}`;
    const current = rateLimitMap.get(key) || { count: 0, timestamp: now };
    
    if (current.timestamp < windowStart) {
      current.count = 1;
      current.timestamp = now;
    } else {
      current.count++;
    }
    
    rateLimitMap.set(key, current);
    
    if (current.count > maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return await handler(req);
  };
}

/**
 * Input validation middleware
 */
export function validateInput(schema) {
  return async function(req, handler) {
    try {
      const body = await req.json();
      const validated = schema.parse(body);
      req.validatedBody = validated;
      return await handler(req);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
  };
}
