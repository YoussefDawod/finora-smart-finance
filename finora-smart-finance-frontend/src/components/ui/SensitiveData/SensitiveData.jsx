/**
 * @fileoverview SensitiveData Component
 * @description Blurs sensitive data for viewer role users.
 *              Defense-in-Depth: Backend masks data + Frontend blurs display.
 *
 * @module components/ui/SensitiveData
 */

import { useTranslation } from 'react-i18next';
import styles from './SensitiveData.module.scss';

/**
 * Wraps children in a blur filter when active (viewer mode).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to potentially blur
 * @param {boolean} props.active - Whether blur is active (true for viewer)
 */
export default function SensitiveData({ children, active }) {
  const { t } = useTranslation();

  if (!active) return <>{children}</>;

  return (
    <span
      className={styles.blurred}
      aria-label={t('admin.viewer.sensitiveHidden')}
      title={t('admin.viewer.sensitiveHidden')}
    >
      {children}
    </span>
  );
}
