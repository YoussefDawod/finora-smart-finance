/**
 * @fileoverview Axios Client Instance
 * @description Configured axios instance with interceptors for auth and logging
 * 
 * FEATURES:
 * - Auto token injection in headers
 * - Request/Response logging
 * - Error handling
 * - 401 Unauthorized handling (auto logout)
 * 
 * @module api/client
 */

import axios from 'axios';
import i18next from 'i18next';
import { API_CONFIG } from './config';
import { logRequest, logResponse, logError } from './logger';
import { isUnauthorized, isForbidden, isNetworkError } from './errorHandler';

/* eslint-disable no-undef */

/**
 * Create axios instance with config
 * Note: withCredentials is NOT needed since we use localStorage for tokens, not cookies
 */
const client = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000, // 10 seconds per spec
  headers: API_CONFIG.HEADERS,
});

/**
 * Dispatch toast event (handled by ToastProvider listener)
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} message
 * @param {number} duration
 */
const dispatchToast = (type, message, duration = 5000) => {
  try {
    globalThis.window?.dispatchEvent(
      new CustomEvent('toast:add', { detail: { type, message, duration } })
    );
  } catch (error) {
    globalThis.console?.warn('Failed to dispatch toast event:', error, message);
  }
};

// ============================================
// 📤 REQUEST INTERCEPTOR
// ============================================

/**
 * Get auth token from storage
 * Checks both localStorage and sessionStorage (for rememberMe support)
 * @returns {string|null} The auth token or null
 */
const getAuthToken = () => {
  try {
    return globalThis.localStorage?.getItem(API_CONFIG.TOKEN_STORAGE_KEY) || 
           globalThis.sessionStorage?.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Request Interceptor
 * Injects auth token into every request
 */
client.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logRequest(config.method?.toUpperCase?.() || 'GET', config.url, config.data);

    return config;
  },
  (error) => {
    dispatchToast('error', i18next.t('errors.requestFailed'));
    return Promise.reject(error);
  }
);

// ============================================
// 📥 RESPONSE INTERCEPTOR
// ============================================

/**
 * Response Interceptor
 * Handles responses and errors
 */
client.interceptors.response.use(
  (response) => {
    logResponse(
      response.config.method?.toUpperCase?.() || 'GET',
      response.config.url,
      response.status,
      response.data
    );

    return response;
  },
  (error) => {
    const isMeEndpoint = error?.config?.url?.includes('/auth/me');
    
    // Don't log 401 errors for /auth/me - they're expected during initial auth check
    const shouldLog = !(isUnauthorized(error) && isMeEndpoint);
    
    if (shouldLog && !isUnauthorized(error)) {
      logError(error.config?.method?.toUpperCase?.(), error.config?.url, error);
    }

    // Don't show toast for 401 on /auth/me endpoint (initial auth check)
    const shouldShowAuthToast = !isMeEndpoint;

    if (isUnauthorized(error)) {
      try {
        // Clear token from both storages
        globalThis.localStorage?.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
        globalThis.sessionStorage?.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
        globalThis.window?.dispatchEvent(new CustomEvent('auth:unauthorized'));
      } catch (err) {
        globalThis.console?.warn('Failed to handle 401 error:', err);
      }
      
      // Only show auth toast if not the initial auth check
      if (shouldShowAuthToast) {
        dispatchToast('error', i18next.t('errors.authRequired'));
      }
    } else if (isForbidden(error)) {
      dispatchToast('error', i18next.t('errors.forbidden'));
    } else if (error?.response?.status === 404) {
      dispatchToast('error', i18next.t('errors.notFound'));
    } else if (error?.response?.status >= 500) {
      dispatchToast('error', i18next.t('errors.serverError'));
    } else if (isNetworkError(error)) {
      dispatchToast('error', i18next.t('errors.networkError'));
    } else if (error?.code === 'ECONNABORTED') {
      dispatchToast('error', i18next.t('errors.timeout'));
    } else {
      dispatchToast('error', i18next.t('errors.unexpectedError'));
    }

    return Promise.reject(error);
  }
);

export default client;
