/**
 * @fileoverview Alert Component
 * @description Reusable alert for success, info, warning, error states
 */

import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './Alert.module.scss';

const ICONS = {
  success: FiCheckCircle,
  info: FiInfo,
  warning: FiAlertTriangle,
  error: FiAlertCircle,
};

const Alert = ({
  type = 'info',
  title,
  message,
  children,
  onClose,
  icon: IconOverride,
  className = '',
}) => {
  const { t } = useTranslation();
  const Icon = IconOverride || ICONS[type] || FiInfo;
  const hasContent = Boolean(message || children);

  return (
    <div
      className={`${styles.alert} ${styles[type]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.iconWrapper}>
        <Icon aria-hidden="true" />
      </div>

      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        {hasContent && (
          <div className={styles.message}>
            {message && <p>{message}</p>}
            {children}
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('common.closeNotification')}
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export default Alert;
