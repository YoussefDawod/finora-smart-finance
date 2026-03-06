/**
 * @fileoverview BrandingPanel Component
 * 
 * @description Animated branding panel for authentication pages
 * Built to harmonize mit Theme-Tokens (keine hart codierten Farben)
 * Fokus auf echte App-Features (Tracking, Charts, sichere Auth, Dark/Light)
 * 
 * MODES & BUTTONS:
 * - Login Mode:    Headline "New here?" + Button "Sign up now" → /register
 * - Register Mode: Headline "Welcome back!" + Button "Go to sign in" → /login
 * - Forgot Mode:   Headline "Forgot password?" + Button "Back to sign in" → /login
 * 
 * RESPONSIVE BEHAVIOR:
 * - Desktop (≥1024px): Full panel with all highlights, stats optional
 * - Tablet (768-1023px): 2-column highlights, condensed spacing
 * - Mobile (<768px): Compact essential info, 2x2 highlight grid
 * 
 * ANIMATION CONSISTENCY:
 * - All modes: Identical floating shapes animation (7-11s loop)
 * - All modes: Identical content fade transition (200ms, AnimatePresence)
 * 
 * ARROW DIRECTION (semantisch korrekt):
 * - Desktop Login:    ← (zeigt nach links, zum statischen Panel)
 * - Desktop Register: → (zeigt nach rechts, zum Form Panel)
 * - Desktop Forgot:   → (zeigt nach rechts, zum Form Panel, wie Register)
 * - Mobile Login:     ↑ (zeigt nach oben, zum Branding)
 * - Mobile Register:  ↓ (zeigt nach unten, zum Form)
 * - Mobile Forgot:    ↓ (zeigt nach unten, zum Form, wie Register)
 * 
 * @module components/auth/BrandingPanel
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandingBackground } from '@/components/common';
import { useMotion } from '@/hooks';
import styles from './BrandingPanel.module.scss';

// Content based on mode (login/register/forgot)
const getContent = (mode) => {
  const contentMap = {
    login: {
      kickerKey: 'auth.branding.kicker',
      headlineKey: 'auth.branding.login.headline',
      sublineKey: 'auth.branding.login.subline',
      ctaTextKey: 'auth.branding.login.cta',
      ctaPath: '/register',
    },
    register: {
      kickerKey: 'auth.branding.kicker',
      headlineKey: 'auth.branding.register.headline',
      sublineKey: 'auth.branding.register.subline',
      ctaTextKey: 'auth.branding.register.cta',
      ctaPath: '/login',
    },
    forgot: {
      kickerKey: 'auth.branding.kicker',
      headlineKey: 'auth.branding.forgot.headline',
      sublineKey: 'auth.branding.forgot.subline',
      ctaTextKey: 'auth.branding.forgot.cta',
      ctaPath: '/login',
    },
  };
  
  return contentMap[mode] || {
    kickerKey: 'auth.branding.kicker',
    headlineKey: 'auth.branding.default.headline',
    sublineKey: 'auth.branding.default.subline',
    ctaTextKey: 'auth.branding.default.cta',
    ctaPath: '/login',
  };
};

// ============================================
// ARROW ICON
// ============================================
const ARROW_PATHS = {
  left:  'M19 12H5M12 5l-7 7 7 7',
  right: 'M5 12h14M12 5l7 7-7 7',
  up:    'M12 19V5M5 12l7-7 7 7',
  down:  'M12 5v14M5 12l7 7 7-7',
};

const ArrowIcon = ({ direction }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={ARROW_PATHS[direction]} />
  </svg>
);

export default function BrandingPanel({ mode = 'login', isDesktop = true }) {
  const { shouldAnimate } = useMotion();
  const { t, i18n } = useTranslation();
  const content = getContent(mode);
  const isRtl = i18n.dir() === 'rtl';

  // Arrow direction based on layout and mode
  // Desktop: Login points left (←), Register/Forgot point right (→)
  // Mobile: Login points up (↑), Register/Forgot point down (↓)
  const isLoginMode = mode === 'login';
  
  const arrowDir = isDesktop
    ? (isLoginMode ? (isRtl ? 'right' : 'left') : (isRtl ? 'left' : 'right'))
    : (isLoginMode ? (isRtl ? 'down' : 'up') : (isRtl ? 'up' : 'down'));

  return (
    <div className={styles.panel}>
      {/* BrandingBackground — gradient + animated shapes, no blur */}
      <BrandingBackground compact={!isDesktop} />

      {/* Main Content */}
      <div className={styles.content}>
        {/* Header: Logo + Badge */}
        <div className={styles.headerRow}>
          <img
            src="/logo-branding/finora-logo.svg"
            alt="Finora"
            className="app-logo app-logo--lg"
          />
          <span className={styles.badge}>{t('auth.branding.badge')}</span>
        </div>

        {/* Tagline */}
        <p className={styles.tagline}>Intelligente Finanzverwaltung für dein smartes Leben</p>

        {/* Copy: Headline + Subline */}
        <div className={styles.copy}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className={styles.headline}
              initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
              transition={{ duration: 0.2 }}
            >
              <h2>{t(content.headlineKey)}</h2>
              <p>{t(content.sublineKey)}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <div className={styles.actions}>
          <Link to={content.ctaPath} className={styles.ctaButton}>
            <span>{t(content.ctaTextKey)}</span>
            <span className={styles.arrow} aria-hidden="true"><ArrowIcon direction={arrowDir} /></span>
          </Link>
        </div>

      </div>

      {/* Footer — pinned to bottom of panel */}
      <div className={styles.brandingFooter}>
        <p>{t('auth.branding.footer')}</p>
      </div>
    </div>
  );
}
