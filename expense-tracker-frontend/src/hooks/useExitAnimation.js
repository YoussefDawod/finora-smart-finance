/**
 * Exit animation helper respecting reduced motion preferences.
 */
import { useCallback } from 'react';
import { useMotion } from '../context/MotionContext';
import { tweenPresets, resolveTransition } from '../config/framerMotionConfig';

export const useExitAnimation = () => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;

  const getExitProps = useCallback(
    (preset = 'fade-slide') => {
      if (disabled) {
        return { exit: { opacity: 0, transition: resolveTransition(tweenPresets.fast, true) } };
      }

      switch (preset) {
        case 'fade':
          return { exit: { opacity: 0, transition: resolveTransition(tweenPresets.normal, false) } };
        case 'scale':
          return {
            exit: {
              opacity: 0,
              scale: 0.95,
              transition: resolveTransition(tweenPresets.normal, false),
            },
          };
        case 'fade-slide':
        default:
          return {
            exit: {
              opacity: 0,
              y: 12,
              transition: resolveTransition(tweenPresets.normal, false),
            },
          };
      }
    },
    [disabled]
  );

  return { getExitProps, exitDisabled: disabled };
};
