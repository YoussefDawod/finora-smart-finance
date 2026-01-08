/**
 * Gesture-based animation hooks leveraging Framer Motion props.
 */
import { useMemo } from 'react';
import { useMotion } from '../context/MotionContext';
import { resolveTransition, springPresets, tweenPresets } from '../config/framerMotionConfig';

const isDisabled = (prefersReducedMotion, animationsEnabled) => prefersReducedMotion || !animationsEnabled;

export const useHoverAnimation = (options = {}) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = isDisabled(prefersReducedMotion, animationsEnabled);

  return useMemo(() => {
    if (disabled) return {};
    const { scale = 1.02, shadow = '0 12px 28px rgba(0,0,0,0.12)', transition = tweenPresets.fast } = options;
    return {
      whileHover: { scale, boxShadow: shadow, transition: resolveTransition(transition, prefersReducedMotion) },
    };
  }, [disabled, options, prefersReducedMotion]);
};

export const useTapAnimation = (options = {}) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = isDisabled(prefersReducedMotion, animationsEnabled);

  return useMemo(() => {
    if (disabled) return {};
    const { scale = 0.95, transition = tweenPresets.fast } = options;
    return {
      whileTap: { scale, transition: resolveTransition(transition, prefersReducedMotion) },
    };
  }, [disabled, options, prefersReducedMotion]);
};

export const useDragAnimation = (options = {}) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = isDisabled(prefersReducedMotion, animationsEnabled);

  return useMemo(() => {
    if (disabled) return { drag: false };

    const {
      liftY = -8,
      shadow = '0 16px 32px rgba(0,0,0,0.18)',
      dragElastic = 0.12,
      dragTransition = springPresets.gentle,
    } = options;

    return {
      drag: true,
      whileDrag: { y: liftY, boxShadow: shadow },
      dragElastic,
      dragTransition: resolveTransition(dragTransition, prefersReducedMotion),
    };
  }, [disabled, options, prefersReducedMotion]);
};

/**
 * Combines multiple gesture configs into one props object.
 */
export const useGestureDetection = (gestureOptions = {}) => {
  const hover = useHoverAnimation(gestureOptions.hover);
  const tap = useTapAnimation(gestureOptions.tap);
  const drag = useDragAnimation(gestureOptions.drag);

  return useMemo(() => ({ ...hover, ...tap, ...drag }), [hover, tap, drag]);
};
