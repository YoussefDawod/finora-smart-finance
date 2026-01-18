/**
 * @fileoverview SummaryCard Component
 * @description Moderne Card-Komponente für Dashboard Summary (Einkommen, Ausgaben, Balance)
 * 
 * FEATURES:
 * - Icon + Title + Value
 * - Trend Indicator (up/down)
 * - Color Variants (income, expense, balance)
 * - Framer Motion Hover Effects
 * - Responsive Design
 */

import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import styles from './SummaryCard.module.scss';

export default function SummaryCard({
  title = 'Titel',
  value = '0,00 €',
  icon: IconComponent = null,
  trend = null,
  trendPercent = 0,
  trendLabel = null,
  trendVariant = null,
  trendTooltip = null,
  color = 'primary', // 'income' (green), 'expense' (red), 'balance' (blue), 'primary'
  size = 'medium', // 'small', 'medium', 'large'
}) {
  const computedVariant = trendVariant ?? (trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'neutral');
  const showTrend = trendLabel !== null ? Boolean(trendLabel) : trendPercent !== 0;
  const label = trendLabel ?? `${Math.abs(trendPercent)}%`;
  const TrendIcon = computedVariant === 'up' ? FiTrendingUp : computedVariant === 'down' ? FiTrendingDown : null;

  return (
    <motion.div
      className={`${styles.summaryCard} ${styles[color]} ${styles[size]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      whileTap={{ y: -2 }}
    >
      {/* Background Gradient */}
      <div className={styles.gradient} />

      {/* Top Section: Icon + Title */}
      <div className={styles.header}>
        {IconComponent && (
          <motion.div
            className={styles.iconWrapper}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <IconComponent size={24} />
          </motion.div>
        )}
        <h3 className={styles.title}>{title}</h3>
      </div>

      {/* Value Section */}
      <motion.div
        className={styles.valueSection}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className={styles.value}>{value}</p>
        {showTrend && (
          <div
            className={`${styles.trendBadge} ${styles[computedVariant]}`}
            title={trendTooltip || undefined}
            aria-label={trendTooltip || undefined}
          >
            {TrendIcon && <TrendIcon size={14} />}
            <span>{label}</span>
          </div>
        )}
      </motion.div>

      {/* Bottom: Trend Text */}
      {trend && (
        <motion.div
          className={styles.trendText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {trend}
        </motion.div>
      )}

      {/* Shimmer Effect on Hover */}
      <div className={styles.shimmer} />
    </motion.div>
  );
}
