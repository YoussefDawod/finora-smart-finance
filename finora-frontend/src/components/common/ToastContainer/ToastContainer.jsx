/**
 * @fileoverview ToastContainer Component
 * @description Container for rendering all active toast notifications.
 * Positioned fixed at top-center of viewport using React Portal.
 * 
 * IMPORTANT: Requires <div id="toast-portal-root"></div> in index.html
 * 
 * @module components/common/ToastContainer
 */

import { createPortal } from 'react-dom';
import { useToast } from '@/hooks';
import Toast from '../Toast/Toast';
import styles from './ToastContainer.module.scss';

// Portal root ID - must match the ID in index.html
const TOAST_PORTAL_ID = 'toast-portal-root';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  // Don't render if no toasts
  if (!toasts || toasts.length === 0) {
    return null;
  }

  // Get the portal root from index.html
  const portalRoot = document.getElementById(TOAST_PORTAL_ID);
  
  if (!portalRoot) {
    console.error(`ToastContainer: Missing <div id="${TOAST_PORTAL_ID}"> in index.html`);
    return null;
  }

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
    portalRoot
  );
}
