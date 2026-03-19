/**
 * @fileoverview OrbitalSavingsRing Component — Redesign
 * @description Modernes Donut-Chart mit Gradient-Stroke, Glow-Effekt und
 * animiertem Eingang. Zeigt Sparquote als Prozent + Income/Expense als Meta.
 */

import { memo, useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import { useDashboardChartData } from '@/hooks/useDashboardChartData';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/common/Skeleton';
import GlassPanel from '../GlassPanel/GlassPanel';
import styles from './OrbitalSavingsRing.module.scss';

const RING_SIZE = 180;
const STROKE_WIDTH = 14;
const GLOW_PAD = 12;
const SVG_SIZE = RING_SIZE + GLOW_PAD * 2;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CENTER = SVG_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const panelVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 25, delay: 0.1 },
  },
};

function OrbitalSavingsRing() {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const { savingsRate, monthBalance, trendData, loading } = useDashboardChartData();

  const prevMonth = trendData.length >= 2 ? trendData[trendData.length - 2] : null;
  const prevSavingsRate =
    prevMonth?.income > 0
      ? ((prevMonth.income - prevMonth.expense) / prevMonth.income) * 100
      : null;
  const delta = prevSavingsRate !== null ? savingsRate - prevSavingsRate : null;
  const gradientId = useId();

  const isPositive = savingsRate >= 0;
  const clampedRate = Math.min(Math.abs(savingsRate), 100);
  const offset = CIRCUMFERENCE - (clampedRate / 100) * CIRCUMFERENCE;

  const ringMotion = useMemo(
    () => ({
      initial: shouldAnimate ? { strokeDashoffset: CIRCUMFERENCE } : { strokeDashoffset: offset },
      animate: { strokeDashoffset: offset },
      transition: { duration: 1.2, ease: [0.33, 1, 0.68, 1], delay: 0.4 },
    }),
    [shouldAnimate, offset]
  );

  if (loading) {
    return (
      <GlassPanel className={styles.panel} elevated>
        <div className={styles.header}>
          <Skeleton width="120px" height="16px" />
        </div>
        <div className={styles.ringArea}>
          <Skeleton variant="circle" width={RING_SIZE} height={RING_SIZE} />
        </div>
        <div className={styles.footer}>
          <Skeleton width="100px" height="14px" />
          <Skeleton width="100px" height="14px" />
        </div>
      </GlassPanel>
    );
  }

  return (
    <motion.div
      variants={panelVariant}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <GlassPanel className={styles.panel} elevated>
        {/* Panel Title */}
        <div className={styles.header}>
          <h3 className={styles.title}>{t('dashboard.savingsRate')}</h3>
        </div>

        {/* Ring */}
        <div className={styles.ringArea}>
          <div className={styles.ringWrapper}>
            <svg
              className={styles.svg}
              width={SVG_SIZE}
              height={SVG_SIZE}
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              aria-label={`${t('dashboard.savingsRate')}: ${Math.abs(savingsRate).toFixed(1)}%`}
              role="img"
            >
              <defs>
                <linearGradient id={`ring-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  {isPositive ? (
                    <>
                      <stop offset="0%" stopColor="var(--aurora-1)" />
                      <stop offset="100%" stopColor="var(--aurora-2)" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="var(--aurora-warn)" />
                      <stop offset="100%" stopColor="var(--error)" />
                    </>
                  )}
                </linearGradient>
                <filter id={`ring-glow-${gradientId}`}>
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Track */}
              <circle className={styles.trackRing} cx={CENTER} cy={CENTER} r={RADIUS} />

              {/* Value Ring with Gradient + Glow */}
              <motion.circle
                className={styles.valueRing}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={`url(#ring-grad-${gradientId})`}
                strokeDasharray={CIRCUMFERENCE}
                filter={`url(#ring-glow-${gradientId})`}
                {...ringMotion}
              />
            </svg>

            {/* Center Content */}
            <div className={styles.centerLabel}>
              <motion.span
                className={`${styles.rateValue} ${isPositive ? styles.positive : styles.negative}`}
                initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                {Math.abs(savingsRate).toFixed(1)}%
              </motion.span>
              <span className={styles.rateLabel}>
                {isPositive ? t('dashboard.saved') : t('dashboard.deficit')}
              </span>
            </div>
          </div>
        </div>

        {/* Gespartes Betrag + Sparquoten-Trend vs. Vormonat */}
        <div className={styles.footer}>
          <div className={styles.footerStat}>
            <div className={styles.footerText}>
              <span className={styles.footerLabel}>{t('dashboard.saved')}</span>
              <span
                className={styles.footerValue}
                data-positive={monthBalance >= 0 ? 'true' : 'false'}
              >
                {formatCurrency(Math.abs(monthBalance))}
              </span>
            </div>
          </div>
          <div className={styles.footerStat}>
            <div className={styles.footerText}>
              <span className={styles.footerLabel}>{t('dashboard.vsLastMonth')}</span>
              {delta !== null ? (
                <span className={styles.footerBadge} data-positive={delta >= 0 ? 'true' : 'false'}>
                  {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                </span>
              ) : (
                <span className={styles.footerValue}>—</span>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

export default memo(OrbitalSavingsRing);
