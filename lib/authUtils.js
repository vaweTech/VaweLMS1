// lib/authUtils.js - Enhanced authentication utilities
import { auth } from './firebase';

/**
 * Get a fresh Firebase ID token, automatically refreshing if needed
 * @returns {Promise<string>} Fresh ID token
 */
export async function getFreshAuthToken() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user found. Please log in again.');
  }
  
  try {
    // Force refresh the token to get a fresh one
    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error getting fresh token:', error);
    
    // If token refresh fails, the user needs to log in again
    if (error.code === 'auth/user-token-expired' || 
        error.code === 'auth/invalid-user-token' ||
        error.code === 'auth/user-disabled') {
      throw new Error('Your session has expired. Please log in again.');
    }
    
    throw new Error('Authentication error. Please try logging in again.');
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} API response
 */
export async function makeAuthenticatedRequest(endpoint, options = {}) {
  const maxRetries = 2;
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      const token = await getFreshAuthToken();
      
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });
      
      // If we get a 401, try refreshing the token once
      if (response.status === 401 && retryCount === 0) {
        console.log('Token expired, refreshing...');
        retryCount++;
        continue;
      }
      
      return response;
    } catch (error) {
      if (retryCount >= maxRetries) {
        throw error;
      }
      retryCount++;
      console.log(`Auth error, retrying... (${retryCount}/${maxRetries})`);
    }
  }
}

/**
 * Check if the current user is authenticated and has a valid token
 * @returns {Promise<boolean>} True if authenticated with valid token
 */
export async function isAuthenticated() {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    await user.getIdToken(false); // Check without forcing refresh
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

/**
 * Get current user info with token validation
 * @returns {Promise<object|null>} User info or null if not authenticated
 */
export async function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const token = await user.getIdToken(false);
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      hasValidToken: true
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Handle authentication errors gracefully
 * @param {Error} error - Authentication error
 * @param {Function} onExpired - Callback when session expires
 */
export function handleAuthError(error, onExpired) {
  console.error('Authentication error:', error);
  
  if (error.message.includes('expired') || 
      error.message.includes('invalid') ||
      error.code === 'auth/user-token-expired') {
    if (onExpired) {
      onExpired();
    } else {
      // Default behavior: redirect to login
      window.location.href = '/auth/login';
    }
  }
}
