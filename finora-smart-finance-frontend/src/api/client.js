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
import {
  refreshAccessToken,
  isExcludedFromRefresh,
  getAccessToken,
  clearAccessToken,
} from './tokenRefresh';

/**
 * Create axios instance with config
 * withCredentials: true — httpOnly Refresh-Token-Cookie wird automatisch mitgesendet
 */
const client = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000, // 10 seconds per spec
  headers: API_CONFIG.HEADERS,
  withCredentials: true,
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
 * Get auth token from in-memory storage (XSS-sicher)
 * @returns {string|null} The auth token or null
 */
const getAuthToken = () => getAccessToken();

/**
 * Request Interceptor
 * Injects auth token into every request
 */
client.interceptors.request.use(
  config => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logRequest(config.method?.toUpperCase?.() || 'GET', config.url, config.data);

    return config;
  },
  error => {
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
  response => {
    logResponse(
      response.config.method?.toUpperCase?.() || 'GET',
      response.config.url,
      response.status,
      response.data
    );

    return response;
  },
  error => {
    // ── ABORT / CANCEL ────────────────────────────────────────────────
    // Requests aborted by AbortController (e.g. unmount, single-flight)
    // are expected — skip logging AND toasts entirely.
    const isCanceled =
      error?.name === 'CanceledError' ||
      error?.name === 'AbortError' ||
      error?.code === 'ERR_CANCELED' ||
      error?.__CANCEL__;

    if (isCanceled) {
      return Promise.reject(error);
    }

    const isMeEndpoint = error?.config?.url?.includes('/auth/me');

    // Don't log 401 errors for /auth/me - they're expected during initial auth check
    const shouldLog = !(isUnauthorized(error) && isMeEndpoint);

    if (shouldLog && !isUnauthorized(error)) {
      logError(error.config?.method?.toUpperCase?.(), error.config?.url, error);
    }

    // ── TOKEN REFRESH ON 401 ──────────────────────────────────────────
    // If 401 and not an excluded endpoint (login/register/refresh itself)
    // → attempt silent token refresh and retry the original request
    if (
      isUnauthorized(error) &&
      !isExcludedFromRefresh(error.config) &&
      !error.config?._isRetryAfterRefresh
    ) {
      return refreshAccessToken()
        .then(newAccessToken => {
          // Retry original request with new token
          const retryConfig = { ...error.config };
          retryConfig.headers = {
            ...retryConfig.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          retryConfig._isRetryAfterRefresh = true;
          return client(retryConfig);
        })
        .catch(() => {
          // Refresh failed → final logout (already handled in tokenRefresh.js)
          // Don't show toast for /auth/me during initial check
          if (!isMeEndpoint) {
            dispatchToast('error', i18next.t('errors.authRequired'));
          }
          return Promise.reject(error);
        });
    }

    // ── REGULAR ERROR HANDLING ────────────────────────────────────────
    // Don't show toast for 401 on /auth/me endpoint (initial auth check)
    const shouldShowAuthToast = !isMeEndpoint;

    if (isUnauthorized(error)) {
      try {
        clearAccessToken();
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
    } else if (error?.response?.status >= 400 && error?.response?.status < 500) {
      // 4xx Domain-/Validierungsfehler (400, 405, 409 …)
      // Der jeweilige Aufrufer zeigt die passende Fehlermeldung — kein generischer Toast hier.
    } else {
      dispatchToast('error', i18next.t('errors.unexpectedError'));
    }

    return Promise.reject(error);
  }
);

export default client;
