/**
 * Table skeleton with multiple rows.
 */
import { useMotion } from '../../context/MotionContext';
import './Skeleton.scss';

/**
 * SkeletonTable - Table row skeleton.
 * @param {Object} props
 * @param {number} props.rows - Number of rows (default: 5)
 * @param {number} props.columns - Number of columns (default: 4)
 * @param {boolean} props.hasHeader - Show header row (default: true)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className = '',
}) {
  const { prefersReducedMotion } = useMotion();

  const animationClass = prefersReducedMotion
    ? ''
    : 'skeleton--shimmer';

  const totalRows = hasHeader ? rows + 1 : rows;

  return (
    <div className={`skeleton-table ${className}`} role="status" aria-label="Loading table...">
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const isHeader = hasHeader && rowIndex === 0;

        return (
          <div
            key={rowIndex}
            className={`skeleton-table__row ${isHeader ? 'skeleton-table__row--header' : ''}`}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`skeleton skeleton-table__cell ${animationClass}`}
                style={{
                  height: isHeader ? '24px' : '20px',
                  width: `${100 / columns}%`,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default SkeletonTable;
