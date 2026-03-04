/**
 * @fileoverview Motion Context Provider
 * @description Manages reduced motion preference from OS/browser settings.
 * Used for conditional animations with Framer Motion or CSS animations.
 * 
 * STATE SHAPE:
 * {
 *   prefersReducedMotion: boolean
 * }
 * 
 * USAGE:
 * const { prefersReducedMotion } = useMotion();
 * 
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { opacity: 1 }}
 *   transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
 * >
 *   Content
 * </motion.div>
 * 
 * @module MotionContext
 */

import { createContext, useMemo, useSyncExternalStore } from 'react';

// ============================================
// 🎬 CONSTANTS
// ============================================

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Subscribe to matchMedia changes for reduced motion
 * @param {Function} callback - Subscriber callback
 * @returns {Function} Unsubscribe function
 */
function subscribeReducedMotion(callback) {
  const mq = globalThis.window?.matchMedia(MEDIA_QUERY);
  if (!mq) return () => {};
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

/** @returns {boolean} Current reduced motion preference */
function getReducedMotionSnapshot() {
  return globalThis.window?.matchMedia(MEDIA_QUERY).matches ?? false;
}

/** @returns {boolean} Server-side fallback */
function getReducedMotionServerSnapshot() {
  return false;
}

// ============================================
// 📦 CONTEXT
// ============================================

// eslint-disable-next-line react-refresh/only-export-components
export const MotionContext = createContext(undefined);

// ============================================
// 🎯 PROVIDER COMPONENT
// ============================================

/**
 * MotionProvider Component
 * Detects and listens to @media (prefers-reduced-motion: reduce) preference
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function MotionProvider({ children }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // ============================================
  // 📤 CONTEXT VALUE
  // ============================================

  const value = useMemo(() => ({
    prefersReducedMotion,
  }), [prefersReducedMotion]);

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

// Hook moved to @/hooks/useMotion.js — import from there.
