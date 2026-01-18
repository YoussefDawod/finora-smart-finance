/**
 * @fileoverview useMotion Custom Hook
 * @description Wrapper around MotionContext for easy access to reduced motion preference
 * 
 * USAGE:
 * const { prefersReducedMotion } = useMotion();
 * 
 * @module useMotion
 */

import { useContext } from 'react';
import { MotionContext } from '@/context/MotionContext';

/**
 * Hook to use Motion Context
 * @throws {Error} If used outside MotionProvider
 * @returns {Object} Motion preferences
 * @returns {boolean} prefersReducedMotion - User prefers reduced motion
 * 
 * @example
 * const { prefersReducedMotion } = useMotion();
 * if (prefersReducedMotion) {
 *   // Skip animations
 * } else {
 *   // Play animations
 * }
 */
export function useMotion() {
  const context = useContext(MotionContext);

  if (context === undefined) {
    throw new Error(
      'useMotion must be used within a MotionProvider. ' +
      'Make sure your component tree is wrapped with <MotionProvider>.'
    );
  }

  return {
    prefersReducedMotion: context.prefersReducedMotion,
  };
}

export default useMotion;
