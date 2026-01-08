/**
 * Motion utilities and hooks for smooth animations.
 * Provides helpers for page transitions, modals, and gestures.
 */

/**
 * Applies page transition animation to an element.
 * @param {HTMLElement} element - Element to animate
 * @param {string} direction - 'enter' or 'exit'
 */
export function applyPageTransition(element, direction = 'enter') {
  if (!element) return;

  const className = direction === 'enter' ? 'page-enter' : 'page-exit';
  element.classList.add(className);

  // Remove class after animation completes
  element.addEventListener('animationend', () => {
    element.classList.remove(className);
  }, { once: true });
}

/**
 * Hook for managing page transitions.
 */
export function usePageTransition() {
  const applyTransition = (element, direction = 'enter') => {
    applyPageTransition(element, direction);
  };

  return { applyTransition };
}

/**
 * Hook for managing modal animations.
 * @param {boolean} isOpen - Modal is open
 * @param {Function} onClose - Callback when modal closes
 */
export function useModalAnimation(isOpen, onClose) {
  return {
    isOpen,
    className: isOpen ? 'modal-enter' : 'modal-exit',
    onAnimationEnd: () => {
      if (!isOpen) onClose?.();
    },
  };
}

/**
 * Hook for detecting swipe gestures.
 * @param {number} threshold - Distance in pixels to trigger swipe
 * @returns {Object} Swipe handlers
 */
export function useSwipeGesture(threshold = 50) {
  let startX = 0;
  let startY = 0;

  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e, callbacks = {}) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = startX - endX;
    const diffY = startY - endY;

    // Check if swipe is more horizontal than vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > threshold) {
        callbacks.onSwipeLeft?.();
      } else if (diffX < -threshold) {
        callbacks.onSwipeRight?.();
      }
    }
  };

  return {
    handleTouchStart,
    handleTouchEnd,
    bind: {
      onTouchStart: handleTouchStart,
    },
  };
}

/**
 * Hook for managing drag feedback.
 * @returns {Object} Drag handlers
 */
export function useDragFeedback() {
  const handleDragStart = (e) => {
    if (e.currentTarget) {
      e.currentTarget.classList.add('dragging');
    }
  };

  const handleDragEnd = (e) => {
    if (e.currentTarget) {
      e.currentTarget.classList.remove('dragging');
    }
  };

  return {
    handleDragStart,
    handleDragEnd,
    bind: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  };
}

/**
 * Hook for managing long press gesture.
 * @param {Function} onLongPress - Callback when long pressed
 * @param {number} duration - Duration before triggering (ms)
 * @returns {Object} Touch handlers
 */
export function useLongPress(onLongPress, duration = 500) {
  let timeoutId = null;

  const handleTouchStart = () => {
    timeoutId = setTimeout(onLongPress, duration);
  };

  const handleTouchEnd = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return {
    handleTouchStart,
    handleTouchEnd,
    bind: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * Applies gesture feedback animation.
 * @param {HTMLElement} element - Element to animate
 * @param {string} gesture - 'swipe-left', 'swipe-right', 'long-press'
 */
export function applyGestureFeedback(element, gesture) {
  if (!element) return;

  element.classList.add('gesture-swipe', gesture);

  element.addEventListener('animationend', () => {
    element.classList.remove('gesture-swipe', gesture);
  }, { once: true });
}

/**
 * Applies haptic feedback if available.
 * @param {string} type - 'light', 'medium', 'heavy', 'success', 'warning', 'error'
 */
export function triggerHapticFeedback(type = 'light') {
  if (!navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [50],
    success: [10, 50, 10],
    warning: [20, 50, 20],
    error: [50, 50, 50],
  };

  const pattern = patterns[type] || patterns.light;
  navigator.vibrate(pattern);
}

export default {
  applyPageTransition,
  usePageTransition,
  useModalAnimation,
  useSwipeGesture,
  useDragFeedback,
  useLongPress,
  applyGestureFeedback,
  triggerHapticFeedback,
};
