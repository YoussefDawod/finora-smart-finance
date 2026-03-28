/**
 * @fileoverview BrandingBackground Component
 *
 * @description Wiederverwendbarer, rein visueller Branding-Hintergrund.
 * Enthält Gradient-Backdrop + animierte Floating Circles.
 * Kein Text, kein Logo, keine interaktiven Elemente.
 *
 * VERWENDUNG:
 * - Auth-Seiten: Full-Screen-Hintergrund hinter dem Glassmorphism-Card
 * - VerifyEmailPage: identisch zu Auth-Seiten
 *
 * PROPS:
 * - withBlur: boolean — fügt eine Blur-Overlay-Schicht hinzu (für Logo-Lesbarkeit
 *   wenn ein Logo direkt auf dem Hintergrund platziert wird, z.B. Header-Komponenten)
 * - compact: boolean — weniger & kleinere Shapes (für schmale Viewports / Mobile)
 *
 * REGELN:
 * - Nur y (±12px) + rotate in der Animation — KEIN scale-Loop (MOTION_GLOW_RULES)
 * - Keine Hex-Werte — ausschließlich CSS-Custom-Properties (COLOR_USAGE_RULES)
 * - useMotion() / shouldAnimate respektiert prefers-reduced-motion (MOTION_GLOW_RULES)
 * - aria-hidden="true" — rein dekorativ
 *
 * @module components/common/BrandingBackground
 */

import { motion } from 'framer-motion';
import { useMotion } from '@/hooks/useMotion';
import styles from './BrandingBackground.module.scss';

// ============================================
// FLOATING SHAPES CONFIG
// ============================================

/** Vollständige Shape-Konfiguration — Desktop / große Viewports */
const SHAPES_FULL = [
  { size: 120, x: '10%', y: '18%', delay: 0, duration: 9 },
  { size: 90, x: '78%', y: '16%', delay: 0.6, duration: 10 },
  { size: 70, x: '24%', y: '72%', delay: 1.0, duration: 8 },
  { size: 110, x: '82%', y: '66%', delay: 0.3, duration: 11 },
  { size: 48, x: '58%', y: '42%', delay: 1.4, duration: 7 },
];

/** Kompakte Shape-Konfiguration — Mobile / schmale Viewports */
const SHAPES_COMPACT = [
  { size: 60, x: '12%', y: '20%', delay: 0, duration: 9 },
  { size: 45, x: '80%', y: '30%', delay: 0.8, duration: 10 },
  { size: 35, x: '65%', y: '75%', delay: 1.2, duration: 8 },
];

// ============================================
// ANIMATION CONFIG (MOTION_GLOW_RULES-konform)
// ============================================

/** Nur y (max ±12px) + rotate — kein scale-Loop (MOTION_GLOW_RULES §3) */
const shapeAnimate = {
  y: [0, -12, 0],
  rotate: [0, 4, -3, 0],
};

/**
 * BrandingBackground
 *
 * @param {object}  props
 * @param {boolean} [props.withBlur=false] — Blur-Overlay für Logo-Lesbarkeit
 * @param {boolean} [props.compact=false]  — Kompakte Shape-Konfiguration
 */
export default function BrandingBackground({ withBlur = false, compact = false }) {
  const { shouldAnimate } = useMotion();
  const shapes = compact ? SHAPES_COMPACT : SHAPES_FULL;

  return (
    <div className={styles.background} aria-hidden="true">
      {/* Gradient Backdrop */}
      <div className={styles.backdrop} />

      {/* Decorative Floating Circles */}
      <div className={styles.shapesContainer}>
        {shapes.map((shape, index) => (
          <motion.div
            key={index}
            className={styles.shape}
            style={{
              width: shape.size,
              height: shape.size,
              left: shape.x,
              top: shape.y,
            }}
            animate={shouldAnimate ? shapeAnimate : {}}
            transition={
              shouldAnimate
                ? {
                    duration: shape.duration,
                    delay: shape.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {}
            }
          />
        ))}
      </div>

      {/* Optional Blur Overlay — für Logo-Lesbarkeit wenn direkt auf Background platziert */}
      {withBlur && <div className={styles.blurOverlay} />}
    </div>
  );
}
