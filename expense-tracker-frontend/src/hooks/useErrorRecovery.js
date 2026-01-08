/**
 * Hook for error recovery strategies.
 * Provides automatic retry, manual recovery, and state reset functionality.
 */
import { useState, useCallback, useRef } from 'react';
import { handleError } from '../utils/errorHandler';
import { RETRY_CONFIG } from '../config/errorConfig';

export function useErrorRecovery({
  onRetry,
  maxRetries = RETRY_CONFIG.maxRetries,
  initialDelay = RETRY_CONFIG.initialDelay,
  maxDelay = RETRY_CONFIG.maxDelay,
  backoffMultiplier = RETRY_CONFIG.backoffMultiplier,
  onError,
  context = {},
} = {}) {
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef(null);

  /**
   * Calculates delay for exponential backoff.
   */
  const calculateDelay = useCallback(
    (attempt) => {
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      return Math.min(delay, maxDelay);
    },
    [initialDelay, backoffMultiplier, maxDelay]
  );

  /**
   * Clears any pending retry timeout.
   */
  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Resets error state.
   */
  const reset = useCallback(() => {
    clearRetryTimeout();
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, [clearRetryTimeout]);

  /**
   * Executes retry with exponential backoff.
   */
  const retry = useCallback(
    async (customOnRetry) => {
      const retryFn = customOnRetry || onRetry;

      if (!retryFn) {
        console.warn('No retry function provided');
        return;
      }

      if (retryCount >= maxRetries) {
        console.warn('Max retry attempts reached');
        return;
      }

      setIsRetrying(true);
      const delay = calculateDelay(retryCount);

      return new Promise((resolve, reject) => {
        retryTimeoutRef.current = setTimeout(async () => {
          try {
            await retryFn();
            reset();
            resolve();
          } catch (err) {
            const processedError = handleError(err, { context, shouldLog: true });
            setError(processedError);
            setRetryCount((prev) => prev + 1);
            setIsRetrying(false);

            if (onError) {
              onError(processedError);
            }

            reject(err);
          }
        }, delay);
      });
    },
    [onRetry, retryCount, maxRetries, calculateDelay, reset, context, onError]
  );

  /**
   * Executes automatic retry for retryable errors.
   */
  const autoRetry = useCallback(
    async (err) => {
      const processedError = handleError(err, { context, shouldLog: true });
      setError(processedError);

      if (processedError.retry && retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        await retry();
      } else {
        if (onError) {
          onError(processedError);
        }
      }
    },
    [context, retryCount, maxRetries, retry, onError]
  );

  /**
   * Manual retry without automatic backoff.
   */
  const manualRetry = useCallback(async () => {
    if (!onRetry) {
      console.warn('No retry function provided');
      return;
    }

    setIsRetrying(true);

    try {
      await onRetry();
      reset();
    } catch (err) {
      const processedError = handleError(err, { context, shouldLog: true });
      setError(processedError);
      setIsRetrying(false);

      if (onError) {
        onError(processedError);
      }

      throw err;
    }
  }, [onRetry, reset, context, onError]);

  /**
   * Navigates to home page.
   */
  const goHome = useCallback(() => {
    reset();
    window.location.href = '/';
  }, [reset]);

  /**
   * Contacts support (placeholder).
   */
  const contactSupport = useCallback(() => {
    // TODO: Implement support contact mechanism
    window.location.href = '/support';
  }, []);

  /**
   * Handles error with automatic retry if applicable.
   */
  const handleErrorWithRecovery = useCallback(
    async (err) => {
      const processedError = handleError(err, { context, shouldLog: true });
      setError(processedError);

      if (processedError.retry && retryCount < maxRetries) {
        await autoRetry(err);
      } else {
        if (onError) {
          onError(processedError);
        }
      }
    },
    [context, retryCount, maxRetries, autoRetry, onError]
  );

  return {
    error,
    retryCount,
    isRetrying,
    canRetry: error?.retry && retryCount < maxRetries,
    retry: manualRetry,
    autoRetry,
    reset,
    goHome,
    contactSupport,
    handleError: handleErrorWithRecovery,
  };
}

export default useErrorRecovery;
