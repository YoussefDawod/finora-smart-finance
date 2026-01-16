/**
 * @fileoverview Loading Card Skeleton Component
 * @description Card placeholder with multiple skeleton lines for content loading
 * 
 * FEATURES:
 * - Predefined skeleton variations for different card types
 * - Multiple skeleton lines to simulate content
 * - Consistent spacing
 * - Smooth animation
 * 
 * @module components/common/LoadingCard
 */

import Skeleton from '../Skeleton/Skeleton';
import styles from './LoadingCard.module.scss';

/**
 * Loading Card Placeholder
 * @component
 * @example
 * // Transaction card skeleton
 * <LoadingCard type="transaction" />
 * 
 * // Chart card skeleton
 * <LoadingCard type="chart" />
 * 
 * // List item skeleton
 * <LoadingCard type="listItem" />
 */
const LoadingCard = ({ type = 'default' }) => {
  const getSkeletonConfig = () => {
    switch (type) {
      case 'transaction':
        return {
          lines: [
            { height: '14px', width: '70%' },    // Category name
            { height: '12px', width: '50%' },    // Date
            { height: '16px', width: '40%' },    // Amount
          ],
          gap: '8px',
        };
      case 'chart':
        return {
          lines: [
            { height: '24px', width: '100%' },   // Chart title
            { height: '150px', width: '100%' },  // Chart area
            { height: '12px', width: '80%' },    // Legend
          ],
          gap: '12px',
        };
      case 'listItem':
        return {
          lines: [
            { height: '18px', width: '60%' },    // Item name
            { height: '14px', width: '80%' },    // Item description
          ],
          gap: '8px',
        };
      case 'stats':
        return {
          lines: [
            { height: '12px', width: '50%' },    // Label
            { height: '24px', width: '70%' },    // Value
            { height: '10px', width: '40%' },    // Change
          ],
          gap: '8px',
        };
      default:
        return {
          lines: [
            { height: '20px', width: '100%' },
            { height: '16px', width: '90%' },
            { height: '14px', width: '80%' },
          ],
          gap: '12px',
        };
    }
  };

  const config = getSkeletonConfig();

  return (
    <div className={`${styles.card} ${styles[`card-${type}`]}`}>
      <div className={styles.content}>
        {config.lines.map((line, idx) => (
          <Skeleton
            key={idx}
            width={line.width}
            height={line.height}
            borderRadius="var(--radius-sm)"
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingCard;
