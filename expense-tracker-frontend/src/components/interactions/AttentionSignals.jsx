/**
 * Attention signal components.
 * Pulse, shake, badge, highlight, and bounce animations.
 */
import React from 'react';
import PropTypes from 'prop-types';
import './AttentionSignals.scss';

/**
 * Pulse animation component.
 * Used for unsaved changes, new notifications.
 */
export const PulseIndicator = ({ className = '', speed = 'normal' }) => {
  const speedClass = speed === 'fast' ? 'pulse--fast' : speed === 'slow' ? 'pulse--slow' : '';
  
  return (
    <div className={`pulse ${speedClass} ${className}`} />
  );
};

PulseIndicator.propTypes = {
  className: PropTypes.string,
  speed: PropTypes.oneOf(['fast', 'normal', 'slow']),
};

/**
 * Shake animation component.
 * Used for validation errors, warnings.
 */
export const ShakeElement = ({ children, intense = false, className = '' }) => {
  const shakeClass = intense ? 'shake--intense' : 'shake';
  
  return (
    <div className={`${shakeClass} ${className}`}>
      {children}
    </div>
  );
};

ShakeElement.propTypes = {
  children: PropTypes.node.isRequired,
  intense: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Attention badge component.
 * Shows animated dot with urgency indicators.
 */
export const AttentionBadge = ({ count, className = '', color = 'red' }) => {
  return (
    <span
      className={`attention-badge ${className}`}
      data-count={count}
      role="status"
      aria-label={`${count} unread notifications`}
    />
  );
};

AttentionBadge.propTypes = {
  count: PropTypes.number,
  className: PropTypes.string,
  color: PropTypes.oneOf(['red', 'orange', 'yellow']),
};

/**
 * Highlight flash component.
 * Brief highlight on new items or updates.
 */
export const HighlightFlash = ({ children, type = 'success', className = '' }) => {
  const typeClass = `highlight-flash--${type}`;
  
  return (
    <div className={`highlight-flash ${typeClass} ${className}`}>
      {children}
    </div>
  );
};

HighlightFlash.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['success', 'warning', 'error']),
  className: PropTypes.string,
};

/**
 * Bounce animation component.
 * Used for new items entering list.
 */
export const BounceElement = ({ children, loop = false, className = '' }) => {
  const loopClass = loop ? 'bounce--loop' : '';
  
  return (
    <div className={`bounce ${loopClass} ${className}`}>
      {children}
    </div>
  );
};

BounceElement.propTypes = {
  children: PropTypes.node.isRequired,
  loop: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Blinking element for critical alerts.
 */
export const BlinkAlert = ({ children, className = '' }) => {
  return (
    <div className={`blink ${className}`} role="alert">
      {children}
    </div>
  );
};

BlinkAlert.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default {
  PulseIndicator,
  ShakeElement,
  AttentionBadge,
  HighlightFlash,
  BounceElement,
  BlinkAlert,
};
