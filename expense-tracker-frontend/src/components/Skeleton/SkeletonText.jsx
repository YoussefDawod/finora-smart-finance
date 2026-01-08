/**
 * Text paragraph skeleton with multiple lines and width variation.
 */
import { useMotion } from '../../context/MotionContext';
import './Skeleton.scss';

/**
 * SkeletonText - Paragraph skeleton with variable line widths.
 * @param {Object} props
 * @param {number} props.lines - Number of text lines (default: 3)
 * @param {string} props.lineHeight - Height per line (default: '16px')
 * @param {boolean} props.lastLineWidth - Width of last line as percentage (default: 60)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.shimmer - Enable shimmer animation (default: true)
 * @returns {JSX.Element}
 */
export function SkeletonText({
  lines = 3,
  lineHeight = '16px',
  lastLineWidth = 60,
  className = '',
  shimmer = true,
}) {
  const { prefersReducedMotion } = useMotion();

  const animationClass = prefersReducedMotion
    ? ''
    : shimmer
    ? 'skeleton--shimmer'
    : '';

  return (
    <div className={`skeleton-text ${className}`} role="status" aria-label="Loading text...">
      {Array.from({ length: lines }).map((_, index) => {
        const isLastLine = index === lines - 1;
        const width = isLastLine ? `${lastLineWidth}%` : '100%';

        return (
          <div
            key={index}
            className={`skeleton skeleton-text__line ${animationClass}`}
            style={{
              width,
              height: lineHeight,
              marginBottom: index < lines - 1 ? '8px' : '0',
            }}
          />
        );
      })}
    </div>
  );
}

export default SkeletonText;
