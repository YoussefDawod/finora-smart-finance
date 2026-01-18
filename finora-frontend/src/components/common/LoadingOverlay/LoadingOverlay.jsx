/**
 * @fileoverview Page Loading Overlay Component
 * @description Full-page loading overlay for navigation and data fetching
 * 
 * FEATURES:
 * - Full-screen overlay
 * - Center-aligned spinner
 * - Optional text message
 * - Smooth fade-in/out animation
 * 
 * @module components/common/LoadingOverlay
 */

import Spinner from '../Spinner/Spinner';
import styles from './LoadingOverlay.module.scss';

/**
 * Loading Overlay for Page Transitions
 * @component
 * @example
 * // Simple overlay
 * <LoadingOverlay isVisible={isLoading} />
 * 
 * // With custom message
 * <LoadingOverlay isVisible={isLoading} message="Daten werden geladen..." />
 */
const LoadingOverlay = ({ 
  isVisible = false, 
  message = 'Wird geladen...',
  spinnerSize = 'lg',
  fullScreen = false
}) => {
  if (!isVisible) return null;

  return (
    <div className={`${styles.overlay} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.content}>
        <Spinner size={spinnerSize} color="primary" />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay;
