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

import { createContext, useState, useEffect, useContext } from 'react';

// ============================================
// 🎬 CONSTANTS
// ============================================

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

/* eslint-disable no-undef */

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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // ============================================
  // 🔍 DETECT & LISTEN TO REDUCED MOTION
  // ============================================

  useEffect(() => {
    if (typeof globalThis.window === 'undefined') {
      return;
    }

    // Check initial preference
    const mediaQuery = globalThis.window.matchMedia(MEDIA_QUERY);
    setPrefersReducedMotion(mediaQuery.matches);

    /**
     * Handler for media query changes
     * @param {MediaQueryListEvent} event
     */
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers use addEventListener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // ============================================
  // 📤 CONTEXT VALUE
  // ============================================

  const value = {
    prefersReducedMotion,
  };

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

// ============================================
// 🪝 CUSTOM HOOK
// ============================================

// eslint-disable-next-line react-refresh/only-export-components
export const useMotion = () => {
  const context = useContext(MotionContext);
  
  if (context === undefined) {
    throw new Error('useMotion must be used within a MotionProvider');
  }

  return {
    prefersReducedMotion: context.prefersReducedMotion,
    shouldAnimate: !context.prefersReducedMotion,
  };
};
