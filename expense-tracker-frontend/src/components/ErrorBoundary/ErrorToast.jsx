/**
 * ErrorToast component - Displays error notifications.
 * Supports severity levels, auto-dismiss, stacking, and deduplication.
 */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './ErrorToast.scss';

const ErrorToast = ({
  id,
  type,
  title,
  message,
  severity = 'critical',
  autoDismiss = true,
  dismissAfter,
  onDismiss,
  onRetry,
  position = 'top-right',
}) => {
  const dismissTimeoutRef = useRef(null);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-dismiss logic
  useEffect(() => {
    if (!autoDismiss) return;

    // Default dismiss times based on severity
    const defaultDismissTime = severity === 'critical' ? null : severity === 'warning' ? 8000 : 5000;
    const timeout = dismissAfter ?? defaultDismissTime;

    if (timeout) {
      dismissTimeoutRef.current = setTimeout(() => {
        onDismiss?.(id);
      }, timeout);
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [id, autoDismiss, dismissAfter, severity, onDismiss]);

  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 9v4M12 17h.01M5 19h14a2 2 0 001.7-3L13.7 4a2 2 0 00-3.4 0L3.3 16a2 2 0 001.7 3z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'info':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const animations = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.95 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.95 },
      };

  return (
    <motion.div
      className={`error-toast error-toast--${severity} error-toast--${position}`}
      {...animations}
      transition={{ duration: 0.2 }}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-toast__icon">{getSeverityIcon()}</div>

      <div className="error-toast__content">
        {title && <h4 className="error-toast__title">{title}</h4>}
        <p className="error-toast__message">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={() => {
              onRetry();
              onDismiss?.(id);
            }}
            className="error-toast__retry"
          >
            Retry
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss?.(id)}
        className="error-toast__close"
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </motion.div>
  );
};

ErrorToast.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(['critical', 'warning', 'info']),
  autoDismiss: PropTypes.bool,
  dismissAfter: PropTypes.number,
  onDismiss: PropTypes.func,
  onRetry: PropTypes.func,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
};

/**
 * ErrorToastContainer - Manages multiple error toasts.
 */
export const ErrorToastContainer = ({ toasts, position = 'top-right', maxToasts = 3 }) => {
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <div className={`error-toast-container error-toast-container--${position}`}>
      <AnimatePresence mode="sync">
        {visibleToasts.map((toast) => (
          <ErrorToast key={toast.id} {...toast} position={position} />
        ))}
      </AnimatePresence>
    </div>
  );
};

ErrorToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(PropTypes.object).isRequired,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
  maxToasts: PropTypes.number,
};

export default ErrorToast;
