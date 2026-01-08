/**
 * Default loading fallback component.
 */
import { SkeletonCard } from '../Skeleton';
import './LoadingFallback.scss';

/**
 * LoadingFallback - Generic loading UI with skeleton.
 * @param {Object} props
 * @param {string} props.variant - Skeleton variant ('card', 'list', 'table', 'form')
 * @param {number} props.count - Number of skeleton items (default: 3)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function LoadingFallback({
  variant = 'card',
  count = 3,
  className = '',
}) {
  return (
    <div className={`loading-fallback ${className}`} role="status" aria-label="Loading...">
      {variant === 'card' && (
        <SkeletonCard variant="transaction" count={count} />
      )}
      {variant === 'list' && (
        <div className="loading-fallback__list">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="loading-fallback__list-item" />
          ))}
        </div>
      )}
      {variant === 'table' && (
        <div className="loading-fallback__table">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="loading-fallback__table-row" />
          ))}
        </div>
      )}
      {variant === 'form' && (
        <div className="loading-fallback__form">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="loading-fallback__form-field" />
          ))}
        </div>
      )}
    </div>
  );
}

export default LoadingFallback;
