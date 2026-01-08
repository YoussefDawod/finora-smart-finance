/**
 * Form skeleton with multiple input fields.
 */
import { useMotion } from '../../context/MotionContext';
import SkeletonBox from './SkeletonBox';
import './Skeleton.scss';

/**
 * SkeletonForm - Form fields skeleton.
 * @param {Object} props
 * @param {number} props.fields - Number of form fields (default: 4)
 * @param {boolean} props.hasLabels - Show label placeholders (default: true)
 * @param {boolean} props.hasButton - Show submit button (default: true)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function SkeletonForm({
  fields = 4,
  hasLabels = true,
  hasButton = true,
  className = '',
}) {
  return (
    <div className={`skeleton-form ${className}`} role="status" aria-label="Loading form...">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="skeleton-form__field">
          {hasLabels && (
            <SkeletonBox
              width="120px"
              height="14px"
              borderRadius="4px"
              className="skeleton-form__label"
            />
          )}
          <SkeletonBox
            width="100%"
            height="40px"
            borderRadius="8px"
            className="skeleton-form__input"
          />
        </div>
      ))}
      {hasButton && (
        <SkeletonBox
          width="150px"
          height="44px"
          borderRadius="8px"
          className="skeleton-form__button"
        />
      )}
    </div>
  );
}

export default SkeletonForm;
