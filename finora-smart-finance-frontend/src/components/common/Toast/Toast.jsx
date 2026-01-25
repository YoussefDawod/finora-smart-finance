/**
 * @fileoverview Toast Notification Component
 * @description Individual toast notification with auto-dismiss, animations,
 * and action button support.
 * 
 * FEATURES:
 * - Type-based icons and colors (success, error, warning, info)
 * - Smooth animations (slide-in from top)
 * - Progress bar for auto-dismiss
 * - Manual dismiss button
 * - Optional action button
 * - Keyboard accessible
 * 
 * @module components/common/Toast
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Toast.module.scss';

// Toast type icons
const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export default function Toast({ 
  id,
  message, 
  type = 'info', 
  duration = 5000,
  action,
  onClose 
}) {
  const { t } = useTranslation();
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300); // Match animation duration
  }, [id, onClose]);

  // Auto-dismiss with progress bar
  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = 50; // Update every 50ms

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressValue = (remaining / duration) * 100;
      
      setProgress(progressValue);

      if (remaining <= 0) {
        clearInterval(timer);
        handleClose();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [duration, handleClose]);

  const handleAction = () => {
    action?.onClick();
    handleClose();
  };

  return (
    <div 
      className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exiting : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">
          {TOAST_ICONS[type]}
        </span>
        <span className={styles.message}>{message}</span>
      </div>

      <div className={styles.actions}>
        {action && (
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleAction}
          >
            {action.label}
          </button>
        )}
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label={t('common.closeNotification')}
        >
          ✕
        </button>
      </div>

      {duration > 0 && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
