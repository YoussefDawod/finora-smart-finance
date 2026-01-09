// src/config/animationVariants.js
// Centralized Framer Motion variants for premium micro-interactions

const easings = {
  emphasized: [0.18, 0.69, 0.3, 1],
  standard: [0.22, 0.61, 0.36, 1],
  exit: [0.4, 0, 0.2, 1],
};

export const transitions = {
  instant: { duration: 0.01 },
  micro: { duration: 0.12, ease: easings.standard },
  fast: { duration: 0.18, ease: easings.standard },
  base: { duration: 0.26, ease: easings.emphasized },
  slow: { duration: 0.36, ease: easings.emphasized },
};

const dampen = (value, reduce) => (reduce ? 0 : value);

export const listVariants = (reduceMotion = false) => ({
  container: {
    hidden: { opacity: 0, y: dampen(8, reduceMotion) },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        ...transitions.base,
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.02,
      },
    },
    exit: {
      opacity: 0,
      y: dampen(-8, reduceMotion),
      transition: transitions.fast,
    },
  },
  item: {
    hidden: { opacity: 0, y: dampen(12, reduceMotion), scale: reduceMotion ? 1 : 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { ...transitions.base },
    },
    exit: {
      opacity: 0,
      y: dampen(-6, reduceMotion),
      scale: reduceMotion ? 1 : 0.98,
      transition: transitions.fast,
    },
  },
});

export const cardVariants = (reduceMotion = false) => ({
  initial: { opacity: 0, y: dampen(10, reduceMotion), scale: reduceMotion ? 1 : 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.base },
  exit: { opacity: 0, y: dampen(-8, reduceMotion), scale: reduceMotion ? 1 : 0.97, transition: transitions.fast },
  hover: {
    scale: reduceMotion ? 1 : 1.01,
    rotateX: dampen(1.5, reduceMotion),
    translateY: dampen(-2, reduceMotion),
    transformPerspective: 900,
    boxShadow: 'var(--shadow-lg)',
    transition: transitions.fast,
  },
  tap: {
    scale: reduceMotion ? 1 : 0.99,
    translateY: dampen(1, reduceMotion),
    transition: transitions.micro,
  },
});

export const buttonVariants = (reduceMotion = false) => ({
  initial: { scale: 1 },
  hover: { scale: reduceMotion ? 1 : 1.03, transition: transitions.micro },
  tap: { scale: reduceMotion ? 1 : 0.97, transition: transitions.micro },
  focus: { boxShadow: '0 0 0 3px var(--color-info-bg)' },
});

export const modalVariants = (reduceMotion = false) => ({
  overlay: {
    hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
    visible: {
      opacity: 1,
      backdropFilter: 'blur(8px)',
      transition: { ...transitions.base, delay: reduceMotion ? 0 : 0.02 },
    },
    exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: transitions.fast },
  },
  content: {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.96, y: dampen(12, reduceMotion) },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { ...transitions.base },
    },
    exit: {
      opacity: 0,
      scale: reduceMotion ? 1 : 0.95,
      y: dampen(-10, reduceMotion),
      transition: transitions.fast,
    },
  },
});

export const gestureVariants = (reduceMotion = false) => ({
  swipe: {
    drag: 'x',
    dragConstraints: { left: 0, right: 0 },
    whileDrag: { scale: reduceMotion ? 1 : 0.98, rotate: dampen(2, reduceMotion) },
  },
  longPress: {
    whileTap: { scale: reduceMotion ? 1 : 0.96, boxShadow: 'var(--shadow-md)' },
  },
});

export const feedbackVariants = (reduceMotion = false) => ({
  success: {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: dampen(2, reduceMotion),
      transition: { ...transitions.fast },
    },
    exit: { opacity: 0, scale: reduceMotion ? 1 : 0.9, transition: transitions.fast },
  },
  caution: {
    hidden: { opacity: 0, y: dampen(10, reduceMotion) },
    visible: {
      opacity: 1,
      y: 0,
      transition: { ...transitions.fast },
    },
    exit: { opacity: 0, y: dampen(-6, reduceMotion), transition: transitions.fast },
  },
});
