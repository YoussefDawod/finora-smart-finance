/**
 * @fileoverview SummaryCard Component
 * @description Moderne Card-Komponente für Dashboard Summary (Einkommen, Ausgaben, Balance)
 * 
 * FEATURES:
 * - Icon + Title + Value
 * - Trend Indicator mit Vergleichswert
 * - Color Variants (income, expense, balance)
 * - Framer Motion Hover Effects
 * - Responsive Design
 * - Skeleton Loading State
 */

import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/common/Skeleton';
import styles from './SummaryCard.module.scss';

export default function SummaryCard({
  title,
  value,
  icon: IconComponent = null,
  trend = null,
  trendLabel = null,
  trendVariant = null,
  trendTooltip = null,
  color = 'primary', // 'income' (green), 'expense' (red), 'balance' (blue), 'primary'
  size = 'medium', // 'small', 'medium', 'large'
  isLoading = false,
}) {
  const { t } = useTranslation();
  
  // Determine trend direction and styling
  const computedVariant = isLoading ? 'neutral' : (trendVariant ?? 'neutral');
  
  // Trend Icon based on direction
  const TrendIcon = computedVariant === 'up' ? FiArrowUp : computedVariant === 'down' ? FiArrowDown : FiMinus;
  
  // Show trend only if there's a label (null = no comparison possible)
  const showTrend = isLoading || (trendLabel !== null && trendLabel !== undefined);

  // Loading state mit echten Skeleton-Elementen
  if (isLoading) {
    return (
      <motion.div
        className={`${styles.summaryCard} ${styles[color]} ${styles[size]} ${styles.loading}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        aria-busy="true"
        aria-label={t('common.loading')}
      >
        <div className={styles.gradient} />
        
        <div className={styles.header}>
          {IconComponent && (
            <div className={styles.iconWrapper}>
              <Skeleton variant="circle" width={22} height={22} />
            </div>
          )}
          <Skeleton variant="text" width="60%" height={16} />
        </div>

        <div className={styles.valueSection}>
          <Skeleton variant="text" width="80%" height={28} />
        </div>

        {showTrend && (
          <div className={styles.trendSection}>
            <Skeleton variant="rect" width={60} height={20} borderRadius="1rem" />
          </div>
        )}
        
        <div className={styles.shimmer} />
      </motion.div>
    );
  }

  const resolvedTitle = title ?? t('dashboard.summaryDefaultTitle');
  const resolvedValue = value ?? t('dashboard.summaryDefaultValue');

  return (
    <motion.div
      className={`${styles.summaryCard} ${styles[color]} ${styles[size]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(0,0,0,0.08)' }}
      tabIndex={0}
    >
      {/* Background Gradient */}
      <div className={styles.gradient} />

      {/* Top Section: Icon + Title */}
      <div className={styles.header}>
        {IconComponent && (
          <div className={styles.iconWrapper}>
            <IconComponent size={22} strokeWidth={2} />
          </div>
        )}
        <h3 className={styles.title}>{resolvedTitle}</h3>
      </div>

      {/* Value Section */}
      <div className={styles.valueSection}>
        <p className={styles.value}>{resolvedValue}</p>
      </div>

      {/* Trend Section - Separate and clearer */}
      {showTrend && (
        <div className={styles.trendSection}>
          <div 
            className={`${styles.trendBadge} ${styles[computedVariant]}`}
            title={trendTooltip || undefined}
            aria-label={trendTooltip || undefined}
          >
            <TrendIcon size={12} strokeWidth={2.5} />
            <span className={styles.trendValue}>{trendLabel}</span>
          </div>
          {trend && (
            <span className={styles.trendDescription}>{trend}</span>
          )}
        </div>
      )}

      {/* Shimmer Effect on Hover */}
      <div className={styles.shimmer} />
    </motion.div>
  );
}
