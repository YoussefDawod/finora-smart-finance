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
// BUTTON HOVER/TAP PROPS
// ──────────────────────────────────────────────────────────────────────
export const buttonMotionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};
