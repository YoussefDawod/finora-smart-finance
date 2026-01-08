/**
 * Error handling utilities.
 */
import {
  ERROR_TYPES,
  HTTP_STATUS_TO_ERROR_TYPE,
  ERROR_MESSAGES,
  RETRYABLE_ERROR_TYPES,
  ERROR_TYPE_TO_SEVERITY,
} from '../config/errorConfig';

/**
 * Custom error class with additional metadata.
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, statusCode = null, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = Date.now();
  }
}

/**
 * Determines error type from HTTP status code or error object.
 * @param {Error|Object} error
 * @returns {string}
 */
function getErrorType(error) {
  // Check if error has explicit type
  if (error?.type && Object.values(ERROR_TYPES).includes(error.type)) {
    return error.type;
  }

  // Check HTTP status code
  if (error?.response?.status) {
    return HTTP_STATUS_TO_ERROR_TYPE[error.response.status] || ERROR_TYPES.UNKNOWN;
  }

  if (error?.status) {
    return HTTP_STATUS_TO_ERROR_TYPE[error.status] || ERROR_TYPES.UNKNOWN;
  }

  // Check error name
  if (error?.name === 'AbortError') {
    return ERROR_TYPES.NETWORK;
  }

  if (error?.name === 'TimeoutError') {
    return ERROR_TYPES.TIMEOUT;
  }

  // Network errors
  if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
    return ERROR_TYPES.NETWORK;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Extracts user-friendly message from error.
 * @param {Error|Object} error
 * @param {string} errorType
 * @returns {string}
 */
function getUserMessage(error, errorType) {
  // Use server-provided message if available
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message && !error?.message.includes('Network')) {
    return error.message;
  }

  // Fallback to configured message
  return ERROR_MESSAGES[errorType]?.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].message;
}

/**
 * Determines if error is retryable.
 * @param {string} errorType
 * @returns {boolean}
 */
function isRetryable(errorType) {
  return RETRYABLE_ERROR_TYPES.includes(errorType);
}

/**
 * Gets suggested recovery action.
 * @param {string} errorType
 * @returns {string}
 */
function getRecoveryAction(errorType) {
  return ERROR_MESSAGES[errorType]?.action || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].action;
}

/**
 * Gets error severity.
 * @param {string} errorType
 * @returns {string}
 */
function getErrorSeverity(errorType) {
  return ERROR_TYPE_TO_SEVERITY[errorType] || ERROR_TYPE_TO_SEVERITY[ERROR_TYPES.UNKNOWN];
}

/**
 * Logs error with structured data.
 * @param {Error|Object} error
 * @param {Object} context
 */
function logError(error, context = {}) {
  const isDev = import.meta.env.DEV;

  const errorData = {
    timestamp: new Date().toISOString(),
    type: error?.type || getErrorType(error),
    message: error?.message || 'Unknown error',
    statusCode: error?.response?.status || error?.status || null,
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
  };

  if (isDev) {
    console.error('Error:', errorData, error);
  } else {
    // TODO: Send to error tracking service (Sentry, etc.)
    // Sentry.captureException(error, { extra: errorData });
    console.error('Production error:', errorData);
  }
}

/**
 * Main error handler function.
 * @param {Error|Object} error
 * @param {Object} options
 * @param {Object} options.context - Additional context
 * @param {boolean} options.shouldLog - Whether to log error (default: true)
 * @returns {Object} Processed error information
 */
export function handleError(error, { context = {}, shouldLog = true } = {}) {
  const type = getErrorType(error);
  const message = getUserMessage(error, type);
  const action = getRecoveryAction(type);
  const retry = isRetryable(type);
  const severity = getErrorSeverity(type);
  const title = ERROR_MESSAGES[type]?.title || 'Error';

  // Log error
  if (shouldLog) {
    logError(error, context);
  }

  return {
    type,
    title,
    message,
    action,
    retry,
    severity,
    originalError: error,
    statusCode: error?.response?.status || error?.status || null,
    details: error?.response?.data || error?.details || null,
  };
}

/**
 * Creates a standardized error object.
 * @param {string} message
 * @param {string} type
 * @param {number} statusCode
 * @param {Object} details
 * @returns {AppError}
 */
export function createError(message, type = ERROR_TYPES.UNKNOWN, statusCode = null, details = null) {
  return new AppError(message, type, statusCode, details);
}

/**
 * Checks if error is a specific type.
 * @param {Error|Object} error
 * @param {string} type
 * @returns {boolean}
 */
export function isErrorType(error, type) {
  return getErrorType(error) === type;
}

/**
 * Extracts validation errors from error response.
 * @param {Error|Object} error
 * @returns {Object|null}
 */
export function getValidationErrors(error) {
  if (error?.response?.data?.errors) {
    return error.response.data.errors;
  }

  if (error?.response?.data?.validation) {
    return error.response.data.validation;
  }

  return null;
}

export default {
  handleError,
  createError,
  isErrorType,
  getValidationErrors,
  AppError,
};
