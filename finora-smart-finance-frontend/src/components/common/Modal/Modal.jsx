/**
 * ============================================================================
 * MODAL COMPONENT
 * ============================================================================
 * @description Universelles Modal mit Blur-Effekt und Framer Motion
 * 
 * FEATURES:
 * - Backdrop mit Blur-Effekt
 * - Framer Motion Animationen
 * - ESC-Taste schließen
 * - Click-Outside schließen
 * - Body Scroll Lock
 * - Responsive Design
 * - RTL Support
 * 
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose} title="Edit Transaction">
 *   <TransactionForm />
 * </Modal>
 */

import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './Modal.module.scss';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const overlayVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================
const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer = null,
  size = 'medium', // 'small' | 'medium' | 'large' | 'fullWidth'
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE ESC KEY
  // ──────────────────────────────────────────────────────────────────────
  const handleEscKey = useCallback(
    (event) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose?.();
      }
    },
    [closeOnEsc, onClose]
  );

  // ──────────────────────────────────────────────────────────────────────
  // FOCUS TRAP & MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Speichere das aktuell fokussierte Element
    previousActiveElement.current = document.activeElement;

    // Fokussiere das Modal nach dem Öffnen
    const timer = setTimeout(() => {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements?.length) {
        focusableElements[0].focus();
      }
    }, 50);

    // Focus-Trap Handler
    const handleTabKey = (e) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleTabKey);
      // Fokus zurücksetzen beim Schließen
      previousActiveElement.current?.focus?.();
    };
  }, [isOpen]);

  // ──────────────────────────────────────────────────────────────────────
  // BODY SCROLL LOCK
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Add ESC listener
      if (closeOnEsc) {
        document.addEventListener('keydown', handleEscKey);
      }

      return () => {
        // Restore body scroll
        document.body.style.overflow = originalOverflow;
        // Remove ESC listener
        if (closeOnEsc) {
          document.removeEventListener('keydown', handleEscKey);
        }
      };
    }
  }, [isOpen, closeOnEsc, handleEscKey]);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE OVERLAY CLICK
  // ──────────────────────────────────────────────────────────────────────
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlayClick) {
      onClose?.();
    }
  }, [closeOnOverlayClick, onClose]);

  // ──────────────────────────────────────────────────────────────────────
  // RENDER IN PORTAL
  // ──────────────────────────────────────────────────────────────────────
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            className={`${styles.modal} ${styles[size]} ${className}`}
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Prevent overlay click
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* HEADER */}
            {(title || showCloseButton) && (
              <div className={styles.header}>
                {title && (
                  <h2 id="modal-title" className={styles.title}>
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label={t('common.closeModal')}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* BODY */}
            <div className={styles.body}>{children}</div>

            {/* FOOTER */}
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
