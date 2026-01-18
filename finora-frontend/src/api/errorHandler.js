/**
 * @fileoverview Error Handler
 * @description Centralized API error parsing and logging
 * 
 * @module api/errorHandler
 */

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
        message: 'Request hat zu lange gedauert',
        code: ERROR_CODES.TIMEOUT,
        status: 0,
      };
    }

    return {
      message: 'Keine Verbindung zum Server',
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
      message: details ? `Validierungsfehler: ${JSON.stringify(details)}` : 'Validierungsfehler',
      code: ERROR_CODES.VALIDATION_ERROR,
      status,
      details,
    };
  }

  if (status === 401) {
    return {
      message: 'Authentifizierung erforderlich',
      code: ERROR_CODES.AUTH_ERROR,
      status,
    };
  }

  if (status === 403) {
    return {
      message: 'Sie haben keine Berechtigung',
      code: ERROR_CODES.FORBIDDEN,
      status,
    };
  }

  if (status === 404) {
    return {
      message: 'Ressource nicht gefunden',
      code: ERROR_CODES.NOT_FOUND,
      status,
    };
  }

  if (status >= 500) {
    return {
      message: 'Server-Fehler, bitte später versuchen',
      code: ERROR_CODES.SERVER_ERROR,
      status,
    };
  }

  return {
    message: messageFromApi || 'Unerwarteter Fehler',
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
    [ERROR_CODES.NETWORK_ERROR]: 'Keine Verbindung zum Server',
    [ERROR_CODES.TIMEOUT]: 'Request hat zu lange gedauert',
    [ERROR_CODES.VALIDATION_ERROR]: 'Validierungsfehler',
    [ERROR_CODES.AUTH_ERROR]: 'Authentifizierung erforderlich',
    [ERROR_CODES.FORBIDDEN]: 'Sie haben keine Berechtigung',
    [ERROR_CODES.NOT_FOUND]: 'Ressource nicht gefunden',
    [ERROR_CODES.SERVER_ERROR]: 'Server-Fehler, bitte später versuchen',
    [ERROR_CODES.UNKNOWN_ERROR]: 'Unerwarteter Fehler',
  };

  return map[code] || 'Unerwarteter Fehler';
}

/**
 * Log error (dev vs prod)
 * @param {any} error
 * @param {{ endpoint?: string, method?: string, timestamp?: string }} [context]
 */
export function logError(error, context = {}) {
  const isDev = process.env.NODE_ENV !== 'production';

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
