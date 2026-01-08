/**
 * Haptic feedback patterns and triggers for mobile devices.
 */

/**
 * Checks if the device supports haptic feedback.
 * @returns {boolean}
 */
export const supportsHaptics = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Haptic pattern definitions in milliseconds.
 */
export const HAPTIC_PATTERNS = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 30, 10],
  error: [20, 40, 20, 40, 20],
  warning: [40, 60, 40],
  doubleTap: [10, 20, 10],
  longPress: 20,
  notification: [30, 50, 30],
};

/**
 * Triggers a haptic feedback pattern.
 * @param {string | number | Array<number>} pattern
 * @returns {boolean} True if vibration was triggered, false otherwise
 */
export const triggerHaptic = (pattern) => {
  if (!supportsHaptics()) {
    console.debug('Haptic feedback not supported on this device');
    return false;
  }
  
  try {
    if (typeof pattern === 'string' && HAPTIC_PATTERNS[pattern]) {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
      return true;
    }
    
    if (typeof pattern === 'number' || Array.isArray(pattern)) {
      navigator.vibrate(pattern);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
};

/**
 * Cancels any ongoing haptic feedback.
 */
export const cancelHaptic = () => {
  if (supportsHaptics()) {
    navigator.vibrate(0);
  }
};

/**
 * Triggers haptic feedback on gesture recognition.
 * @param {string} gestureType
 */
export const hapticOnGesture = (gestureType) => {
  switch (gestureType) {
    case 'tap':
    case 'swipe':
      triggerHaptic('light');
      break;
    case 'longPress':
      triggerHaptic('longPress');
      break;
    case 'doubleTap':
      triggerHaptic('doubleTap');
      break;
    case 'pinch':
      triggerHaptic('medium');
      break;
    default:
      triggerHaptic('light');
  }
};

/**
 * Triggers haptic feedback on action result.
 * @param {string} resultType - 'success', 'error', or 'warning'
 */
export const hapticOnAction = (resultType) => {
  switch (resultType) {
    case 'success':
      triggerHaptic('success');
      break;
    case 'error':
      triggerHaptic('error');
      break;
    case 'warning':
      triggerHaptic('warning');
      break;
    default:
      triggerHaptic('light');
  }
};

/**
 * Creates a custom haptic pattern.
 * @param {Array<{ duration: number, intensity?: 'light' | 'medium' | 'heavy' }>} sequence
 * @returns {Array<number>}
 */
export const createCustomPattern = (sequence) => {
  const pattern = [];
  
  sequence.forEach((step, index) => {
    const duration = step.duration || 10;
    pattern.push(duration);
    
    if (index < sequence.length - 1) {
      pattern.push(20);
    }
  });
  
  return pattern;
};

/**
 * Announces a message to screen readers (accessibility fallback).
 * @param {string} message
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  if (typeof document === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Combines haptic and screen reader feedback.
 * @param {string} gestureType
 * @param {string} message
 * @param {boolean} prefersReducedMotion
 */
export const accessibleFeedback = (gestureType, message, prefersReducedMotion = false) => {
  if (!prefersReducedMotion) {
    hapticOnGesture(gestureType);
  }
  
  if (message) {
    announceToScreenReader(message);
  }
};

export default {
  supportsHaptics,
  HAPTIC_PATTERNS,
  triggerHaptic,
  cancelHaptic,
  hapticOnGesture,
  hapticOnAction,
  createCustomPattern,
  announceToScreenReader,
  accessibleFeedback,
};
