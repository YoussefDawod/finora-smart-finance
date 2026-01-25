/**
 * @fileoverview BrandingPanel Component
 * 
 * @description Animated branding panel for authentication pages
 * Built to harmonize mit Theme-Tokens (keine hart codierten Farben)
 * Fokus auf echte App-Features (Tracking, Charts, sichere Auth, Dark/Light)
 * 
 * RESPONSIVE BEHAVIOR:
 * - Desktop (≥1024px): Full panel with all highlights, stats optional
 * - Tablet (768-1023px): 2-column highlights, condensed spacing
 * - Mobile (<768px): Compact essential info, 2x2 highlight grid
 * 
 * @module components/auth/BrandingPanel
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/common';
import { useMotion } from '@/hooks';
import styles from './BrandingPanel.module.scss';

const HIGHLIGHT_KEYS = [
  {
    titleKey: 'auth.branding.highlights.track.title',
    descKey: 'auth.branding.highlights.track.desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 19h16" strokeLinecap="round" />
        <path d="M7 15V9" strokeLinecap="round" />
        <path d="M12 15V5" strokeLinecap="round" />
        <path d="M17 15v-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titleKey: 'auth.branding.highlights.charts.title',
    descKey: 'auth.branding.highlights.charts.desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14l4-5 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    titleKey: 'auth.branding.highlights.secure.title',
    descKey: 'auth.branding.highlights.secure.desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 10V7a7 7 0 0 1 14 0v3" strokeLinecap="round" />
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M12 15v2" strokeLinecap="round" />
        <circle cx="12" cy="14" r="1" />
      </svg>
    ),
  },
  {
    titleKey: 'auth.branding.highlights.theme.title',
    descKey: 'auth.branding.highlights.theme.desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.5A6.5 6.5 0 0 1 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// Responsive floating shapes configuration
const getFloatingShapes = (isDesktop) => {
  if (isDesktop) {
    return [
      { size: 120, x: '10%', y: '18%', delay: 0, duration: 9 },
      { size: 90, x: '78%', y: '16%', delay: 0.6, duration: 10 },
      { size: 70, x: '24%', y: '72%', delay: 1, duration: 8 },
      { size: 110, x: '82%', y: '66%', delay: 0.3, duration: 11 },
      { size: 48, x: '58%', y: '42%', delay: 1.4, duration: 7 },
    ];
  }
  // Mobile/Tablet: Fewer, smaller shapes
  return [
    { size: 60, x: '12%', y: '20%', delay: 0, duration: 9 },
    { size: 45, x: '80%', y: '30%', delay: 0.8, duration: 10 },
    { size: 35, x: '65%', y: '75%', delay: 1.2, duration: 8 },
  ];
};

// Content based on mode (login/register)
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
  };
  
  return contentMap[mode] || {
    kickerKey: 'auth.branding.kicker',
    headlineKey: 'auth.branding.default.headline',
    sublineKey: 'auth.branding.default.subline',
    ctaTextKey: 'auth.branding.default.cta',
    ctaPath: '/login',
  };
};

export default function BrandingPanel({ mode = 'login', isDesktop = true }) {
  const { shouldAnimate } = useMotion();
  const { t, i18n } = useTranslation();
  const content = getContent(mode);
  const floatingShapes = getFloatingShapes(isDesktop);
  const isRtl = i18n.dir() === 'rtl';

  // Arrow direction based on layout and mode
  const arrowSymbol = isDesktop
    ? (mode === 'login' ? (isRtl ? '→' : '←') : (isRtl ? '←' : '→'))
    : (mode === 'login' ? (isRtl ? '↓' : '↑') : (isRtl ? '↑' : '↓'));

  return (
    <div className={styles.panel}>
      {/* Gradient Background */}
      <div className={styles.backdrop} />

      {/* Decorative Floating Shapes */}
      <div className={styles.shapesContainer} aria-hidden="true">
        {floatingShapes.map((shape, index) => (
          <motion.div
            key={index}
            className={styles.floatingShape}
            style={{
              width: shape.size,
              height: shape.size,
              left: shape.x,
              top: shape.y,
            }}
            animate={shouldAnimate ? {
              y: [0, -12, 0],
              rotate: [0, 4, -3, 0],
              scale: [1, 1.02, 1],
            } : {}}
            transition={{
              duration: shape.duration,
              delay: shape.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Header: Logo + Badge */}
        <div className={styles.headerRow}>
          <Logo
            to="/"
            showText
            size={isDesktop ? 'large' : 'default'}
            disableNavigation
          />
          <span className={styles.badge}>{t('auth.branding.badge')}</span>
        </div>

        {/* Copy: Headline + Subline */}
        <div className={styles.copy}>
          <p className={styles.kicker}>{t(content.kickerKey)}</p>
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
            <span aria-hidden="true" className={styles.arrow}>{arrowSymbol}</span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className={styles.highlights}>
          {HIGHLIGHT_KEYS.map(({ titleKey, descKey, icon }) => (
            <div key={titleKey} className={styles.highlightItem}>
              <span className={styles.highlightIcon}>{icon}</span>
              <div className={styles.highlightContent}>
                <p className={styles.highlightTitle}>{t(titleKey)}</p>
                <p className={styles.highlightDesc}>{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.brandingFooter}>
          <p>{t('auth.branding.footer')}</p>
        </div>
      </div>
    </div>
  );
}
