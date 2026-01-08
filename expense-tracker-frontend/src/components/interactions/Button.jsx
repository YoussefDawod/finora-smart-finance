/**
 * Button component with micro-interactions and feedback.
 * Supports loading state, success state, and ripple effect.
 */
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { addRippleEffect } from './rippleEffect';
import './Button.scss';

const Button = React.forwardRef(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isSuccess = false,
  disabled = false,
  onClick,
  loadingText = 'Loading...',
  successText = 'Done!',
  enableRipple = true,
  ...props
}, ref) => {
  const buttonRef = useRef(ref);

  // Setup ripple effect
  useEffect(() => {
    if (enableRipple && buttonRef.current) {
      addRippleEffect(buttonRef.current);
    }
  }, [enableRipple]);

  const handleClick = (e) => {
    // Skip ripple on reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClick?.(e);
      return;
    }

    onClick?.(e);
  };

  return (
    <button
      ref={buttonRef}
      className={`
        btn
        btn--${variant}
        btn--${size}
        ${isLoading ? 'btn--loading' : ''}
        ${isSuccess ? 'btn--success' : ''}
        ${className}
      `.trim()}
      disabled={disabled || isLoading || isSuccess}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? loadingText : isSuccess ? successText : children}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  isLoading: PropTypes.bool,
  isSuccess: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  loadingText: PropTypes.string,
  successText: PropTypes.string,
  enableRipple: PropTypes.bool,
};

export default Button;
