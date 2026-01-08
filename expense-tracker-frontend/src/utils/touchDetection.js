/**
 * Touch event detection utilities for mobile-first gesture support.
 * Uses passive listeners and RAF for optimal performance.
 */

/**
 * Detects if the current device supports touch events.
 * @returns {boolean}
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Detects if the device supports pointer events.
 * @returns {boolean}
 */
export const supportsPointerEvents = () => {
  return typeof window !== 'undefined' && 'PointerEvent' in window;
};

/**
 * Extracts coordinates from touch or mouse event.
 * @param {TouchEvent | MouseEvent | PointerEvent} event
 * @returns {{ clientX: number, clientY: number, pageX: number, pageY: number }}
 */
export const getEventCoordinates = (event) => {
  if (event.touches && event.touches.length > 0) {
    const touch = event.touches[0];
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
    };
  }
  
  if (event.changedTouches && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
    };
  }
  
  return {
    clientX: event.clientX || 0,
    clientY: event.clientY || 0,
    pageX: event.pageX || 0,
    pageY: event.pageY || 0,
  };
};

/**
 * Gets all touch points from a multi-touch event.
 * @param {TouchEvent} event
 * @returns {Array<{ clientX: number, clientY: number, pageX: number, pageY: number, identifier: number }>}
 */
export const getAllTouchPoints = (event) => {
  if (!event.touches) return [];
  
  return Array.from(event.touches).map((touch) => ({
    clientX: touch.clientX,
    clientY: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY,
    identifier: touch.identifier,
    force: touch.force || 0,
    radiusX: touch.radiusX || 0,
    radiusY: touch.radiusY || 0,
    rotationAngle: touch.rotationAngle || 0,
  }));
};

/**
 * Detects if multi-touch is active.
 * @param {TouchEvent} event
 * @returns {boolean}
 */
export const isMultiTouch = (event) => {
  return event.touches && event.touches.length > 1;
};

/**
 * Gets the number of active touch points.
 * @param {TouchEvent} event
 * @returns {number}
 */
export const getTouchCount = (event) => {
  return event.touches ? event.touches.length : 0;
};

/**
 * Extracts pressure/force from touch event (if supported).
 * @param {TouchEvent} event
 * @returns {number} Force value between 0 and 1, or 0 if not supported
 */
export const getTouchForce = (event) => {
  if (!event.touches || event.touches.length === 0) return 0;
  const touch = event.touches[0];
  return touch.force !== undefined ? touch.force : 0;
};

/**
 * Calculates the distance between two touch points.
 * @param {{ clientX: number, clientY: number }} point1
 * @param {{ clientX: number, clientY: number }} point2
 * @returns {number}
 */
export const getDistance = (point1, point2) => {
  const dx = point2.clientX - point1.clientX;
  const dy = point2.clientY - point1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculates the angle between two touch points in radians.
 * @param {{ clientX: number, clientY: number }} point1
 * @param {{ clientX: number, clientY: number }} point2
 * @returns {number}
 */
export const getAngle = (point1, point2) => {
  return Math.atan2(point2.clientY - point1.clientY, point2.clientX - point1.clientX);
};

/**
 * Attaches a passive event listener for better scroll performance.
 * @param {EventTarget} target
 * @param {string} eventName
 * @param {Function} handler
 * @param {boolean} passive
 * @returns {Function} Cleanup function
 */
export const addPassiveListener = (target, eventName, handler, passive = true) => {
  if (!target || !target.addEventListener) return () => {};
  
  const options = passive ? { passive: true } : false;
  target.addEventListener(eventName, handler, options);
  
  return () => {
    target.removeEventListener(eventName, handler, options);
  };
};

/**
 * Creates a touch phase tracker.
 * @returns {{ phase: string, setPhase: Function, isActive: Function }}
 */
export const createTouchPhaseTracker = () => {
  let currentPhase = 'idle';
  
  return {
    get phase() {
      return currentPhase;
    },
    setPhase(newPhase) {
      currentPhase = newPhase;
    },
    isActive() {
      return currentPhase !== 'idle';
    },
  };
};

/**
 * Throttles touch move events using requestAnimationFrame.
 * @param {Function} callback
 * @returns {Function}
 */
export const throttleTouchMove = (callback) => {
  let rafId = null;
  let lastArgs = null;
  
  const tick = () => {
    if (lastArgs) {
      callback(...lastArgs);
      lastArgs = null;
    }
    rafId = null;
  };
  
  return (...args) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(tick);
    }
  };
};

/**
 * Normalizes wheel delta for cross-browser compatibility.
 * @param {WheelEvent} event
 * @returns {number}
 */
export const normalizeWheel = (event) => {
  let delta = 0;
  
  if (event.deltaY !== undefined) {
    delta = event.deltaY;
  } else if (event.wheelDelta !== undefined) {
    delta = -event.wheelDelta;
  }
  
  return delta;
};
