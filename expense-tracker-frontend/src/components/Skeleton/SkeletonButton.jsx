/**
 * Button skeleton component.
 */
import { useMotion } from '../../context/MotionContext';
import './Skeleton.scss';

/**
 * SkeletonButton - Button skeleton.
 * @param {Object} props
 * @param {string} props.width - Width (default: '120px')
 * @param {string} props.height - Height (default: '40px')
 * @param {string} props.borderRadius - Border radius (default: '8px')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.shimmer - Enable shimmer animation (default: true)
 * @returns {JSX.Element}
 */
export function SkeletonButton({
  width = '120px',
  height = '40px',
  borderRadius = '8px',
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
    <div
      className={`skeleton skeleton-button ${animationClass} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
      role="status"
      aria-label="Loading button..."
    />
  );
}

export default SkeletonButton;
