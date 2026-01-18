/**
 * @fileoverview Skeleton Loading Component
 * @description Shimmer animation for loading states
 * 
 * FEATURES:
 * - Customizable width, height, and count
 * - Different shape options (line, circle, rect)
 * - Smooth shimmer animation
 * - Accessible and responsive
 * 
 * @module components/common/Skeleton
 */

import './Skeleton.scss';

/**
 * Skeleton Loading Placeholder
 * @component
 * @example
 * // Line skeleton
 * <Skeleton width="100%" height="20px" />
 * 
 * // Circle skeleton for avatars
 * <Skeleton variant="circle" width="48px" height="48px" />
 * 
 * // Rectangle skeleton for cards
 * <Skeleton variant="rect" width="100%" height="200px" />
 * 
 * // Multiple skeletons
 * <Skeleton count={3} width="100%" height="60px" gap="12px" />
 */
const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  count = 1,
  variant = 'line',
  gap = '12px',
  borderRadius = 'var(--radius-md)',
  className = ''
}) => {
  return (
    <div className={`skeleton-wrapper ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-${variant}`}
          style={{
            width,
            height,
            borderRadius: variant === 'circle' ? '50%' : borderRadius,
            marginBottom: i < count - 1 ? gap : undefined,
          }}
          role="status"
          aria-busy="true"
          aria-label="Inhalt wird geladen"
        />
      ))}
    </div>
  );
};

export default Skeleton;
