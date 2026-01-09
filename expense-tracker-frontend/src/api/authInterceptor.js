/**
 * Auth Interceptor
 * Handles automatic token injection, refresh, and error handling for API requests
 */

import { apiClient } from './client';
import { authService } from './authService';
import * as tokenManager from '../utils/tokenManager';

// ============================================
// State Management
// ============================================
let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 * @param {Error|null} error - Error if refresh failed
 * @param {string|null} token - New token if refresh succeeded
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Add failed request to queue for retry after token refresh
 * @returns {Promise<string>} - Promise that resolves with new token
 */
const addToQueue = () => {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
};

// ============================================
// Token Refresh Handler
// ============================================
/**
 * Handle token refresh with queue management
 * Prevents multiple simultaneous refresh requests
 * @returns {Promise<string>} - New access token
 */
const handleTokenRefresh = async () => {
  // If already refreshing, add to queue
  if (isRefreshing) {
    return addToQueue();
  }

  isRefreshing = true;

  try {
    console.log('[AuthInterceptor] Refreshing access token...');
    const newToken = await authService.refreshAccessToken();
    
    // Process all queued requests with new token
    processQueue(null, newToken);
    
    console.log('[AuthInterceptor] Token refresh successful');
    return newToken;
  } catch (error) {
    console.error('[AuthInterceptor] Token refresh failed:', error);
    
    // Process queue with error
    processQueue(error, null);
    
    // Logout user on refresh failure
    handleLogout();
    
    throw error;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Handle logout and cleanup
 */
const handleLogout = () => {
  console.log('[AuthInterceptor] Logging out due to auth failure');
  
  // Clear tokens
  authService.logout();
  
  // Redirect to login page
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// ============================================
// Error Handler
// ============================================
/**
 * Handle different types of API errors
 * @param {Error} error - API error
 * @returns {Object} - User-friendly error object
 */
const handleAPIError = (error) => {
  const status = error.statusCode || error.status;
  
  switch (status) {
    case 401:
      return {
        message: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
        type: 'auth',
        shouldLogout: true,
      };
      
    case 403:
      return {
        message: 'Du hast keine Berechtigung für diese Aktion.',
        type: 'permission',
        shouldLogout: false,
      };
      
    case 404:
      return {
        message: 'Die angeforderte Ressource wurde nicht gefunden.',
        type: 'not_found',
        shouldLogout: false,
      };
      
    case 422:
      return {
        message: error.message || 'Ungültige Eingabedaten.',
        type: 'validation',
        shouldLogout: false,
        details: error.data?.details,
      };
      
    case 429:
      return {
        message: 'Zu viele Anfragen. Bitte versuche es später erneut.',
        type: 'rate_limit',
        shouldLogout: false,
      };
      
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: 'Ein Serverfehler ist aufgetreten. Bitte versuche es später erneut.',
        type: 'server_error',
        shouldLogout: false,
      };
      
    default:
      return {
        message: error.message || 'Ein unbekannter Fehler ist aufgetreten.',
        type: 'unknown',
        shouldLogout: false,
      };
  }
};

// ============================================
// Setup Auth Interceptor
// ============================================
/**
 * Configure API Client with Auth Interceptor logic
 * Sets up automatic token injection and refresh handling
 */
export const setupAuthInterceptor = () => {
  console.log('[AuthInterceptor] Setting up auth interceptor...');
  
  // ========================================
  // Request Interceptor
  // ========================================
  // Note: apiClient already uses defaultHeaders with authToken
  // We just need to ensure token is loaded from tokenManager
  const originalSetAuthToken = apiClient.setAuthToken.bind(apiClient);
  
  // Override setAuthToken to also update tokenManager
  apiClient.setAuthToken = (token) => {
    originalSetAuthToken(token);
  };
  
  // Initialize token from storage on setup
  const storedToken = tokenManager.getAccessToken();
  if (storedToken) {
    console.log('[AuthInterceptor] Loading stored token');
    apiClient.setAuthToken(storedToken);
  }
  
  // ========================================
  // Response Interceptor (via refreshHandler)
  // ========================================
  apiClient.setRefreshHandler(async () => {
    try {
      // Check if token needs refresh
      if (!tokenManager.isRefreshNeeded()) {
        console.log('[AuthInterceptor] Token is still valid, no refresh needed');
        return tokenManager.getAccessToken();
      }
      
      // Perform token refresh
      const newToken = await handleTokenRefresh();
      return newToken;
    } catch (error) {
      console.error('[AuthInterceptor] Token refresh failed in interceptor', error);
      
      // Handle error
      const errorInfo = handleAPIError(error);
      
      if (errorInfo.shouldLogout) {
        handleLogout();
      }
      
      throw error;
    }
  });
  
  console.log('[AuthInterceptor] Auth interceptor setup complete');
};

// ============================================
// Manual Token Injection (for custom requests)
// ============================================
/**
 * Get authorization headers for manual requests
 * @returns {Object} - Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = tokenManager.getAccessToken();
  
  if (!token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if valid token exists
 */
export const isAuthenticated = () => {
  return tokenManager.isTokenValid();
};

// ============================================
// Error Handler Export
// ============================================
export { handleAPIError };

// ============================================
// Default Export
// ============================================
export default {
  setupAuthInterceptor,
  getAuthHeaders,
  isAuthenticated,
  handleAPIError,
};
