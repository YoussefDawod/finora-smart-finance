/**
 * @fileoverview FloatingMetric Component
 * @description Einzelne Metrik-Anzeige mit Label, Value, Trend und optionaler Sparkline.
 * Verwendung: innerhalb von HeroMetricPanel.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown, FiMinus, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useMotion } from '@/hooks/useMotion';
import styles from './FloatingMetric.module.scss';

const gentleSpring = { stiffness: 180, damping: 22, mass: 0.8 };

const floatVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', ...gentleSpring },
  },
};

const TREND_ICONS = { up: FiArrowUp, down: FiArrowDown, neutral: FiMinus };

function FloatingMetric({
  label,
  value,
  trendLabel = null,
  trendVariant = 'neutral',
  trendText = null,
  trendTooltip = null,
  hero = false,
  sparklineColor,
  dataTrend = null,
}) {
  const { shouldAnimate } = useMotion();
  const TrendIcon = TREND_ICONS[trendVariant] || FiMinus;
  const showTrend = trendLabel !== null && trendLabel !== undefined;

  return (
    <motion.div
      className={`${styles.metric} ${hero ? styles.hero : ''}`}
      variants={floatVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <span className={styles.label}>{label}</span>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {sparklineColor && dataTrend && (
          <span className={styles.trendIcon} style={{ color: sparklineColor }} aria-hidden="true">
            {dataTrend === 'up' ? (
              <FiTrendingUp />
            ) : dataTrend === 'down' ? (
              <FiTrendingDown />
            ) : (
              <FiMinus />
            )}
          </span>
        )}
      </div>

      {showTrend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <span
            className={`${styles.trendBadge} ${styles[trendVariant]}`}
            title={trendTooltip || undefined}
          >
            <TrendIcon size={12} strokeWidth={2.5} />
            <span>{trendLabel}</span>
          </span>
          {trendText && <span className={styles.trendText}>{trendText}</span>}
        </div>
      )}
    </motion.div>
  );
}

export default memo(FloatingMetric);
