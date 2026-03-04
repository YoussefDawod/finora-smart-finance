/**
 * @fileoverview Motion Presets for Finora Smart-Finance
 * @description Verbindliche framer-motion Variants für alle Komponenten.
 * 
 * SYSTEM-PRINZIPIEN:
 * - Motion ist funktional – nicht dekorativ
 * - prefers-reduced-motion ist immer bindend
 * - Kein Component darf Motion direkt erzwingen
 * 
 * VERWENDUNG:
 * import { cardVariants, modalVariants } from '@/utils/motionPresets';
 * import { useMotion } from '@/hooks/useMotion';
 * 
 * const { shouldAnimate } = useMotion();
 * <motion.div
 *   variants={cardVariants}
 *   initial={shouldAnimate ? 'hidden' : false}
 *   animate={shouldAnimate ? 'visible' : false}
 * />
 * 
 * @module motionPresets
 */

// ============================================
// 🎬 TIMING CONSTANTS (from CSS tokens)
// ============================================

export const MOTION_TIMING = {
  // Durations
  entrance: 0.25, // --motion-entrance-duration (250ms)
  exit: 0.15,     // --motion-exit-duration (150ms)
  fast: 0.15,     // --duration-fast
  normal: 0.25,   // --duration-normal
  slow: 0.35,     // --duration-slow
  
  // Stagger
  staggerDelay: 0.04, // --motion-stagger-delay
  
  // Y-Offset limits
  entranceY: 12, // --motion-entrance-y (max ±12px)
  exitY: 8,      // --motion-exit-y (max ±8px)
  
  // Scale limits (micro-feedback only)
  scaleHover: 1.02,  // --motion-scale-hover
  scaleActive: 0.98, // --motion-scale-active
};

// ============================================
// 🎯 EASING FUNCTIONS
// ============================================

export const MOTION_EASING = {
  // Standard easing
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0.2, 1],    // --ease-decelerate (entrance)
  accelerate: [0.4, 0, 1, 1],    // --ease-accelerate (exit)
  
  // Spring config (Sidebar, Drawer, CategoryPicker, Menu ONLY)
  spring: {
    stiffness: 420, // --motion-spring-stiffness
    damping: 34,    // --motion-spring-damping
  },
};

// ============================================
// 🃏 CARD VARIANTS
// ============================================
// Hover-Lift: y: -2px
// ❌ Kein Glow auf Content, nur Container-Outline erlaubt

export const cardVariants = {
  hidden: {
    opacity: 0,
    y: MOTION_TIMING.entranceY,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMING.entrance,
      ease: MOTION_EASING.decelerate,
    },
  },
  exit: {
    opacity: 0,
    y: -MOTION_TIMING.exitY,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
  hover: {
    y: -2,
    transition: {
      duration: MOTION_TIMING.fast,
      ease: MOTION_EASING.standard,
    },
  },
};

// ============================================
// 🪟 MODAL VARIANTS
// ============================================
// fade + y, backdropFadeIn
// ❌ Kein Glow erlaubt

export const modalVariants = {
  hidden: {
    opacity: 0,
    y: MOTION_TIMING.entranceY,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: MOTION_TIMING.entrance,
      ease: MOTION_EASING.decelerate,
    },
  },
  exit: {
    opacity: 0,
    y: -MOTION_TIMING.exitY,
    scale: 0.98,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: MOTION_TIMING.entrance,
      ease: MOTION_EASING.decelerate,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 📋 LIST VARIANTS (Container + Items)
// ============================================
// Stagger nur bei Listen OHNE Geldbeträge!
// ❌ Keine Layout-Animationen auf Zeilenebene

export const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION_TIMING.staggerDelay,
      delayChildren: 0.1,
    },
  },
  exit: { opacity: 0 },
};

export const listItemVariants = {
  hidden: {
    opacity: 0,
    y: MOTION_TIMING.entranceY,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMING.entrance,
      ease: MOTION_EASING.decelerate,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 📂 MENU / DROPDOWN VARIANTS
// ============================================
// Spring erlaubt für: Sidebar, Drawer, CategoryPicker, Menu

export const menuVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      ...MOTION_EASING.spring,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 📂 SIDEBAR / DRAWER VARIANTS
// ============================================
// Spring erlaubt

export const sidebarVariants = {
  hidden: {
    x: '-100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      ...MOTION_EASING.spring,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

export const drawerVariants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      ...MOTION_EASING.spring,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 📱 PAGE TRANSITION VARIANTS
// ============================================
// y maximal 10px, duration max 0.32s

export const pageVariants = {
  hidden: {
    opacity: 0,
    y: 10, // max 10px per rules
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32, // max 0.32s per rules
      ease: MOTION_EASING.decelerate,
    },
  },
  exit: {
    opacity: 0,
    y: -MOTION_TIMING.exitY,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 🔔 TOAST VARIANTS
// ============================================
// slide + fade (bereits korrekt)
// ⚠️ Glow nur auf Icon-Wrapper (success → --glow-success)

export const toastVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    x: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: {
      duration: MOTION_TIMING.entrance,
      ease: MOTION_EASING.decelerate,
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 🔘 BUTTON VARIANTS
// ============================================
// Hover: scale 1.02, Active: scale 0.98
// ✅ Glow erlaubt - nur Primary, nur Hover, nur Desktop

export const buttonVariants = {
  idle: { scale: 1 },
  hover: {
    scale: MOTION_TIMING.scaleHover,
    transition: {
      duration: MOTION_TIMING.fast,
      ease: MOTION_EASING.standard,
    },
  },
  tap: {
    scale: MOTION_TIMING.scaleActive,
    transition: {
      duration: 0.1,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 🏷️ CATEGORY PICKER VARIANTS
// ============================================
// Spring erlaubt

export const categoryPickerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      ...MOTION_EASING.spring,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: MOTION_TIMING.exit,
      ease: MOTION_EASING.accelerate,
    },
  },
};

// ============================================
// 📊 CHART CONTAINER VARIANTS
// ============================================
// Nur interne recharts Animation erlaubt
// ⚠️ Glow nur auf Container-Outline

export const chartContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: MOTION_TIMING.entrance,
      ease: MOTION_EASING.decelerate,
    },
  },
};

// ============================================
// ⚠️ ATTENTION VARIANTS (stark eingeschränkt)
// ============================================
// NUR bei: Formular-Validierung, fehlgeschlagener Aktion
// VERBOTEN: Dashboard, Admin, Transaktionen, Charts

export const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [-4, 4, -4, 4, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// 🚫 FINANCIAL COMPONENTS - NO ANIMATION
// ============================================
// Diese Varianten geben leere Objekte zurück
// für: SummaryCard, DashboardCharts, BudgetWidget,
// QuotaIndicator, TransactionList, TransactionForm,
// RecentTransactions, AdminStatCard, AdminTransactionTable

export const financialVariants = {
  hidden: {},
  visible: {},
  exit: {},
};

// ============================================
// 🎯 HELPER: Create disabled variants
// ============================================

/**
 * Returns empty variants for financial/data components
 * @param {boolean} shouldAnimate - From useMotion()
 * @returns {Object} Either actual variants or disabled
 */
export function getConditionalVariants(variants, shouldAnimate) {
  return shouldAnimate ? variants : financialVariants;
}

/**
 * Returns initial/animate props based on shouldAnimate
 * @param {boolean} shouldAnimate - From useMotion()
 * @param {string} initial - Initial state name
 * @param {string} animate - Animate state name
 */
export function getMotionProps(shouldAnimate, initial = 'hidden', animate = 'visible') {
  if (!shouldAnimate) {
    return {
      initial: false,
      animate: false,
    };
  }
  return {
    initial,
    animate,
  };
}

// ============================================
// 🏷️ LOGO VARIANTS (Entrance-Sequenz)
// ============================================
// 3-Phasen-Choreographie: F-Letterform → Growth-Line → Peak-Dot
// Gesamt: ~900ms — fließend, professionell, einmalig
// @see FINORA-LOGO-SPEC.md §7

/**
 * F-Letterform Entrance: subtle fade + lift
 * Phase A: 0ms → 400ms
 */
export const logoLetterVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: MOTION_EASING.decelerate,
    },
  },
};

/**
 * Growth-Line Draw: pathLength 0→1 with fade-in
 * Phase B: 200ms → 800ms (delayed start, overlaps Phase A)
 */
export const logoGrowthLineVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.6,
        delay: 0.2,
        ease: 'easeOut',
      },
      opacity: {
        duration: 0.15,
        delay: 0.2,
      },
    },
  },
};

/**
 * Peak-Dot: spring scale-in at end of Growth-Line
 * Phase C: 650ms → 900ms
 */
export const logoPeakDotVariants = {
  hidden: {
    scale: 0,
  },
  visible: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: MOTION_EASING.spring.stiffness,
      damping: MOTION_EASING.spring.damping,
      delay: 0.65,
    },
  },
};

/**
 * Logo Hover/Tap spring transition (System-Werte)
 * Used for `whileHover` / `whileTap` on the icon wrapper
 */
export const logoHoverTransition = {
  type: 'spring',
  stiffness: MOTION_EASING.spring.stiffness,
  damping: MOTION_EASING.spring.damping,
};

// ============================================
// 🏷️ LOGO FADE-ONLY VARIANTS (Simplified Entrance)
// ============================================
// For contexts where full choreography is too much (Admin, VerifyEmail)
// All elements fade in simultaneously — no draw/spring effects

/**
 * F-Letterform Fade: simple opacity fade
 * For entrance="fade" mode
 */
export const logoLetterFadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: MOTION_EASING.decelerate },
  },
};

/**
 * Growth-Line Fade: pathLength always 1, just fade opacity
 * For entrance="fade" mode
 */
export const logoGrowthLineFadeVariants = {
  hidden: { opacity: 0, pathLength: 1 },
  visible: {
    opacity: 1,
    pathLength: 1,
    transition: { duration: 0.3, ease: MOTION_EASING.decelerate },
  },
};

/**
 * Peak-Dot Fade: scale always 1, just fade opacity
 * For entrance="fade" mode
 */
export const logoPeakDotFadeVariants = {
  hidden: { opacity: 0, scale: 1 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: MOTION_EASING.decelerate },
  },
};

