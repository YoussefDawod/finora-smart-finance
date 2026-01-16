/**
 * @fileoverview ToastContainer Component
 * @description Container for rendering all active toast notifications.
 * Positioned fixed at top-center of viewport.
 * 
 * @module components/common/ToastContainer
 */

import { createPortal } from 'react-dom';
import { useToast } from '@/hooks';
import Toast from '../Toast/Toast';
import styles from './ToastContainer.module.scss';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  // Render via portal to document.body to avoid stacking contexts
  if (!globalThis.document?.body) {
    console.warn('⚠️ ToastContainer: document.body not available');
    return null;
  }

  console.log('✅ ToastContainer rendering', toasts.length, 'toasts');

  return createPortal(
    <div className={styles.toastContainer} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>,
    document.body,
  );
}
