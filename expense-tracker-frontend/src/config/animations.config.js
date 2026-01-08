/**
 * Central animation definitions for CSS and Framer Motion usage.
 * Durations are expressed in milliseconds for CSS and converted to seconds for Framer Motion.
 */

const themeSpeeds = {
  fast: 160,
  normal: 220,
  slow: 320,
  ultraSlow: 480,
};

const easingCurves = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeBounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeElastic: 'cubic-bezier(0.8, -0.6, 0.2, 1.4)',
};

const baseAnimations = {
  fadeIn: { name: 'fade-in', duration: themeSpeeds.normal, easing: easingCurves.easeOut, delay: 0 },
  fadeOut: { name: 'fade-out', duration: themeSpeeds.normal, easing: easingCurves.easeIn, delay: 0 },
  slideUp: { name: 'slide-up', duration: themeSpeeds.normal, easing: easingCurves.easeOut, delay: 0 },
  slideDown: { name: 'slide-down', duration: themeSpeeds.normal, easing: easingCurves.easeOut, delay: 0 },
  slideLeft: { name: 'slide-left', duration: themeSpeeds.normal, easing: easingCurves.easeOut, delay: 0 },
  slideRight: { name: 'slide-right', duration: themeSpeeds.normal, easing: easingCurves.easeOut, delay: 0 },
  scaleIn: { name: 'scale-in', duration: themeSpeeds.fast, easing: easingCurves.easeOut, delay: 0 },
  scaleOut: { name: 'scale-out', duration: themeSpeeds.fast, easing: easingCurves.easeIn, delay: 0 },
  bounce: { name: 'bounce', duration: themeSpeeds.slow, easing: easingCurves.easeBounce, delay: 0 },
  spin: { name: 'spin', duration: themeSpeeds.normal, easing: 'linear', delay: 0 },
  pulse: { name: 'pulse', duration: themeSpeeds.slow, easing: easingCurves.easeInOut, delay: 0 },
  shakeX: { name: 'shake-x', duration: themeSpeeds.fast, easing: easingCurves.easeInOut, delay: 0 },
  shakeY: { name: 'shake-y', duration: themeSpeeds.fast, easing: easingCurves.easeInOut, delay: 0 },
};

const motionDisabledFallback = { name: 'none', duration: 0, easing: 'linear', delay: 0 };

const msToSeconds = (value) => Number((value / 1000).toFixed(3));

/**
 * Returns a CSS-friendly animation configuration and respects motion preferences.
 * @param {keyof typeof baseAnimations} key
 * @param {boolean} prefersReducedMotion
 * @returns {{ name: string, duration: number, easing: string, delay: number }}
 */
export const getAnimationDefinition = (key, prefersReducedMotion = false) => {
  const definition = baseAnimations[key];
  if (!definition) return motionDisabledFallback;
  return prefersReducedMotion ? { ...motionDisabledFallback, name: definition.name } : definition;
};

/**
 * Transition helper for Framer Motion that honors reduced motion.
 * @param {string} key
 * @param {boolean} prefersReducedMotion
 * @param {number} [customDelay]
 * @returns {{ duration: number, ease: string | number[], delay?: number }}
 */
export const getFramerTransition = (key, prefersReducedMotion = false, customDelay) => {
  const { duration, easing, delay } = getAnimationDefinition(key, prefersReducedMotion);
  return prefersReducedMotion
    ? { duration: 0, ease: 'linear', delay: 0 }
    : { duration: msToSeconds(duration), ease: easing, delay: customDelay ?? msToSeconds(delay) };
};

/**
 * Preconfigured animation presets for common interaction patterns.
 * These are ready-to-use Framer Motion props.
 */
export const motionPresets = {
  fadeIn: (prefersReducedMotion = false) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: getFramerTransition('fadeIn', prefersReducedMotion) },
    exit: { opacity: 0, transition: getFramerTransition('fadeOut', prefersReducedMotion) },
  }),
  fadeInUp: (prefersReducedMotion = false) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0, transition: getFramerTransition('slideUp', prefersReducedMotion) },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : 12, transition: getFramerTransition('slideDown', prefersReducedMotion) },
  }),
  scaleIn: (prefersReducedMotion = false) => ({
    initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 },
    animate: { opacity: 1, scale: 1, transition: getFramerTransition('scaleIn', prefersReducedMotion) },
    exit: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96, transition: getFramerTransition('scaleOut', prefersReducedMotion) },
  }),
  listStagger: (prefersReducedMotion = false, stagger = 0.06) => ({
    initial: 'hidden',
    animate: 'visible',
    variants: {
      hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
      visible: { opacity: 1, y: 0, transition: { staggerChildren: prefersReducedMotion ? 0 : stagger } },
    },
  }),
  shake: (prefersReducedMotion = false) => ({
    animate: prefersReducedMotion
      ? { opacity: 1 }
      : { transform: 'translateX(0)', transition: getFramerTransition('shakeX', prefersReducedMotion) },
  }),
};

export const animations = baseAnimations;
export const durations = themeSpeeds;
export const easings = easingCurves;
export const disabledAnimation = motionDisabledFallback;

export default {
  animations,
  durations,
  easings,
  motionPresets,
  disabledAnimation,
  getAnimationDefinition,
  getFramerTransition,
};
