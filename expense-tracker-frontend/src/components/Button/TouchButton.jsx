import React from 'react';
import './TouchButton.scss';

/**
 * Touch-Friendly Button
 * - Minimum 44x44px (Apple HIG)
 * - Larger tap area on mobile
 * - Haptic feedback ready
 */
function TouchButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary', // primary, secondary, outline
  size = 'md', // sm, md, lg
  fullWidth = false,
  className = '',
}) {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      // Haptic Feedback (wenn verfügbar)
      if ('vibrate' in navigator) {
        navigator.vibrate(10); // 10ms vibration
      }
      onClick(e);
    }
  };

  return (
    <button
      className={`touch-btn touch-btn--${variant} touch-btn--${size} ${
        fullWidth ? 'touch-btn--full' : ''
      } ${className}`}
      onClick={handleClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

export default TouchButton;
