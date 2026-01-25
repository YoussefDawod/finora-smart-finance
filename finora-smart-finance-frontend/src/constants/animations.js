/**
 * ============================================================================
 * ANIMATION KONSTANTEN
 * Wiederverwendbare Framer Motion Varianten
 * ============================================================================
 */

// ──────────────────────────────────────────────────────────────────────
// FORM CONTAINER VARIANTEN
// ──────────────────────────────────────────────────────────────────────
export const formContainerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08,
    },
  },
};

// ──────────────────────────────────────────────────────────────────────
// FORM ITEM VARIANTEN
// ──────────────────────────────────────────────────────────────────────
export const formItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// ──────────────────────────────────────────────────────────────────────
// CARD VARIANTEN
// ──────────────────────────────────────────────────────────────────────
export const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ──────────────────────────────────────────────────────────────────────
// LIST ITEM VARIANTEN
// ──────────────────────────────────────────────────────────────────────
export const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

// ──────────────────────────────────────────────────────────────────────
// FADE VARIANTEN
// ──────────────────────────────────────────────────────────────────────
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ──────────────────────────────────────────────────────────────────────
// SLIDE UP VARIANTEN
// ──────────────────────────────────────────────────────────────────────
export const slideUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ──────────────────────────────────────────────────────────────────────
// BUTTON HOVER/TAP PROPS
// ──────────────────────────────────────────────────────────────────────
export const buttonMotionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

// ──────────────────────────────────────────────────────────────────────
// STAGGER CONTAINER (für Listen)
// ──────────────────────────────────────────────────────────────────────
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// ──────────────────────────────────────────────────────────────────────
// MODAL VARIANTEN
// ──────────────────────────────────────────────────────────────────────
export const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 },
  },
};
