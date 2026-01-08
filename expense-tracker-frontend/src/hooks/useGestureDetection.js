/**
 * React hooks for gesture detection with motion preference awareness.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useMotion } from '../context/MotionContext';
import { addPassiveListener, getEventCoordinates, getAllTouchPoints } from '../utils/touchDetection';
import { detectSwipe, detectPinch, detectLongPress, detectDoubleTap, isTap } from '../utils/gestureRecognition';

/**
 * Hook for swipe gesture detection.
 * @param {{ onSwipe?: Function, onSwipeLeft?: Function, onSwipeRight?: Function, onSwipeUp?: Function, onSwipeDown?: Function, minDistance?: number, maxDuration?: number }} options
 */
export const useSwipe = (options = {}) => {
  const { onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minDistance = 50, maxDuration = 500 } = options;
  const { prefersReducedMotion } = useMotion();
  const startEventRef = useRef(null);
  
  const handleTouchStart = useCallback((event) => {
    startEventRef.current = event;
  }, []);
  
  const handleTouchEnd = useCallback((event) => {
    if (!startEventRef.current) return;
    
    const result = detectSwipe(startEventRef.current, event, { minDistance, maxDuration });
    
    if (result.direction) {
      if (onSwipe) onSwipe(result);
      
      switch (result.direction) {
        case 'left':
          if (onSwipeLeft) onSwipeLeft(result);
          break;
        case 'right':
          if (onSwipeRight) onSwipeRight(result);
          break;
        case 'up':
          if (onSwipeUp) onSwipeUp(result);
          break;
        case 'down':
          if (onSwipeDown) onSwipeDown(result);
          break;
      }
    }
    
    startEventRef.current = null;
  }, [onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minDistance, maxDuration]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Hook for pinch gesture detection (two-finger zoom).
 * @param {{ onPinch?: Function, onPinchStart?: Function, onPinchEnd?: Function, minScale?: number, maxScale?: number }} options
 */
export const usePinch = (options = {}) => {
  const { onPinch, onPinchStart, onPinchEnd, minScale = 0.5, maxScale = 3 } = options;
  const { prefersReducedMotion } = useMotion();
  const startTouchesRef = useRef(null);
  const isPinchingRef = useRef(false);
  
  const handleTouchStart = useCallback((event) => {
    if (event.touches && event.touches.length === 2) {
      startTouchesRef.current = getAllTouchPoints(event);
      isPinchingRef.current = true;
      if (onPinchStart) onPinchStart();
    }
  }, [onPinchStart]);
  
  const handleTouchMove = useCallback((event) => {
    if (!isPinchingRef.current || !startTouchesRef.current || event.touches.length !== 2) return;
    
    const currentTouches = getAllTouchPoints(event);
    const result = detectPinch(startTouchesRef.current, currentTouches);
    
    const boundedScale = Math.max(minScale, Math.min(maxScale, result.scale));
    
    if (onPinch) {
      onPinch({ ...result, scale: boundedScale });
    }
  }, [onPinch, minScale, maxScale]);
  
  const handleTouchEnd = useCallback(() => {
    if (isPinchingRef.current) {
      isPinchingRef.current = false;
      startTouchesRef.current = null;
      if (onPinchEnd) onPinchEnd();
    }
  }, [onPinchEnd]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Hook for long press detection.
 * @param {{ onLongPress?: Function, duration?: number, movementThreshold?: number }} options
 */
export const useLongPress = (options = {}) => {
  const { onLongPress, duration = 500, movementThreshold = 10 } = options;
  const { prefersReducedMotion } = useMotion();
  const startEventRef = useRef(null);
  const timerRef = useRef(null);
  const triggeredRef = useRef(false);
  
  const handleTouchStart = useCallback((event) => {
    startEventRef.current = event;
    triggeredRef.current = false;
    
    timerRef.current = setTimeout(() => {
      const result = detectLongPress(startEventRef.current, null, { duration, movementThreshold });
      if (result.isLongPress && onLongPress) {
        triggeredRef.current = true;
        onLongPress(getEventCoordinates(startEventRef.current));
        if (navigator.vibrate) navigator.vibrate(20);
      }
    }, duration);
  }, [onLongPress, duration, movementThreshold]);
  
  const handleTouchMove = useCallback((event) => {
    if (!startEventRef.current || triggeredRef.current) return;
    
    const result = detectLongPress(startEventRef.current, event, { duration, movementThreshold });
    if (result.moved >= movementThreshold) {
      clearTimeout(timerRef.current);
      startEventRef.current = null;
    }
  }, [duration, movementThreshold]);
  
  const handleTouchEnd = useCallback(() => {
    clearTimeout(timerRef.current);
    startEventRef.current = null;
    triggeredRef.current = false;
  }, []);
  
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Hook for double tap detection.
 * @param {{ onDoubleTap?: Function, maxDelay?: number, movementThreshold?: number }} options
 */
export const useDoubleTap = (options = {}) => {
  const { onDoubleTap, maxDelay = 300, movementThreshold = 20 } = options;
  const { prefersReducedMotion } = useMotion();
  const firstTapRef = useRef(null);
  const timerRef = useRef(null);
  
  const handleTouchEnd = useCallback((event) => {
    if (!firstTapRef.current) {
      firstTapRef.current = event;
      timerRef.current = setTimeout(() => {
        firstTapRef.current = null;
      }, maxDelay);
      return;
    }
    
    const result = detectDoubleTap(firstTapRef.current, event, { maxDelay, movementThreshold });
    
    if (result.isDoubleTap && onDoubleTap) {
      onDoubleTap(getEventCoordinates(event));
      if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
    }
    
    clearTimeout(timerRef.current);
    firstTapRef.current = null;
  }, [onDoubleTap, maxDelay, movementThreshold]);
  
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);
  
  return {
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Hook for multi-touch detection.
 * @param {{ onMultiTouch?: Function, fingerCount?: number }} options
 */
export const useMultiTouch = (options = {}) => {
  const { onMultiTouch, fingerCount = 2 } = options;
  const { prefersReducedMotion } = useMotion();
  
  const handleTouchStart = useCallback((event) => {
    if (event.touches && event.touches.length >= fingerCount) {
      const touches = getAllTouchPoints(event);
      if (onMultiTouch) {
        onMultiTouch({ touches, count: touches.length });
      }
    }
  }, [onMultiTouch, fingerCount]);
  
  return {
    onTouchStart: handleTouchStart,
  };
};

/**
 * Hook for tap detection (distinguished from long press/swipe).
 * @param {{ onTap?: Function }} options
 */
export const useTap = (options = {}) => {
  const { onTap } = options;
  const startEventRef = useRef(null);
  
  const handleTouchStart = useCallback((event) => {
    startEventRef.current = event;
  }, []);
  
  const handleTouchEnd = useCallback((event) => {
    if (!startEventRef.current) return;
    
    if (isTap(startEventRef.current, event)) {
      if (onTap) onTap(getEventCoordinates(event));
    }
    
    startEventRef.current = null;
  }, [onTap]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};
