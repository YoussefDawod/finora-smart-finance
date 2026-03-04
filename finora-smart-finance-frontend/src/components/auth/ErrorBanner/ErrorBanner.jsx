/**
 * @fileoverview ErrorBanner Component
 * @description Shared animated error banner for auth forms
 * Replaces 5 duplicated error banner patterns across auth forms.
 *
 * @module components/auth/ErrorBanner
 */

import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import { useMotion } from '@/hooks/useMotion';
import styles from './ErrorBanner.module.scss';

/**
 * Animated error banner for displaying API errors in auth forms.
 *
 * @param {Object} props
 * @param {string} props.error - Error message to display
 * @param {Function} [props.onDismiss] - Callback to dismiss the error (shows dismiss button when provided)
 * @param {string} [props.dismissAriaLabel] - Aria label for dismiss button
 */
export default function ErrorBanner({ error, onDismiss, dismissAriaLabel }) {
  const { shouldAnimate } = useMotion();

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className={styles.errorBanner}
          initial={shouldAnimate ? { opacity: 0, height: 0 } : false}
          animate={shouldAnimate ? { opacity: 1, height: 'auto' } : false}
          exit={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
          transition={{ duration: 0.2 }}
        >
          <FiAlertCircle className={styles.errorIcon} />
          <span className={styles.errorText}>{error}</span>
          {onDismiss && (
            <button
              type="button"
              className={styles.errorDismiss}
              onClick={onDismiss}
              aria-label={dismissAriaLabel}
            >
              <FiX />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
