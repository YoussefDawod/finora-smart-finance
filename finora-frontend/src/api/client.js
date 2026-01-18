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
import { API_CONFIG } from './config';
import { logRequest, logResponse, logError } from './logger';
import { isUnauthorized, isForbidden, isNetworkError } from './errorHandler';

/* eslint-disable no-undef */

/**
 * Create axios instance with config
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
 * Request Interceptor
 * Injects auth token into every request
 */
client.interceptors.request.use(
  (config) => {
    try {
      const token = globalThis.localStorage?.getItem(API_CONFIG.TOKEN_STORAGE_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Token retrieval failed silently
    }

    logRequest(config.method?.toUpperCase?.() || 'GET', config.url, config.data);

    return config;
  },
  (error) => {
    dispatchToast('error', 'Unerwarteter Fehler beim Senden der Anfrage');
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
        globalThis.localStorage?.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
        globalThis.window?.dispatchEvent(new CustomEvent('auth:unauthorized'));
      } catch (err) {
        globalThis.console?.warn('Failed to handle 401 error:', err);
      }
      
      // Only show auth toast if not the initial auth check
      if (shouldShowAuthToast) {
        dispatchToast('error', 'Authentifizierung erforderlich');
      }
    } else if (isForbidden(error)) {
      dispatchToast('error', 'Sie haben keine Berechtigung');
    } else if (error?.response?.status === 404) {
      dispatchToast('error', 'Ressource nicht gefunden');
    } else if (error?.response?.status >= 500) {
      dispatchToast('error', 'Server-Fehler, bitte später versuchen');
    } else if (isNetworkError(error)) {
      dispatchToast('error', 'Keine Verbindung zum Server');
    } else if (error?.code === 'ECONNABORTED') {
      dispatchToast('error', 'Request hat zu lange gedauert');
    } else {
      dispatchToast('error', 'Unerwarteter Fehler');
    }

    return Promise.reject(error);
  }
);

export default client;
