/**
 * @fileoverview Error Handler
 * @description Centralized API error parsing and logging
 * 
 * @module api/errorHandler
 */

import i18next from 'i18next';

/* eslint-disable no-undef */

const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Parse Axios error to a standard shape
 * @param {any} error
 * @returns {{ message: string, code: string, status: number, details?: any }}
 */
export function parseApiError(error) {
  // Network / timeout (no response)
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') {
      return {
        message: i18next.t('errors.timeout'),
        code: ERROR_CODES.TIMEOUT,
        status: 0,
      };
    }

    return {
      message: i18next.t('errors.networkError'),
      code: ERROR_CODES.NETWORK_ERROR,
      status: 0,
    };
  }

  const { status, data } = error.response;
  const messageFromApi = data?.message || data?.error;

  // Validation errors
  if (status === 422) {
    const details = data?.errors || data?.details;
    return {
      message: details ? `${i18next.t('errors.validationError')}: ${JSON.stringify(details)}` : i18next.t('errors.validationError'),
      code: ERROR_CODES.VALIDATION_ERROR,
      status,
      details,
    };
  }

  if (status === 401) {
    return {
      message: i18next.t('errors.authRequired'),
      code: ERROR_CODES.AUTH_ERROR,
      status,
    };
  }

  if (status === 403) {
    return {
      message: i18next.t('errors.forbidden'),
      code: ERROR_CODES.FORBIDDEN,
      status,
    };
  }

  if (status === 404) {
    return {
      message: i18next.t('errors.notFound'),
      code: ERROR_CODES.NOT_FOUND,
      status,
    };
  }

  if (status >= 500) {
    return {
      message: i18next.t('errors.serverError'),
      code: ERROR_CODES.SERVER_ERROR,
      status,
    };
  }

  return {
    message: messageFromApi || i18next.t('errors.unexpectedError'),
    code: ERROR_CODES.UNKNOWN_ERROR,
    status,
  };
}

/**
 * Get user-friendly message from error code
 * @param {string} code
 * @returns {string}
 */
export function getErrorMessage(code) {
  const map = {
    [ERROR_CODES.NETWORK_ERROR]: i18next.t('errors.networkError'),
    [ERROR_CODES.TIMEOUT]: i18next.t('errors.timeout'),
    [ERROR_CODES.VALIDATION_ERROR]: i18next.t('errors.validationError'),
    [ERROR_CODES.AUTH_ERROR]: i18next.t('errors.authRequired'),
    [ERROR_CODES.FORBIDDEN]: i18next.t('errors.forbidden'),
    [ERROR_CODES.NOT_FOUND]: i18next.t('errors.notFound'),
    [ERROR_CODES.SERVER_ERROR]: i18next.t('errors.serverError'),
    [ERROR_CODES.UNKNOWN_ERROR]: i18next.t('errors.unexpectedError'),
  };

  return map[code] || i18next.t('errors.unexpectedError');
}

/**
 * Log error (dev vs prod)
 * @param {any} error
 * @param {{ endpoint?: string, method?: string, timestamp?: string }} [context]
 */
export function logError(error, context = {}) {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    globalThis.console?.error('API Error:', { error, context });
  } else {
    // Placeholder for production logging (e.g., Sentry)
    globalThis.console?.error('API Error (prod):', { error: error?.message, context });
  }
}

export function isUnauthorized(error) {
  return error?.response?.status === 401;
}

export function isForbidden(error) {
  return error?.response?.status === 403;
}

export function isNetworkError(error) {
  return !error?.response;
}

export const errorHandler = {
  parseApiError,
  getErrorMessage,
  logError,
  isUnauthorized,
  isForbidden,
  isNetworkError,
};

export default errorHandler;
