/**
 * @fileoverview SkeletonCard - Wiederverwendbares Card-Skeleton
 * @description Für SummaryCard, ProfileCard, und ähnliche Card-Layouts
 * 
 * @module components/common/Skeleton/SkeletonCard
 */

import { memo } from 'react';
import Skeleton from './Skeleton';
import styles from './SkeletonCard.module.scss';

/**
 * Card Skeleton mit konfigurierbaren Elementen
 * @param {boolean} [hasIcon=true] - Icon-Platzhalter anzeigen
 * @param {boolean} [hasTitle=true] - Titel-Platzhalter anzeigen
 * @param {boolean} [hasValue=true] - Wert-Platzhalter anzeigen
 * @param {boolean} [hasTrend=true] - Trend-Platzhalter anzeigen
 * @param {'small'|'medium'|'large'} [size='medium'] - Card-Größe
 */
const SkeletonCard = memo(({
  hasIcon = true,
  hasTitle = true,
  hasValue = true,
  hasTrend = true,
  size = 'medium',
  className = '',
}) => {
  const sizes = {
    small: { icon: '32px', title: '60px', value: '80px', trend: '50px' },
    medium: { icon: '40px', title: '80px', value: '120px', trend: '70px' },
    large: { icon: '48px', title: '100px', value: '150px', trend: '90px' },
  };
  
  const s = sizes[size];

  return (
    <div className={`${styles.card} ${styles[size]} ${className}`}>
      {/* Header: Title + Icon */}
      <div className={styles.header}>
        {hasTitle && (
          <Skeleton width={s.title} height="14px" variant="text" />
        )}
        {hasIcon && (
          <Skeleton variant="circle" width={s.icon} height={s.icon} />
        )}
      </div>
      
      {/* Value */}
      {hasValue && (
        <div className={styles.value}>
          <Skeleton width={s.value} height="28px" variant="text" />
        </div>
      )}
      
      {/* Trend */}
      {hasTrend && (
        <div className={styles.trend}>
          <Skeleton width={s.trend} height="14px" variant="text" />
        </div>
      )}
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export default SkeletonCard;
