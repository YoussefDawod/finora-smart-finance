/**
 * Centralized Framer Motion configuration with presets and motion awareness.
 */
import { durations, easings } from './animations.config';

const msToSeconds = (value) => Number((value / 1000).toFixed(3));

export const springPresets = {
  stiff: { type: 'spring', stiffness: 240, damping: 28, mass: 1, restDelta: 0.01 },
  gentle: { type: 'spring', stiffness: 160, damping: 22, mass: 1.1, restDelta: 0.01 },
  wobbly: { type: 'spring', stiffness: 200, damping: 14, mass: 1, restDelta: 0.01 },
};

export const tweenPresets = {
  fast: { type: 'tween', duration: msToSeconds(durations.fast), ease: easings.easeOut },
  normal: { type: 'tween', duration: msToSeconds(durations.normal), ease: easings.easeInOut },
  slow: { type: 'tween', duration: msToSeconds(durations.slow), ease: easings.easeIn },
};

export const inertiaPresets = {
  swipe: {
    type: 'inertia',
    power: 0.8,
    timeConstant: 700,
    bounceStiffness: 120,
    bounceDamping: 14,
  },
  glide: {
    type: 'inertia',
    power: 0.5,
    timeConstant: 500,
    bounceStiffness: 80,
    bounceDamping: 12,
  },
};

const reducedMotionTransition = { type: 'tween', duration: 0 };

/**
 * Returns a transition preset that respects motion preferences.
 * @param {object} preset
 * @param {boolean} prefersReducedMotion
 * @returns {object}
 */
export const resolveTransition = (preset, prefersReducedMotion) =>
  prefersReducedMotion ? reducedMotionTransition : preset;

export const defaultSpring = springPresets.gentle;
export const defaultTween = tweenPresets.normal;

export default {
  springPresets,
  tweenPresets,
  inertiaPresets,
  resolveTransition,
  defaultSpring,
  defaultTween,
};
