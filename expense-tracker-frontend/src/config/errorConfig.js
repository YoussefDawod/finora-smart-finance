/**
 * Error configuration and error type definitions.
 */

/**
 * Error types enum.
 */
export const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  NETWORK: 'NetworkError',
  AUTH: 'AuthError',
  NOT_FOUND: 'NotFoundError',
  SERVER: 'ServerError',
  TIMEOUT: 'TimeoutError',
  CONFLICT: 'ConflictError',
  UNKNOWN: 'UnknownError',
};

/**
 * HTTP status code to error type mapping.
 */
export const HTTP_STATUS_TO_ERROR_TYPE = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTH,
  403: ERROR_TYPES.AUTH,
  404: ERROR_TYPES.NOT_FOUND,
  408: ERROR_TYPES.TIMEOUT,
  409: ERROR_TYPES.CONFLICT,
  422: ERROR_TYPES.VALIDATION,
  429: ERROR_TYPES.NETWORK,
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.SERVER,
  503: ERROR_TYPES.SERVER,
  504: ERROR_TYPES.TIMEOUT,
};

/**
 * User-friendly error messages by error type.
 */
export const ERROR_MESSAGES = {
  [ERROR_TYPES.VALIDATION]: {
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    action: 'Fix the errors and resubmit.',
  },
  [ERROR_TYPES.NETWORK]: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    action: 'Check your connection and retry.',
  },
  [ERROR_TYPES.AUTH]: {
    title: 'Authentication Error',
    message: 'You are not authorized to perform this action.',
    action: 'Please log in and try again.',
  },
  [ERROR_TYPES.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    action: 'Check the URL or return to the home page.',
  },
  [ERROR_TYPES.SERVER]: {
    title: 'Server Error',
    message: 'The server encountered an error. Please try again later.',
    action: 'Wait a moment and try again.',
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    action: 'Try again or check your connection.',
  },
  [ERROR_TYPES.CONFLICT]: {
    title: 'Data Conflict',
    message: 'The data has been modified by someone else.',
    action: 'Refresh and try again.',
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again or contact support.',
  },
};

/**
 * Retryable error types.
 */
export const RETRYABLE_ERROR_TYPES = [
  ERROR_TYPES.NETWORK,
  ERROR_TYPES.TIMEOUT,
  ERROR_TYPES.SERVER,
];

/**
 * Error severity levels.
 */
export const ERROR_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Error type to severity mapping.
 */
export const ERROR_TYPE_TO_SEVERITY = {
  [ERROR_TYPES.VALIDATION]: ERROR_SEVERITY.WARNING,
  [ERROR_TYPES.NETWORK]: ERROR_SEVERITY.WARNING,
  [ERROR_TYPES.AUTH]: ERROR_SEVERITY.CRITICAL,
  [ERROR_TYPES.NOT_FOUND]: ERROR_SEVERITY.INFO,
  [ERROR_TYPES.SERVER]: ERROR_SEVERITY.CRITICAL,
  [ERROR_TYPES.TIMEOUT]: ERROR_SEVERITY.WARNING,
  [ERROR_TYPES.CONFLICT]: ERROR_SEVERITY.WARNING,
  [ERROR_TYPES.UNKNOWN]: ERROR_SEVERITY.CRITICAL,
};

/**
 * Default retry configuration.
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1s
  maxDelay: 8000, // 8s
  backoffMultiplier: 2,
};

export default {
  ERROR_TYPES,
  HTTP_STATUS_TO_ERROR_TYPE,
  ERROR_MESSAGES,
  RETRYABLE_ERROR_TYPES,
  ERROR_SEVERITY,
  ERROR_TYPE_TO_SEVERITY,
  RETRY_CONFIG,
};
