/**
 * List skeleton with multiple items.
 */
import { useMotion } from '../../context/MotionContext';
import SkeletonCircle from './SkeletonCircle';
import SkeletonText from './SkeletonText';
import './Skeleton.scss';

/**
 * SkeletonList - List with multiple skeleton items.
 * @param {Object} props
 * @param {number} props.count - Number of items (default: 5)
 * @param {boolean} props.hasAvatar - Show avatar/icon (default: true)
 * @param {string} props.avatarSize - Avatar size (default: '40px')
 * @param {number} props.textLines - Lines per item (default: 2)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function SkeletonList({
  count = 5,
  hasAvatar = true,
  avatarSize = '40px',
  textLines = 2,
  className = '',
}) {
  return (
    <div className={`skeleton-list ${className}`} role="status" aria-label="Loading list...">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list__item">
          {hasAvatar && (
            <SkeletonCircle
              size={avatarSize}
              className="skeleton-list__avatar"
            />
          )}
          <div className="skeleton-list__content">
            <SkeletonText
              lines={textLines}
              lineHeight="16px"
              lastLineWidth={60}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonList;
