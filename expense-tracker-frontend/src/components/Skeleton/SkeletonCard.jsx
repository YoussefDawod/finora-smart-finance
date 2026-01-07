import React from 'react';
import './SkeletonCard.scss';

/**
 * Skeleton Card für Loading-States
 * Verwendet CSS Animation (shimmer-Effekt)
 */
function SkeletonCard({ variant = 'transaction', count = 3 }) {
  if (variant === 'stat') {
    return (
      <div className="skeleton-card skeleton-card--stat">
        <div className="skeleton-card__line skeleton-card__line--title"></div>
        <div className="skeleton-card__line skeleton-card__line--value"></div>
      </div>
    );
  }

  // Transaction variant (default)
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card skeleton-card--transaction animate-pulse">
          <div className="skeleton-card__row">
            <div className="skeleton-card__avatar"></div>
            <div className="skeleton-card__content">
              <div className="skeleton-card__line skeleton-card__line--title"></div>
              <div className="skeleton-card__line skeleton-card__line--subtitle"></div>
            </div>
            <div className="skeleton-card__amount"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export default SkeletonCard;
