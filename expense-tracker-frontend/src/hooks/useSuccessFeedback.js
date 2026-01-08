/**
 * Hook for managing success states and feedback.
 * Handles success animation, confetti, and auto-dismiss.
 */
import { useState, useCallback } from 'react';

/**
 * Hook for managing success feedback.
 * @param {Object} options - Configuration options
 * @returns {Object} Success state and handlers
 */
export function useSuccessFeedback({
  duration = 2000,
  onSuccess = null,
} = {}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccessState = useCallback((message = 'Success!') => {
    setSuccessMessage(message);
    setShowSuccess(true);

    const timeout = setTimeout(() => {
      setShowSuccess(false);
      onSuccess?.();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onSuccess]);

  const hideSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  return {
    showSuccess,
    successMessage,
    showSuccessState,
    hideSuccess,
  };
}

export default useSuccessFeedback;
