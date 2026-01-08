/**
 * Card skeleton with image and text stacks.
 */
import { useMotion } from '../../context/MotionContext';
import SkeletonBox from './SkeletonBox';
import SkeletonText from './SkeletonText';
import './Skeleton.scss';

/**
 * SkeletonCard - Card skeleton with image + text.
 * @param {Object} props
 * @param {boolean} props.hasImage - Show image placeholder (default: true)
 * @param {string} props.imageHeight - Image height (default: '200px')
 * @param {number} props.textLines - Number of text lines (default: 3)
 * @param {boolean} props.hasButton - Show button placeholder (default: false)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Card variant ('default', 'transaction', 'stat')
 * @param {number} props.count - Number of cards for transaction variant (default: 3)
 * @returns {JSX.Element}
 */
export function SkeletonCard({
  hasImage = true,
  imageHeight = '200px',
  textLines = 3,
  hasButton = false,
  className = '',
  variant = 'default',
  count = 3,
}) {
  // Transaction variant (for backward compatibility)
  if (variant === 'transaction') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`skeleton-card skeleton-card--transaction ${className}`}>
            <div className="skeleton-card__row">
              <SkeletonBox width="40px" height="40px" borderRadius="50%" className="skeleton-card__avatar" />
              <div className="skeleton-card__content">
                <SkeletonBox width="150px" height="16px" borderRadius="4px" />
                <SkeletonBox width="100px" height="14px" borderRadius="4px" />
              </div>
              <SkeletonBox width="80px" height="20px" borderRadius="4px" />
            </div>
          </div>
        ))}
      </>
    );
  }

  // Stat variant
  if (variant === 'stat') {
    return (
      <div className={`skeleton-card skeleton-card--stat ${className}`}>
        <SkeletonBox width="100px" height="16px" borderRadius="4px" className="skeleton-card__title" />
        <SkeletonBox width="120px" height="32px" borderRadius="4px" className="skeleton-card__value" />
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`skeleton-card ${className}`} role="status" aria-label="Loading card...">
      {hasImage && (
        <SkeletonBox
          width="100%"
          height={imageHeight}
          borderRadius="8px 8px 0 0"
          className="skeleton-card__image"
        />
      )}
      <div className="skeleton-card__content">
        <SkeletonBox
          width="60%"
          height="24px"
          borderRadius="4px"
          className="skeleton-card__title"
        />
        <SkeletonText
          lines={textLines}
          lineHeight="16px"
          lastLineWidth={70}
          className="skeleton-card__text"
        />
        {hasButton && (
          <SkeletonBox
            width="120px"
            height="40px"
            borderRadius="8px"
            className="skeleton-card__button"
          />
        )}
      </div>
    </div>
  );
}

export default SkeletonCard;
