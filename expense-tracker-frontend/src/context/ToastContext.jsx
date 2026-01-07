import React, { useCallback, useState, useRef } from 'react';
import { ToastContext } from './ToastContextDef';

// Re-export so imports can continue to reference ./ToastContext.jsx
export { ToastContext };

/**
 * ToastContext - Globales Toast-System
 * Verwende: const { addToast } = useToast()
 */
// ToastContext in separate Datei ausgelagert

export function ToastProvider({ children, maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Toast entfernen
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Toast hinzufügen
  const addToast = useCallback(
    (message, options = {}) => {
      const {
        type = 'info', // success, error, warning, info
        duration = 4000, // ms, null = persistent
        action = null, // { label: string, onClick: fn }
      } = options;

      const id = toastIdRef.current++;

      // Neues Toast
      const newToast = {
        id,
        message,
        type,
        duration,
        action,
        timestamp: Date.now(),
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Max Toasts enforzen
        if (updated.length > maxToasts) {
          return updated.slice(updated.length - maxToasts);
        }
        return updated;
      });

      // Auto-dismiss wenn duration gesetzt
      if (duration) {
        // Callback nach unten verschoben, removeToast ist jetzt deklariert
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  

  // Convenience Methods
  const success = useCallback(
    (message, options = {}) => addToast(message, { type: 'success', ...options }),
    [addToast]
  );

  const error = useCallback(
    (message, options = {}) => addToast(message, { type: 'error', duration: 5000, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (message, options = {}) => addToast(message, { type: 'warning', ...options }),
    [addToast]
  );

  const info = useCallback(
    (message, options = {}) => addToast(message, { type: 'info', ...options }),
    [addToast]
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
