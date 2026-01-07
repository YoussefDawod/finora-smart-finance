import React from 'react';
import { useToast } from '../../hooks';
import Toast from './Toast';
import './ToastContainer.scss';

/**
 * Toast Container - Zeigt alle Toasts an
 * Wird oben in der App eingefügt
 */
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container" role="region" aria-label="Benachrichtigungen">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          action={toast.action}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
