/**
 * @fileoverview Spinner Loading Component
 * @description Animated loading spinner for async operations
 * 
 * FEATURES:
 * - Multiple size options (sm, md, lg, xl)
 * - Customizable color
 * - Smooth rotating animation
 * - Accessible with aria attributes
 * 
 * @module components/common/Spinner
 */

import './Spinner.scss';

/**
 * Loading Spinner Component
 * @component
 * @example
 * // Small spinner
 * <Spinner size="sm" />
 * 
 * // Large primary spinner
 * <Spinner size="lg" color="primary" />
 * 
 * // Custom color
 * <Spinner size="md" color="success" />
 */
const Spinner = ({ 
  size = 'md', 
  color = 'primary',
  className = ''
}) => {
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
  };

  const colorVars = {
    primary: 'var(--primary)',
    success: 'var(--success)',
    error: 'var(--error)',
    warning: 'var(--warning)',
    info: 'var(--info)',
  };

  return (
    <div 
      className={`spinner spinner-${size} ${className}`}
      style={{
        '--spinner-size': sizeMap[size],
        '--spinner-color': colorVars[color] || color,
      }}
      role="status"
      aria-live="polite"
      aria-label="Lädt..."
    >
      <div className="spinner-ring" />
    </div>
  );
};

export default Spinner;
