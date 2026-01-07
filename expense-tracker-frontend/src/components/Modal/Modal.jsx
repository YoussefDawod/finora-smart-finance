import React, { useEffect, useRef } from 'react';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';
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

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal modal--${size} animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
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
      </div>
    </div>
  );
}

export default Modal;
