import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';
import { modalVariants } from '../../config/animationVariants';
import './Modal.scss';

/**
 * Modal Component - WCAG 2.1 Level AA konform
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - title: string
 *   - children: ReactNode
 *   - size: 'sm' | 'md' | 'lg'
 */
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const reduceMotion = useReducedMotion();
  const variants = modalVariants(reduceMotion);

  // Keyboard Navigation mit Focus Trap
  useKeyboardNavigation(modalRef, {
    onEscape: onClose,
    trapFocus: isOpen,
    restoreFocus: true,
  });

  // Focus Management
  useEffect(() => {
    if (isOpen) {
      // Speichere aktuellen Focus
      previousActiveElement.current = document.activeElement;

      // Setze Focus auf Modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      // Body Scroll sperren
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = 'unset';
        
        // Restore Focus
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay glass"
          onClick={onClose}
          role="presentation"
          variants={variants.overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            ref={modalRef}
            className={`modal modal--${size} glass shadow-elevated`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            variants={variants.content}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <div className="modal__header">
              <h2 id="modal-title" className="modal__title">
                {title}
              </h2>
              <button
                className="modal__close"
                onClick={onClose}
                aria-label="Modal schließen"
                title="Schließen (ESC)"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="modal__body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
