/**
 * @fileoverview Toast Notification Component
 * @description Individual toast notification with auto-dismiss, swipe-to-dismiss,
 * and action button support. Uses a phase state machine for clean animations.
 * 
 * ANIMATION APPROACH:
 * All exit animations use inline CSS transitions (not keyframe animations).
 * This ensures animations always start from the toast's current position,
 * avoiding "jump to center" artifacts during swipe gestures.
 * 
 * PHASES:
 * - idle:       Normal display state
 * - swiping:    Finger actively on screen, toast follows finger
 * - snapping:   Animating back to center after short swipe (<80px)
 * - exit-left:  Swipe-left exit animation
 * - exit-right: Swipe-right exit animation
 * - exit-up:    Auto-dismiss / close button exit animation
 * 
 * @module components/common/Toast
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import styles from './Toast.module.scss';

// Toast type icons (Feather Icons)
const TOAST_ICONS = {
  success: <FiCheck />,
  error: <FiX />,
  warning: <FiAlertTriangle />,
  info: <FiInfo />,
};

// Animation timing constants
const EXIT_DURATION = 300;   // ms - exit animation
const SNAP_DURATION = 200;   // ms - snap-back animation
const SWIPE_THRESHOLD = 80;  // px - minimum distance for swipe dismiss

export default function Toast({ 
  id,
  message, 
  type = 'info', 
  duration = 5000,
  action,
  onClose 
}) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(100);
  const [phase, setPhase] = useState('idle');
  const [translateX, setTranslateX] = useState(0);

  // Refs for values that shouldn't trigger re-renders
  const touchStartXRef = useRef(null);
  const isExitingRef = useRef(false);

  /**
   * Trigger exit animation and schedule DOM removal.
   * Uses ref guard to prevent double-triggering.
   */
  const triggerExit = useCallback((exitPhase) => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setPhase(exitPhase);
    setTimeout(() => onClose?.(id), EXIT_DURATION);
  }, [id, onClose]);

  // ============================================
  // AUTO-DISMISS TIMER + PROGRESS BAR
  // ============================================
  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);

      if (remaining <= 0) {
        clearInterval(timer);
        triggerExit('exit-up');
      }
    }, 50);

    return () => clearInterval(timer);
  }, [duration, triggerExit]);

  // ============================================
  // TOUCH / SWIPE HANDLERS
  // ============================================
  const handleTouchStart = (e) => {
    if (isExitingRef.current || phase === 'snapping') return;
    touchStartXRef.current = e.touches[0].clientX;
    setPhase('swiping');
  };

  const handleTouchMove = (e) => {
    if (phase !== 'swiping' || touchStartXRef.current === null) return;
    setTranslateX(e.touches[0].clientX - touchStartXRef.current);
  };

  const handleTouchEnd = () => {
    if (phase !== 'swiping') return;
    touchStartXRef.current = null;

    if (Math.abs(translateX) > SWIPE_THRESHOLD) {
      // Swipe far enough → dismiss in swipe direction
      triggerExit(translateX < 0 ? 'exit-left' : 'exit-right');
    } else {
      // Not far enough → snap back to center
      setPhase('snapping');
      setTimeout(() => {
        if (!isExitingRef.current) {
          setPhase('idle');
          setTranslateX(0);
        }
      }, SNAP_DURATION);
    }
  };

  // ============================================
  // BUTTON HANDLERS
  // ============================================
  const handleClose = () => triggerExit('exit-up');

  const handleAction = () => {
    action?.onClick();
    triggerExit('exit-up');
  };

  // ============================================
  // INLINE STYLE COMPUTATION (phase-based)
  // ============================================
  const computeStyle = () => {
    switch (phase) {
      case 'swiping':
        return {
          transform: `translateX(${translateX}px)`,
          opacity: Math.max(0.3, 1 - Math.abs(translateX) / 300),
          transition: 'none',
        };
      case 'snapping':
        return {
          transform: 'translateX(0)',
          opacity: 1,
          transition: `transform ${SNAP_DURATION}ms ease-out, opacity ${SNAP_DURATION}ms ease-out`,
        };
      case 'exit-left':
        return {
          transform: 'translateX(-120%)',
          opacity: 0,
          transition: `transform ${EXIT_DURATION}ms ease-in, opacity ${EXIT_DURATION}ms ease-in`,
        };
      case 'exit-right':
        return {
          transform: 'translateX(120%)',
          opacity: 0,
          transition: `transform ${EXIT_DURATION}ms ease-in, opacity ${EXIT_DURATION}ms ease-in`,
        };
      case 'exit-up':
        return {
          transform: 'translateY(-150%)',
          opacity: 0,
          transition: `transform ${EXIT_DURATION}ms ease-in, opacity ${EXIT_DURATION}ms ease-in`,
        };
      default: // idle
        return {};
    }
  };

  return (
    <div 
      className={`${styles.toast} ${styles[type]}`}
      role="alert"
      aria-live="polite"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={computeStyle()}
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
          <FiX />
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
