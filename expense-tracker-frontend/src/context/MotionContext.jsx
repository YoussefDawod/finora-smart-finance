/**
 * MotionContext provides global animation preferences and controls.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { defaultSpring } from '../config/framerMotionConfig';

const MotionContext = createContext(undefined);

export const MotionProvider = ({ children, config = defaultSpring, onAnimationStart, onAnimationComplete }) => {
  const { prefersReducedMotion } = useMotionPreference();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const handleAnimationStart = useCallback(() => {
    setIsAnimating(true);
    if (onAnimationStart) onAnimationStart();
  }, [onAnimationStart]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    if (onAnimationComplete) onAnimationComplete();
  }, [onAnimationComplete]);

  const value = useMemo(
    () => ({
      motionConfig: config,
      isAnimating,
      animationsEnabled,
      prefersReducedMotion,
      setAnimationsEnabled,
      onAnimationStart: handleAnimationStart,
      onAnimationComplete: handleAnimationComplete,
    }),
    [config, isAnimating, animationsEnabled, prefersReducedMotion, handleAnimationStart, handleAnimationComplete]
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
};

MotionProvider.propTypes = {
  children: PropTypes.node.isRequired,
  config: PropTypes.object,
  onAnimationStart: PropTypes.func,
  onAnimationComplete: PropTypes.func,
};

export const useMotion = () => {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return ctx;
};
