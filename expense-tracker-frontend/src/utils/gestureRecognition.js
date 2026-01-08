/**
 * Gesture recognition engine for swipe, pinch, long press, and double tap.
 */
import { getEventCoordinates, getDistance, getAllTouchPoints } from './touchDetection';

/**
 * Swipe gesture detector.
 * @param {TouchEvent} startEvent
 * @param {TouchEvent} endEvent
 * @param {{ minDistance?: number, maxDuration?: number }} options
 * @returns {{ direction: string | null, velocity: number, distance: number }}
 */
export const detectSwipe = (startEvent, endEvent, options = {}) => {
  const { minDistance = 50, maxDuration = 500 } = options;
  
  const start = getEventCoordinates(startEvent);
  const end = getEventCoordinates(endEvent);
  
  const deltaX = end.clientX - start.clientX;
  const deltaY = end.clientY - start.clientY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const duration = endEvent.timeStamp - startEvent.timeStamp;
  const velocity = duration > 0 ? distance / duration : 0;
  
  if (distance < minDistance || duration > maxDuration) {
    return { direction: null, velocity, distance };
  }
  
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  let direction = null;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    direction = deltaX > 0 ? 'right' : 'left';
  } else {
    direction = deltaY > 0 ? 'down' : 'up';
  }
  
  return { direction, velocity, distance, angle };
};

/**
 * Pinch gesture detector (two-finger zoom).
 * @param {Array} startTouches
 * @param {Array} currentTouches
 * @param {{ minScale?: number }} options
 * @returns {{ scale: number, distance: number, center: { x: number, y: number } }}
 */
export const detectPinch = (startTouches, currentTouches, options = {}) => {
  const { minScale = 0.2 } = options;
  
  if (!startTouches || startTouches.length < 2 || !currentTouches || currentTouches.length < 2) {
    return { scale: 1, distance: 0, center: { x: 0, y: 0 } };
  }
  
  const startDistance = getDistance(startTouches[0], startTouches[1]);
  const currentDistance = getDistance(currentTouches[0], currentTouches[1]);
  
  const scale = startDistance > 0 ? currentDistance / startDistance : 1;
  
  if (Math.abs(scale - 1) < minScale) {
    return { scale: 1, distance: currentDistance, center: { x: 0, y: 0 } };
  }
  
  const center = {
    x: (currentTouches[0].clientX + currentTouches[1].clientX) / 2,
    y: (currentTouches[0].clientY + currentTouches[1].clientY) / 2,
  };
  
  return { scale, distance: currentDistance, center };
};

/**
 * Long press gesture detector.
 * @param {TouchEvent} startEvent
 * @param {TouchEvent | null} currentEvent
 * @param {{ duration?: number, movementThreshold?: number }} options
 * @returns {{ isLongPress: boolean, elapsed: number, moved: number }}
 */
export const detectLongPress = (startEvent, currentEvent, options = {}) => {
  const { duration = 500, movementThreshold = 10 } = options;
  
  const start = getEventCoordinates(startEvent);
  const elapsed = currentEvent ? currentEvent.timeStamp - startEvent.timeStamp : 0;
  
  if (elapsed < duration) {
    return { isLongPress: false, elapsed, moved: 0 };
  }
  
  if (!currentEvent) {
    return { isLongPress: true, elapsed, moved: 0 };
  }
  
  const current = getEventCoordinates(currentEvent);
  const deltaX = current.clientX - start.clientX;
  const deltaY = current.clientY - start.clientY;
  const moved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const isLongPress = moved < movementThreshold;
  
  return { isLongPress, elapsed, moved };
};

/**
 * Double tap gesture detector.
 * @param {TouchEvent} firstTap
 * @param {TouchEvent} secondTap
 * @param {{ maxDelay?: number, movementThreshold?: number }} options
 * @returns {{ isDoubleTap: boolean, delay: number, distance: number }}
 */
export const detectDoubleTap = (firstTap, secondTap, options = {}) => {
  const { maxDelay = 300, movementThreshold = 20 } = options;
  
  const first = getEventCoordinates(firstTap);
  const second = getEventCoordinates(secondTap);
  
  const delay = secondTap.timeStamp - firstTap.timeStamp;
  const deltaX = second.clientX - first.clientX;
  const deltaY = second.clientY - first.clientY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const isDoubleTap = delay <= maxDelay && distance < movementThreshold;
  
  return { isDoubleTap, delay, distance };
};

/**
 * Rotation gesture detector (two-finger rotation).
 * @param {Array} startTouches
 * @param {Array} currentTouches
 * @returns {{ rotation: number, angle: number }}
 */
export const detectRotation = (startTouches, currentTouches) => {
  if (!startTouches || startTouches.length < 2 || !currentTouches || currentTouches.length < 2) {
    return { rotation: 0, angle: 0 };
  }
  
  const startAngle = Math.atan2(
    startTouches[1].clientY - startTouches[0].clientY,
    startTouches[1].clientX - startTouches[0].clientX
  );
  
  const currentAngle = Math.atan2(
    currentTouches[1].clientY - currentTouches[0].clientY,
    currentTouches[1].clientX - currentTouches[0].clientX
  );
  
  const rotation = (currentAngle - startAngle) * (180 / Math.PI);
  
  return { rotation, angle: currentAngle * (180 / Math.PI) };
};

/**
 * Pan gesture detector (single or multi-finger drag).
 * @param {TouchEvent} startEvent
 * @param {TouchEvent} currentEvent
 * @returns {{ deltaX: number, deltaY: number, distance: number, velocity: number }}
 */
export const detectPan = (startEvent, currentEvent) => {
  const start = getEventCoordinates(startEvent);
  const current = getEventCoordinates(currentEvent);
  
  const deltaX = current.clientX - start.clientX;
  const deltaY = current.clientY - start.clientY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const duration = currentEvent.timeStamp - startEvent.timeStamp;
  const velocity = duration > 0 ? distance / duration : 0;
  
  return { deltaX, deltaY, distance, velocity };
};

/**
 * Creates a custom gesture pattern matcher.
 * @param {Array<{ x: number, y: number, timestamp: number }>} points
 * @param {Array<{ type: string, threshold: number }>} pattern
 * @returns {boolean}
 */
export const matchGesturePattern = (points, pattern) => {
  if (!points || points.length < 2) return false;
  
  for (let i = 0; i < pattern.length; i++) {
    const step = pattern[i];
    const pointIndex = Math.min(i, points.length - 1);
    const nextIndex = Math.min(i + 1, points.length - 1);
    
    const deltaX = points[nextIndex].x - points[pointIndex].x;
    const deltaY = points[nextIndex].y - points[pointIndex].y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (step.type === 'right' && (deltaX < step.threshold || Math.abs(deltaY) > deltaX)) return false;
    if (step.type === 'left' && (deltaX > -step.threshold || Math.abs(deltaY) > -deltaX)) return false;
    if (step.type === 'up' && (deltaY > -step.threshold || Math.abs(deltaX) > -deltaY)) return false;
    if (step.type === 'down' && (deltaY < step.threshold || Math.abs(deltaX) > deltaY)) return false;
  }
  
  return true;
};

/**
 * Calculates swipe velocity in pixels per millisecond.
 * @param {number} distance
 * @param {number} duration
 * @returns {number}
 */
export const calculateVelocity = (distance, duration) => {
  return duration > 0 ? distance / duration : 0;
};

/**
 * Determines if a gesture is a tap (short, minimal movement).
 * @param {TouchEvent} startEvent
 * @param {TouchEvent} endEvent
 * @param {{ maxDuration?: number, movementThreshold?: number }} options
 * @returns {boolean}
 */
export const isTap = (startEvent, endEvent, options = {}) => {
  const { maxDuration = 200, movementThreshold = 10 } = options;
  
  const start = getEventCoordinates(startEvent);
  const end = getEventCoordinates(endEvent);
  
  const deltaX = end.clientX - start.clientX;
  const deltaY = end.clientY - start.clientY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const duration = endEvent.timeStamp - startEvent.timeStamp;
  
  return duration <= maxDuration && distance < movementThreshold;
};
