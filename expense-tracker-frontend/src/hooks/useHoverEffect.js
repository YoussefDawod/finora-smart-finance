/**
 * Hook for managing hover effects on elements.
 * Provides hover state detection and cleanup.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for detecting and managing hover state.
 * @param {Object} options - Configuration options
 * @returns {Object} Ref, isHovered state, and bind functions
 */
export function useHoverEffect({
  onEnter = null,
  onLeave = null,
  delay = 0,
} = {}) {
  const [isHovered, setIsHovered] = useState(false);
  const delayTimeoutRef = useRef(null);
  const elementRef = useRef(null);

  // Check if reduced motion is enabled
  const prefersReducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const handleMouseEnter = useCallback(() => {
    if (prefersReducedMotion.current) {
      setIsHovered(true);
      onEnter?.();
      return;
    }

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setIsHovered(true);
        onEnter?.();
      }, delay);
    } else {
      setIsHovered(true);
      onEnter?.();
    }
  }, [delay, onEnter]);

  const handleMouseLeave = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }

    setIsHovered(false);
    onLeave?.();
  }, [onLeave]);

  // Add touch support
  const handleTouchStart = useCallback(() => {
    handleMouseEnter();
  }, [handleMouseEnter]);

  const handleTouchEnd = useCallback(() => {
    handleMouseLeave();
  }, [handleMouseLeave]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);

      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd]);

  return {
    ref: elementRef,
    isHovered,
    bind: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * Hook for managing multiple hover effects with different targets.
 * @param {number} count - Number of elements to track
 * @returns {Array} Array of hover states and handlers
 */
export function useMultipleHoverEffects(count) {
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const handlers = Array.from({ length: count }, (_, index) => ({
    onMouseEnter: () => setHoveredIndex(index),
    onMouseLeave: () => setHoveredIndex(-1),
    isHovered: hoveredIndex === index,
  }));

  return handlers;
}

/**
 * Hook for detecting hover on a list of items.
 * @returns {Object} Current hovered item index and bind functions
 */
export function useListHoverEffect() {
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const createItemHandlers = useCallback((index) => ({
    onMouseEnter: () => setHoveredIndex(index),
    onMouseLeave: () => setHoveredIndex(-1),
    isHovered: hoveredIndex === index,
  }), [hoveredIndex]);

  return {
    hoveredIndex,
    createItemHandlers,
    resetHover: () => setHoveredIndex(-1),
  };
}

export default useHoverEffect;
