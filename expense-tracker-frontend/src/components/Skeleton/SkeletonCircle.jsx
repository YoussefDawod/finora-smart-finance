/**
 * Circular skeleton for avatars, icons, and circular elements.
 */
import { useMotion } from '../../context/MotionContext';
import './Skeleton.scss';

/**
 * SkeletonCircle - Avatar/icon circular skeleton.
 * @param {Object} props
 * @param {string} props.size - Diameter (CSS value, e.g., '40px', '3rem')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.shimmer - Enable shimmer animation (default: true)
 * @returns {JSX.Element}
 */
export function SkeletonCircle({
  size = '40px',
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
      className={`skeleton skeleton-circle ${animationClass} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
      }}
      role="status"
      aria-label="Loading avatar..."
    />
  );
}

export default SkeletonCircle;
