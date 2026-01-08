/**
 * Generic skeleton box component with customizable dimensions.
 */
import { useMotion } from '../../context/MotionContext';
import './Skeleton.scss';

/**
 * SkeletonBox - Generic skeleton for any size/shape.
 * @param {Object} props
 * @param {string} props.width - Width (CSS value, e.g., '100%', '200px')
 * @param {string} props.height - Height (CSS value, e.g., '20px', '100%')
 * @param {string} props.borderRadius - Border radius (default: '4px')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.shimmer - Enable shimmer animation (default: true)
 * @param {boolean} props.pulse - Enable pulse animation instead of shimmer
 * @returns {JSX.Element}
 */
export function SkeletonBox({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  shimmer = true,
  pulse = false,
}) {
  const { prefersReducedMotion } = useMotion();

  const animationClass = prefersReducedMotion
    ? ''
    : pulse
    ? 'skeleton--pulse'
    : shimmer
    ? 'skeleton--shimmer'
    : '';

  return (
    <div
      className={`skeleton skeleton-box ${animationClass} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
      role="status"
      aria-label="Loading..."
      aria-busy="true"
    />
  );
}

export default SkeletonBox;
