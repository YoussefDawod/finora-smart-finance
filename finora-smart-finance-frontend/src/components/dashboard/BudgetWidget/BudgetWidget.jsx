/**
 * @fileoverview BudgetWidget Component
 * @description Dashboard widget showing current budget status
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiAlertTriangle, FiSettings } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBudget } from '@/hooks/useBudget';
import { formatCurrency } from '@/utils/formatters';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import styles from './BudgetWidget.module.scss';

export default function BudgetWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { budgetStatus, isLoading, hasBudget } = useBudget();

  // Determine status color and label
  const statusInfo = useMemo(() => {
    if (!hasBudget || !budgetStatus) {
      return { color: 'neutral', label: null };
    }

    const percent = budgetStatus.percentUsed || 0;
    const threshold = budgetStatus.alertThreshold || 80;

    if (percent >= 100) {
      return {
        color: 'danger',
        label: t('dashboard.budget.exceeded'),
        showWarning: true,
      };
    }
    if (percent >= threshold) {
      return {
        color: 'warning',
        label: t('dashboard.budget.nearLimit'),
        showWarning: true,
      };
    }
    if (percent >= 50) {
      return {
        color: 'info',
        label: t('dashboard.budget.onTrack'),
        showWarning: false,
      };
    }
    return {
      color: 'success',
      label: t('dashboard.budget.healthy'),
      showWarning: false,
    };
  }, [budgetStatus, hasBudget, t]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.budgetWidget}>
        <div className={styles.header}>
          <Skeleton width="120px" height="20px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="var(--r-full)" />
        <div className={styles.stats}>
          <Skeleton width="80px" height="16px" />
          <Skeleton width="60px" height="16px" />
        </div>
      </div>
    );
  }

  // No budget set
  if (!hasBudget) {
    return (
      <div className={styles.budgetWidget}>
        <div className={styles.noBudget}>
          <FiTarget className={styles.noBudgetIcon} />
          <p>{t('dashboard.budget.noBudget')}</p>
          <button
            type="button"
            className={styles.setupBtn}
            onClick={() => navigate('/settings')}
          >
            <FiSettings />
            {t('dashboard.budget.setup')}
          </button>
        </div>
      </div>
    );
  }

  const { totalSpent, monthlyLimit, remainingBudget, percentUsed } = budgetStatus;

  return (
    <motion.div
      className={styles.budgetWidget}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <FiTarget className={styles.icon} />
          <h3>{t('dashboard.budget.title')}</h3>
        </div>
        {statusInfo.showWarning && (
          <span className={`${styles.badge} ${styles[statusInfo.color]}`}>
            <FiAlertTriangle />
            {statusInfo.label}
          </span>
        )}
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <motion.div
            className={`${styles.progressFill} ${styles[statusInfo.color]}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentUsed, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span className={styles.percentLabel}>{percentUsed}%</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('dashboard.budget.spent')}</span>
          <span className={styles.statValue}>{formatCurrency(totalSpent)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('dashboard.budget.remaining')}</span>
          <span className={`${styles.statValue} ${remainingBudget <= 0 ? styles.negative : ''}`}>
            {formatCurrency(remainingBudget)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('dashboard.budget.limit')}</span>
          <span className={styles.statValue}>{formatCurrency(monthlyLimit)}</span>
        </div>
      </div>
    </motion.div>
  );
}
