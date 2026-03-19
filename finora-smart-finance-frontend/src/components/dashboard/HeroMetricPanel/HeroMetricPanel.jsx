/**
 * @fileoverview HeroMetricPanel Component
 * @description 3 separate Glass-Panels für Balance, Income, Expense.
 * Jedes Panel hat farbige Border, halbtransparenten Hintergrund und
 * farbigen Shadow passend zu seiner Semantik (info, success, error).
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useMotion } from '@/hooks/useMotion';
import { Skeleton } from '@/components/common/Skeleton';
import GlassPanel from '../GlassPanel/GlassPanel';
import FloatingMetric from '../FloatingMetric/FloatingMetric';
import styles from './HeroMetricPanel.module.scss';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 25 },
  },
};

function HeroMetricPanel({ summaryData, isLoading = false }) {
  const { shouldAnimate } = useMotion();

  if (isLoading) {
    return (
      <div className={styles.heroGrid}>
        {[0, 1, 2].map(i => (
          <GlassPanel key={i} className={styles.heroCard} aria-busy="true">
            <div className={styles.skeletonContent}>
              <Skeleton width="60px" height="14px" />
              <Skeleton width={i === 0 ? '180px' : '120px'} height={i === 0 ? '42px' : '28px'} />
              <Skeleton width="70px" height="20px" borderRadius="var(--r-full)" />
            </div>
          </GlassPanel>
        ))}
      </div>
    );
  }

  const { balance, income, expense } = summaryData;

  const cards = [
    { key: 'balance', data: balance, variant: 'info', hero: true },
    { key: 'income', data: income, variant: 'success', hero: false },
    { key: 'expense', data: expense, variant: 'error', hero: false },
  ];

  const sparklineColors = {
    info: 'var(--info)',
    success: 'var(--success)',
    error: 'var(--error)',
  };

  return (
    <motion.div
      className={styles.heroGrid}
      variants={staggerContainer}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      {cards.map(({ key, data, variant, hero }) => (
        <motion.div key={key} variants={cardVariant}>
          <GlassPanel className={`${styles.heroCard} ${styles[variant]}`}>
            <FloatingMetric
              label={data.label}
              value={data.value}
              trendLabel={data.trendLabel}
              trendVariant={data.trendVariant}
              trendText={data.trend}
              trendTooltip={data.trendTooltip}
              hero={hero}
              sparklineData={data.sparkline}
              sparklineColor={sparklineColors[variant]}
              dataTrend={data.dataTrend}
            />
          </GlassPanel>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default memo(HeroMetricPanel);
