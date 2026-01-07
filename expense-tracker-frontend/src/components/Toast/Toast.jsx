import React, { useState } from 'react';
import './Toast.scss';

/**
 * Einzelnes Toast Element
 * Props:
 *   - id: number
 *   - message: string
 *   - type: 'success' | 'error' | 'warning' | 'info'
 *   - onClose: (id) => void
 *   - action: { label: string, onClick: fn }
 */
function Toast({ id, message, type = 'info', onClose, action, duration }) {
  const [isExiting, setIsExiting] = useState(false);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const handleAction = () => {
    if (action?.onClick) {
      action.onClick();
    }
    handleClose();
  };

  return (
    <div
      className={`toast toast--${type} ${isExiting ? 'toast--exiting' : ''} animate-slide-in-up`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast__content">
        <span className={`toast__icon toast__icon--${type}`}>{icons[type]}</span>
        <p className="toast__message">{message}</p>
      </div>

      <div className="toast__actions">
        {action && (
          <button className="toast__action-btn" onClick={handleAction}>
            {action.label}
          </button>
        )}
        <button
          className="toast__close"
          onClick={handleClose}
          aria-label="Toast schließen"
          title="Schließen"
        >
          ✕
        </button>
      </div>

      {/* Progress Bar für Auto-Dismiss */}
      {duration && (
        <div className="toast__progress" style={{ '--duration': `${duration}ms` }} />
      )}
    </div>
  );
}

export default Toast;
