/**
 * @fileoverview BrandingPanel Component
 * 
 * @description Animated branding panel for authentication pages
 * Built to harmonize mit Theme-Tokens (keine hart codierten Farben)
 * Fokus auf echte App-Features (Tracking, Charts, sichere Auth, Dark/Light)
 * 
 * @module components/auth/BrandingPanel
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/common';
import { useMotion } from '@/hooks';
import styles from './BrandingPanel.module.scss';

const HIGHLIGHTS = [
  {
    title: 'Transaktionen im Blick',
    desc: 'Einnahmen & Ausgaben in Sekunden erfassen.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 19h16" strokeLinecap="round" />
        <path d="M7 15V9" strokeLinecap="round" />
        <path d="M12 15V5" strokeLinecap="round" />
        <path d="M17 15v-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Charts & Trends',
    desc: 'Interaktive Analysen für Budget & Forecast.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14l4-5 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Sichere Anmeldung',
    desc: 'JWT-basiert, Sessions mit Refresh, geschützt.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M5 10V7a7 7 0 0 1 14 0v3" strokeLinecap="round" />
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M12 15v2" strokeLinecap="round" />
        <circle cx="12" cy="14" r="1" />
      </svg>
    ),
  },
  {
    title: 'Dark/Light Mode',
    desc: 'Optimiert für beide Themes und Geräte.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.5A6.5 6.5 0 0 1 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function BrandingPanel({ mode = 'login', isDesktop = true }) {
  const { shouldAnimate } = useMotion();

  const arrowSymbol = isDesktop
    ? (mode === 'login' ? '←' : '→')
    : (mode === 'login' ? '↑' : '↓');

  const floatingShapes = isDesktop
    ? [
        { size: 120, x: '10%', y: '18%', delay: 0, duration: 9 },
        { size: 90, x: '78%', y: '16%', delay: 0.6, duration: 10 },
        { size: 70, x: '24%', y: '72%', delay: 1, duration: 8 },
        { size: 110, x: '82%', y: '66%', delay: 0.3, duration: 11 },
        { size: 48, x: '58%', y: '42%', delay: 1.4, duration: 7 },
      ]
    : [
        { size: 70, x: '12%', y: '24%', delay: 0, duration: 9 },
        { size: 52, x: '78%', y: '32%', delay: 0.8, duration: 10 },
        { size: 38, x: '62%', y: '70%', delay: 1.2, duration: 8 },
      ];

  const content = {
    login: {
      kicker: 'Finora • Smart Finance',
      headline: 'Neu hier?',
      subline: 'Erstellen Sie Ihr kostenloses Konto und starten Sie noch heute.',
      ctaText: 'Jetzt registrieren',
      ctaPath: '/register',
    },
    register: {
      kicker: 'Finora • Smart Finance',
      headline: 'Willkommen zurück!',
      subline: 'Sie haben bereits ein Konto? Melden Sie sich an.',
      ctaText: 'Zur Anmeldung',
      ctaPath: '/login',
    },
  }[mode] || {
    kicker: 'Finora • Smart Finance',
    headline: 'Willkommen!',
    subline: 'Behalten Sie Ihre Finanzen im Blick – klar und sicher.',
    ctaText: 'Loslegen',
    ctaPath: '/login',
  };

  return (
    <div className={styles.panel}>
      <div className={styles.backdrop} />

      <div className={styles.shapesContainer} aria-hidden>
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

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <Logo to="/" showText size={isDesktop ? 'large' : 'default'} />
          <span className={styles.badge}>Budget • Insights • Vertrauen</span>
        </div>

        <div className={styles.copy}>
          <p className={styles.kicker}>{content.kicker}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className={styles.headline}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2>{content.headline}</h2>
              <p>{content.subline}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.actions}>
          <Link to={content.ctaPath} className={styles.ctaButton}>
            <span>{content.ctaText}</span>
            <span aria-hidden className={styles.arrow}>{arrowSymbol}</span>
          </Link>
        </div>

        <div className={styles.highlights}>
          {HIGHLIGHTS.map(({ title, desc, icon }) => (
            <div key={title} className={styles.highlightItem}>
              <span className={styles.highlightIcon}>{icon}</span>
              <div>
                <p className={styles.highlightTitle}>{title}</p>
                <p className={styles.highlightDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.brandingFooter}>
          <p>© 2026 Finora. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </div>
  );
}
