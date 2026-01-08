/**
 * Error recovery strategies and utilities.
 */
import { handleError } from '../utils/errorHandler';
import { RETRY_CONFIG } from '../config/errorConfig';

/**
 * Executes a function with automatic retry on failure.
 * @param {Function} fn - Function to execute
 * @param {Object} options - Retry configuration
 * @returns {Promise}
 */
export async function retryWithBackoff(
  fn,
  {
    maxRetries = RETRY_CONFIG.maxRetries,
    initialDelay = RETRY_CONFIG.initialDelay,
    maxDelay = RETRY_CONFIG.maxDelay,
    backoffMultiplier = RETRY_CONFIG.backoffMultiplier,
    shouldRetry = () => true,
    onRetry = null,
    context = {},
  } = {}
) {
  let lastError;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const processedError = handleError(error, { context, shouldLog: true });

      // Check if error is retryable
      if (!processedError.retry || !shouldRetry(processedError, attempt)) {
        throw error;
      }

      // Max retries reached
      if (attempt >= maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      // Notify retry callback
      if (onRetry) {
        onRetry(attempt + 1, delay, processedError);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      attempt++;
    }
  }

  throw lastError;
}

/**
 * Wraps a function with error recovery.
 * @param {Function} fn - Function to wrap
 * @param {Object} recoveryOptions - Recovery configuration
 * @returns {Function}
 */
export function withErrorRecovery(fn, recoveryOptions = {}) {
  return async (...args) => {
    return retryWithBackoff(() => fn(...args), recoveryOptions);
  };
}

/**
 * Resets application state (local storage, etc.).
 */
export function resetState() {
  // Clear local storage
  const keysToKeep = ['theme', 'language']; // Keep user preferences
  const allKeys = Object.keys(localStorage);

  allKeys.forEach((key) => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // Clear session storage
  sessionStorage.clear();

  // Clear any app-specific state
  // TODO: Dispatch reset actions if using state management (Redux, Zustand, etc.)

  console.log('Application state reset');
}

/**
 * Navigates to home page and resets state.
 */
export function goHomeAndReset() {
  resetState();
  window.location.href = '/';
}

/**
 * Reloads the page (hard refresh).
 */
export function hardReload() {
  window.location.reload();
}

/**
 * Contacts support with error context.
 * @param {Object} error - Error object
 * @param {Object} context - Additional context
 */
export function contactSupport(error, context = {}) {
  const errorData = {
    message: error?.message || 'Unknown error',
    type: error?.type || 'Unknown',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
  };

  // TODO: Implement actual support contact mechanism
  // For now, navigate to support page with error data in URL params
  const params = new URLSearchParams({
    error: JSON.stringify(errorData),
  });

  window.location.href = `/support?${params.toString()}`;
}

/**
 * Creates a retry strategy with custom configuration.
 * @param {Object} config - Retry configuration
 * @returns {Function}
 */
export function createRetryStrategy(config = {}) {
  const mergedConfig = { ...RETRY_CONFIG, ...config };

  return (fn) => withErrorRecovery(fn, mergedConfig);
}

/**
 * Logs error to error tracking service.
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function logErrorToService(error, context = {}) {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    console.error('Error logged:', error, context);
  } else {
    // TODO: Send to Sentry or other error tracking service
    // Sentry.captureException(error, { extra: context });
    console.error('Production error logged:', error?.message || error);
  }
}

/**
 * Recovery strategy factory.
 */
export const RecoveryStrategies = {
  /**
   * Automatic retry with exponential backoff.
   */
  autoRetry: (fn, options = {}) => retryWithBackoff(fn, options),

  /**
   * Manual retry (no automatic retry).
   */
  manualRetry: async (fn) => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, { shouldLog: true });
      throw error;
    }
  },

  /**
   * Reset state and retry.
   */
  resetAndRetry: async (fn) => {
    resetState();
    return RecoveryStrategies.autoRetry(fn);
  },

  /**
   * Go to home page.
   */
  goHome: () => {
    window.location.href = '/';
  },

  /**
   * Contact support.
   */
  contactSupport: (error, context) => contactSupport(error, context),

  /**
   * Hard reload page.
   */
  hardReload: () => hardReload(),
};

export default {
  retryWithBackoff,
  withErrorRecovery,
  resetState,
  goHomeAndReset,
  hardReload,
  contactSupport,
  createRetryStrategy,
  logErrorToService,
  RecoveryStrategies,
};
