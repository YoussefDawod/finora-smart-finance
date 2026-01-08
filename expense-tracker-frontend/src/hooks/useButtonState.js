/**
 * Hook for managing button loading and success states.
 * Handles loading spinner, text fade, and success feedback.
 */
import { useState, useCallback } from 'react';

/**
 * @param {Function} onAction - Async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} State and handlers
 */
export function useButtonState(onAction, { showSuccessFor = 1500 } = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    if (isLoading || isSuccess) return;

    setIsLoading(true);
    setError(null);

    try {
      await onAction();
      setIsLoading(false);
      setIsSuccess(true);

      // Show success state briefly
      const timeout = setTimeout(() => {
        setIsSuccess(false);
      }, showSuccessFor);

      return () => clearTimeout(timeout);
    } catch (err) {
      setIsLoading(false);
      setError(err);
      throw err;
    }
  }, [isLoading, isSuccess, onAction, showSuccessFor]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  return {
    isLoading,
    isSuccess,
    error,
    execute,
    reset,
  };
}

export default useButtonState;
