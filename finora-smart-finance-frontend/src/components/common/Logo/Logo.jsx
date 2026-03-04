import { useId, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import {
  MOTION_TIMING,
  logoLetterVariants,
  logoGrowthLineVariants,
  logoPeakDotVariants,
  logoLetterFadeVariants,
  logoGrowthLineFadeVariants,
  logoPeakDotFadeVariants,
  logoHoverTransition,
} from '@/utils/motionPresets';
import styles from './Logo.module.scss';

/**
 * Finora Logo Component
 * Features: Animated abstract "F" mark with growth line, modern typography
 * All colors from CSS variables — consistent across the app
 *
 * Animations follow MOTION_GLOW_RULES:
 *  - Scale values: hover 1.02, tap 0.98  (§3)
 *  - Spring: stiffness 420, damping 34   (§2)
 *  - Glow on CSS-only container, never on motion element (§10)
 *  - useMotion() gates all animation    (§1)
 *
 * @param {string}  to                - Navigation path (default: '/dashboard')
 * @param {function} onClick          - Click handler
 * @param {boolean} showText          - Show brand name & tagline (default: true)
 * @param {string}  size              - 'small' | 'default' | 'large'
 * @param {boolean} disableNavigation - Static logo without link
 * @param {string}  className         - Forwarded to root element
 * @param {boolean} glow              - Enable static glow (via _glow.scss)
 * @param {boolean} animated          - Enable glow-pulse (requires glow + shouldAnimate)
 * @param {string}  entrance          - Entrance animation mode: 'full' | 'fade' | 'none'
 *                                      - 'full': 3-phase choreography (F → Line → Dot)
 *                                      - 'fade': simple opacity fade (all elements)
 *                                      - 'none': no entrance animation (instant visible)
 */
export default function Logo({
  to = '/dashboard',
  onClick,
  showText = true,
  size = 'default',
  disableNavigation = false,
  className,
  glow = false,
  animated = false,
  entrance = 'full',
}) {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const uid = useId();
  const [animationComplete, setAnimationComplete] = useState(false);

  // Reset will-change after entrance animation completes (§3.0.6 performance)
  const handleAnimationComplete = useCallback(() => {
    setAnimationComplete(true);
  }, []);

  const Component = disableNavigation ? 'div' : Link;

  // Select variants based on entrance mode
  const getVariants = () => {
    if (entrance === 'none' || !shouldAnimate) {
      return { letter: null, line: null, dot: null };
    }
    if (entrance === 'fade') {
      return {
        letter: logoLetterFadeVariants,
        line: logoGrowthLineFadeVariants,
        dot: logoPeakDotFadeVariants,
      };
    }
    // entrance === 'full' (default)
    return {
      letter: logoLetterVariants,
      line: logoGrowthLineVariants,
      dot: logoPeakDotVariants,
    };
  };

  const variants = getVariants();

  // Hover/Tap only on navigable logos and when animation allowed
  const hoverProps =
    disableNavigation || !shouldAnimate
      ? {}
      : {
          whileHover: { scale: MOTION_TIMING.scaleHover },
          whileTap: { scale: MOTION_TIMING.scaleActive },
        };

  // Entrance gate — skip when reduced-motion or entrance="none"
  const shouldPlayEntrance = shouldAnimate && entrance !== 'none';
  const entranceInitial = shouldPlayEntrance ? 'hidden' : false;
  const entranceAnimate = shouldPlayEntrance ? 'visible' : false;

  // Glow classes — applied on CSS-only wrapper (not on motion element)
  const glowClass = [
    glow ? 'glow-logo' : '',
    glow && animated && shouldAnimate ? 'glow-logo-animated' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Root class
  const rootClassName = [
    styles.logo,
    styles[size],
    disableNavigation ? styles.isStatic : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  // Unique gradient IDs to avoid collisions with multiple Logo instances
  const primaryGradientId = `logoPrimary-${uid}`;
  const accentGradientId = `logoAccent-${uid}`;
  const glowFilterId = `logoGlow-${uid}`;

  return (
    <Component
      {...(!disableNavigation ? { to } : { role: 'img' })}
      className={rootClassName}
      onClick={disableNavigation ? undefined : onClick}
      aria-label={t('common.appName')}
      tabIndex={disableNavigation ? -1 : 0}
      aria-disabled={disableNavigation || undefined}
    >
      {/* Glow wrapper — CSS-only, no framer-motion (MOTION_GLOW_RULES §10) */}
      <div className={`${styles.iconWrapper} ${glowClass}`}>
        <motion.div
          className={`${styles.iconMotion} ${animationComplete ? styles.animationDone : ''}`}
          {...hoverProps}
          transition={logoHoverTransition}
        >
          <motion.svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.icon}
            role="img"
            aria-hidden="true"
            initial={entranceInitial}
            animate={entranceAnimate}
          >
            <title>Finora Logo</title>
            <desc>Stilisiertes F mit aufsteigender Wachstumslinie</desc>

            <defs>
              {/* Primary gradient — CSS custom properties */}
              <linearGradient id={primaryGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={styles.gradientStopPrimary} />
                <stop offset="100%" className={styles.gradientStopSecondary} />
              </linearGradient>

              {/* Accent gradient — growth line */}
              <linearGradient id={accentGradientId} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" className={styles.gradientStopAccent1} />
                <stop offset="100%" className={styles.gradientStopAccent2} />
              </linearGradient>

              {/* SVG glow filter */}
              <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Abstract "F" letterform */}
            <motion.path
              d="M14 10h20c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v6h12c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v8c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2z"
              className={styles.letterPath}
              variants={variants.letter}
              onAnimationComplete={handleAnimationComplete}
            />

            {/* Growth trend line — financial growth */}
            <motion.path
              d="M24 38L30 30L36 33L42 22"
              className={styles.growthLine}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowFilterId})`}
              variants={variants.line}
            />

            {/* Peak dot — success indicator */}
            <motion.circle
              cx="42"
              cy="22"
              r="3.5"
              className={styles.peakDot}
              filter={`url(#${glowFilterId})`}
              variants={variants.dot}
            />
          </motion.svg>
        </motion.div>
      </div>

      {showText && (
        <div className={styles.textWrapper}>
          <span className={styles.brandName}>Finora</span>
          <span className={styles.tagline}>Smart Finance</span>
        </div>
      )}
    </Component>
  );
}
