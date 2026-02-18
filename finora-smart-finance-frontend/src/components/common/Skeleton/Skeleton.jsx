/**
 * @fileoverview Skeleton Loading Component
 * @description Shimmer animation for loading states
 * 
 * FEATURES:
 * - Customizable width, height, and count
 * - Different shape options (line, circle, rect, text)
 * - Smooth shimmer animation with theme support
 * - Accessible with ARIA attributes
 * - Inline mode for horizontal layouts
 * 
 * @module components/common/Skeleton
 */

import { memo } from 'react';
import styles from './Skeleton.module.scss';

/**
 * Skeleton Loading Placeholder
 * @component
 * @param {string} [width='100%'] - Width of skeleton
 * @param {string} [height='20px'] - Height of skeleton
 * @param {number} [count=1] - Number of skeleton elements
 * @param {'line'|'circle'|'rect'|'text'} [variant='line'] - Shape variant
 * @param {string} [gap='12px'] - Gap between multiple skeletons
 * @param {string} [borderRadius] - Custom border radius (overrides variant)
 * @param {boolean} [animated=true] - Enable shimmer animation
 * @param {boolean} [inline=false] - Inline layout (horizontal)
 * @param {string} [className] - Additional CSS classes
 * @param {string} [ariaLabel] - Custom aria-label
 * 
 * @example
 * // Single line skeleton
 * <Skeleton width="100%" height="20px" />
 * 
 * // Circle skeleton for avatars
 * <Skeleton variant="circle" width="48px" height="48px" />
 * 
 * // Multiple skeletons with gap
 * <Skeleton count={3} width="100%" height="60px" gap="12px" />
 * 
 * // Inline skeletons (horizontal)
 * <Skeleton inline count={3} width="80px" height="32px" gap="8px" />
 */
const Skeleton = memo(({ 
  width = '100%', 
  height = '20px', 
  count = 1,
  variant = 'line',
  gap = '12px',
  borderRadius,
  animated = true,
  inline = false,
  className = '',
  ariaLabel = 'Inhalt wird geladen',
}) => {
  const wrapperClass = inline ? styles.wrapperInline : styles.wrapper;
  
  const skeletonClasses = [
    styles.skeleton,
    styles[variant],
    !animated && styles.noAnimation,
    className,
  ].filter(Boolean).join(' ');

  // Bestimme border-radius basierend auf Variante
  const resolvedBorderRadius = borderRadius ?? (variant === 'circle' ? '50%' : undefined);

  return (
    <div 
      className={wrapperClass}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={skeletonClasses}
          style={{
            width,
            height,
            borderRadius: resolvedBorderRadius,
            [inline ? 'marginInlineEnd' : 'marginBlockEnd']: i < count - 1 ? gap : undefined,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;
