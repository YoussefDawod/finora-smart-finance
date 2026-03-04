/**
 * @fileoverview QuotaIndicator Component
 * @description Zeigt den monatlichen Transaktions-Quota-Status als Fortschrittsbalken
 *
 * @module components/dashboard/QuotaIndicator
 */

import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiAlertTriangle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import { useMotion } from '@/hooks/useMotion';
import styles from './QuotaIndicator.module.scss';

/**
 * Quota-Status-Farbe und Label berechnen
 * @param {number} used - Aktuelle Nutzung
 * @param {number} limit - Monatliches Limit
 * @param {Function} t - i18n Translation Funktion
 * @returns {{ color: string, showWarning: boolean }}
 */
function getQuotaStatus(used, limit, t) {
  const percent = (used / limit) * 100;

  if (percent >= 100) {
    return { color: 'danger', label: t('lifecycle.quota.exceeded'), showWarning: true };
  }
  if (percent >= 80) {
    return { color: 'warning', label: null, showWarning: true };
  }
  if (percent >= 50) {
    return { color: 'info', label: null, showWarning: false };
  }
  return { color: 'success', label: null, showWarning: false };
}

function QuotaIndicator({ quota, isLoading = false }) {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const statusInfo = useMemo(() => {
    if (!quota) return { color: 'neutral', label: null, showWarning: false };
    return getQuotaStatus(quota.used, quota.limit, t);
  }, [quota, t]);

  const percentUsed = useMemo(() => {
    if (!quota || !quota.limit) return 0;
    return Math.round((quota.used / quota.limit) * 100);
  }, [quota]);

  // Loading State
  if (isLoading) {
    return (
      <div className={styles.quotaIndicator}>
        <div className={styles.header}>
          <Skeleton width="140px" height="18px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="var(--r-full)" />
        <div className={styles.stats}>
          <Skeleton width="100px" height="14px" />
          <Skeleton width="80px" height="14px" />
        </div>
      </div>
    );
  }

  // Keine Quota-Daten
  if (!quota) return null;

  return (
    <motion.div
      className={styles.quotaIndicator}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <FiActivity className={styles.icon} />
          <h3>{t('lifecycle.quota.title')}</h3>
        </div>
        {statusInfo.showWarning && (
          <span className={`${styles.badge} ${styles[statusInfo.color]}`}>
            <FiAlertTriangle />
            {statusInfo.label || `${percentUsed}%`}
          </span>
        )}
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <motion.div
            className={`${styles.progressFill} ${styles[statusInfo.color]}`}
            initial={shouldAnimate ? { width: 0 } : false}
            animate={shouldAnimate ? { width: `${Math.min(percentUsed, 100)}%` } : { width: `${Math.min(percentUsed, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span className={styles.percentLabel}>{percentUsed}%</span>
      </div>

      <div className={styles.stats}>
        <span className={styles.used}>
          {t('lifecycle.quota.used', { used: quota.used, limit: quota.limit })}
        </span>
        <span className={styles.remaining}>
          {t('lifecycle.quota.remaining', { remaining: quota.remaining })}
        </span>
      </div>
    </motion.div>
  );
}

const MemoizedQuotaIndicator = memo(QuotaIndicator);
MemoizedQuotaIndicator.displayName = 'QuotaIndicator';
export default MemoizedQuotaIndicator;
