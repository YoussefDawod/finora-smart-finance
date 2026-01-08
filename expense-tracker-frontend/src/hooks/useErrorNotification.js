/**
 * Hook for managing error notifications/toasts.
 * Supports severity levels, auto-dismiss, stacking, and deduplication.
 */
import { useState, useCallback, useRef } from 'react';
import { handleError } from '../utils/errorHandler';

let toastIdCounter = 0;

export function useErrorNotification({
  maxToasts = 3,
  position = 'top-right',
  deduplicationWindow = 5000, // 5 seconds
} = {}) {
  const [toasts, setToasts] = useState([]);
  const toastHistoryRef = useRef(new Map());

  /**
   * Generates unique toast ID.
   */
  const generateToastId = useCallback(() => {
    return `toast-${Date.now()}-${toastIdCounter++}`;
  }, []);

  /**
   * Checks if toast is duplicate within deduplication window.
   */
  const isDuplicate = useCallback(
    (message) => {
      const now = Date.now();
      const lastShown = toastHistoryRef.current.get(message);

      if (lastShown && now - lastShown < deduplicationWindow) {
        return true;
      }

      return false;
    },
    [deduplicationWindow]
  );

  /**
   * Records toast in history for deduplication.
   */
  const recordToast = useCallback((message) => {
    toastHistoryRef.current.set(message, Date.now());
  }, []);

  /**
   * Adds a toast notification.
   */
  const addToast = useCallback(
    ({
      type,
      title,
      message,
      severity = 'critical',
      autoDismiss = true,
      dismissAfter,
      onRetry,
    }) => {
      // Deduplication check
      if (isDuplicate(message)) {
        console.log('Duplicate toast prevented:', message);
        return null;
      }

      const id = generateToastId();
      const toast = {
        id,
        type,
        title,
        message,
        severity,
        autoDismiss,
        dismissAfter,
        onRetry,
        onDismiss: removeToast,
        position,
      };

      setToasts((prev) => {
        // Limit to maxToasts
        const updated = [toast, ...prev].slice(0, maxToasts);
        return updated;
      });

      recordToast(message);

      return id;
    },
    [isDuplicate, generateToastId, maxToasts, position, recordToast]
  );

  /**
   * Removes a toast by ID.
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Clears all toasts.
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Shows error notification from error object.
   */
  const showError = useCallback(
    (error, { context = {}, onRetry } = {}) => {
      const processedError = handleError(error, { context, shouldLog: true });

      return addToast({
        type: processedError.type,
        title: processedError.title,
        message: processedError.message,
        severity: processedError.severity,
        autoDismiss: processedError.severity !== 'critical',
        onRetry,
      });
    },
    [addToast]
  );

  /**
   * Shows critical error (no auto-dismiss).
   */
  const showCritical = useCallback(
    (title, message, { onRetry } = {}) => {
      return addToast({
        title,
        message,
        severity: 'critical',
        autoDismiss: false,
        onRetry,
      });
    },
    [addToast]
  );

  /**
   * Shows warning (auto-dismiss after 8s).
   */
  const showWarning = useCallback(
    (title, message, { dismissAfter = 8000, onRetry } = {}) => {
      return addToast({
        title,
        message,
        severity: 'warning',
        autoDismiss: true,
        dismissAfter,
        onRetry,
      });
    },
    [addToast]
  );

  /**
   * Shows info notification (auto-dismiss after 5s).
   */
  const showInfo = useCallback(
    (title, message, { dismissAfter = 5000 } = {}) => {
      return addToast({
        title,
        message,
        severity: 'info',
        autoDismiss: true,
        dismissAfter,
      });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showError,
    showCritical,
    showWarning,
    showInfo,
    position,
  };
}

export default useErrorNotification;
