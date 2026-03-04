/**
 * @fileoverview AdminStatCard – Stat-Karte für Admin-Dashboard
 * @description Zeigt eine Metrik mit Icon, Wert, Label und optionalem Trend.
 *              Kompakte Karte, optimiert für ein Admin-Stats-Grid.
 *
 * @module components/admin/AdminStatCard
 */

import { useTranslation } from 'react-i18next';
import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import styles from './AdminStatCard.module.scss';

/**
 * Berechnet die Trend-Variante aus einem numerischen Wert
 * @param {number|null} value
 * @returns {'up'|'down'|'neutral'}
 */
function getTrendVariant(value) {
  if (value == null) return 'neutral';
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}

/**
 * AdminStatCard Component
 *
 * @param {Object} props
 * @param {string} props.label - Beschriftung (i18n-Key wird extern aufgelöst)
 * @param {string|number} props.value - Anzuzeigender Wert
 * @param {React.ComponentType} [props.icon] - react-icons Icon
 * @param {'primary'|'success'|'warning'|'error'|'info'} [props.color='primary']
 * @param {string|null} [props.trendLabel] - Trend-Text (z.B. "+12 diese Woche")
 * @param {number|null} [props.trendValue] - Numerischer Trend (>0 = up, <0 = down)
 * @param {boolean} [props.isLoading=false]
 */
export default function AdminStatCard({
  label,
  value,
  icon: IconComponent,
  color = 'primary',
  trendLabel = null,
  trendValue = null,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const variant = getTrendVariant(trendValue);
  const TrendIcon = variant === 'up' ? FiArrowUp : variant === 'down' ? FiArrowDown : FiMinus;

  if (isLoading) {
    return (
      <div
        className={`${styles.statCard} ${styles[color]} ${styles.loading}`}
        aria-busy="true"
        aria-label={t('common.loading')}
      >
        <div className={styles.iconBox}>
          <Skeleton variant="circle" width={36} height={36} />
        </div>
        <div className={styles.content}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="70%" height={24} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      {IconComponent && (
        <div className={styles.iconBox}>
          <IconComponent size={20} />
        </div>
      )}
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {trendLabel && (
          <span className={`${styles.trend} ${styles[variant]}`}>
            <TrendIcon size={12} />
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}
