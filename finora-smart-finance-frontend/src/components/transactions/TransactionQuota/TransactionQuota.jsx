/**
 * @fileoverview TransactionQuota Component
 * @description Kompakter Transaktions-Zähler für den Transaktions-Header.
 *
 * Zeigt die Anzahl der aktuell gefilterten Transaktionen (`totalItems`)
 * und — für eingeloggte User — den Fortschritt zum monatlichen Limit.
 *
 * Farbstufen (gleich wie QuotaIndicator):
 *   < 50 % → success
 *   50–79 % → info
 *   80–99 % → warning
 *   ≥ 100 % → danger
 *
 * @module components/transactions/TransactionQuota
 */

import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import styles from './TransactionQuota.module.scss';

/**
 * Berechnet die Farbstufe basierend auf der Quota-Auslastung
 * @param {number} used
 * @param {number} limit
 * @returns {'success'|'info'|'warning'|'danger'}
 */
function getQuotaLevel(used, limit) {
  if (!limit || limit <= 0) return 'success';
  const percent = (used / limit) * 100;
  if (percent >= 100) return 'danger';
  if (percent >= 80) return 'warning';
  if (percent >= 50) return 'info';
  return 'success';
}

/**
 * Kompakter Transaktions-Zähler für den Transaktions-Header
 *
 * @param {Object} props
 * @param {Object|null} props.quota  - Quota-Objekt { used, limit, remaining }
 * @param {number}      props.totalItems - Gesamtanzahl gefilterte Transaktionen
 * @param {boolean}     [props.isGuest=false] - Gastmodus (kein Limit)
 */
function TransactionQuota({ quota, totalItems = 0, isGuest = false }) {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const { count, limit, percent, level, showWarning, hasQuota } = useMemo(() => {
    const c = totalItems;

    if (isGuest || !quota) {
      return {
        count: c,
        limit: null,
        percent: 0,
        level: 'neutral',
        showWarning: false,
        hasQuota: false,
      };
    }

    const l = quota.limit ?? 0;
    const quotaUsed = quota.used ?? 0;
    const p = l > 0 ? Math.round((quotaUsed / l) * 100) : 0;
    const lv = getQuotaLevel(quotaUsed, l);

    return {
      count: c,
      limit: l,
      percent: p,
      level: lv,
      showWarning: lv === 'warning' || lv === 'danger',
      hasQuota: true,
    };
  }, [quota, totalItems, isGuest]);

  return (
    <motion.div
      className={styles.transactionQuota}
      initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : false}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.25 }}
      role="status"
      aria-label={
        hasQuota
          ? t('transactions.quota.aria', { count, limit })
          : t('transactions.quota.ariaGuest', { count })
      }
    >
      {/* Zähler */}
      <div className={`${styles.counter} ${styles[level]}`}>
        <span className={styles.count} data-testid="quota-count">
          {count}
        </span>

        {hasQuota && (
          <>
            <span className={styles.separator}>/</span>
            <span className={styles.limit}>{limit}</span>
          </>
        )}
      </div>

      {/* Progress-Bar (nur für eingeloggte User mit Limit) */}
      {hasQuota && (
        <div className={styles.progressContainer}>
          <div className={styles.progressTrack}>
            <motion.div
              className={`${styles.progressFill} ${styles[level]}`}
              initial={shouldAnimate ? { width: 0 } : false}
              animate={
                shouldAnimate
                  ? { width: `${Math.min(percent, 100)}%` }
                  : { width: `${Math.min(percent, 100)}%` }
              }
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Label (nur für Gäste ohne Progress-Bar) */}
      {!hasQuota && (
        <span className={styles.label}>{t('transactions.quota.label', 'Transaktionen')}</span>
      )}

      {/* Warnhinweis */}
      {showWarning && (
        <div className={`${styles.warning} ${styles[level]}`}>
          <FiAlertTriangle aria-hidden="true" />
          <span>
            {level === 'danger' ? t('lifecycle.quota.exceeded') : t('transactions.quota.nearLimit')}
          </span>
        </div>
      )}
    </motion.div>
  );
}

const MemoizedTransactionQuota = memo(TransactionQuota);
MemoizedTransactionQuota.displayName = 'TransactionQuota';
export default MemoizedTransactionQuota;
