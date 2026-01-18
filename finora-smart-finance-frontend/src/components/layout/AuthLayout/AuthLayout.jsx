/**
 * @fileoverview AuthLayout Component - Premium Sliding Panel Design
 * @description Modern split-screen authentication layout with sliding branding panel
 * 
 * DESIGN:
 * - Side-by-side layout with Login (left) and Register (right) forms
 * - Animated sliding branding panel that covers the inactive side
 * - Login: Form left, Branding right
 * - Register: Branding left, Form right
 * - Smooth 600-800ms transition animation
 * - Mobile: Vertical stack with branding on top/bottom
 * 
 * @module components/layout/AuthLayout
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMotion } from '@/context/MotionContext';
import { Logo } from '@/components/common';
import styles from './AuthLayout.module.scss';

/**
 * AuthLayout Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Auth form content
 * @param {string} props.variant - 'login' | 'register' | 'forgot' | 'verify'
 */
export default function AuthLayout({ children, variant = 'login' }) {
  const { shouldAnimate } = useMotion();

  // Determine panel position based on variant
  const isRegister = variant === 'register';
  const panelPosition = isRegister ? 'left' : 'right';

  // ============================================
  // FLOATING SHAPES ANIMATION
  // ============================================
  const floatingShapes = [
    { size: 120, x: '15%', y: '20%', delay: 0, duration: 8 },
    { size: 80, x: '75%', y: '15%', delay: 1, duration: 10 },
    { size: 60, x: '25%', y: '70%', delay: 2, duration: 7 },
    { size: 100, x: '80%', y: '65%', delay: 0.5, duration: 9 },
    { size: 40, x: '60%', y: '40%', delay: 1.5, duration: 6 },
  ];

  // ============================================
  // BRAND CONTENT BY VARIANT
  // ============================================
  const brandContent = {
    login: {
      headline: 'Neu hier?',
      subline: 'Erstellen Sie Ihr kostenloses Konto und starten Sie noch heute mit der Kontrolle Ihrer Finanzen.',
      ctaText: 'Jetzt registrieren',
      ctaLink: '/register',
    },
    register: {
      headline: 'Willkommen zurück!',
      subline: 'Sie haben bereits ein Konto? Melden Sie sich an und verwalten Sie Ihre Finanzen weiter.',
      ctaText: 'Zur Anmeldung',
      ctaLink: '/login',
    },
    forgot: {
      headline: 'Kein Problem',
      subline: 'Wir helfen Ihnen, wieder Zugang zu Ihrem Konto zu erhalten.',
      ctaText: 'Zur Anmeldung',
      ctaLink: '/login',
    },
    verify: {
      headline: 'Fast geschafft',
      subline: 'Bestätigen Sie Ihre E-Mail-Adresse, um loszulegen.',
      ctaText: 'Zur Anmeldung',
      ctaLink: '/login',
    },
  };

  const content = brandContent[variant] || brandContent.login;

  // ============================================
  // ANIMATION VARIANTS
  // ============================================
  const panelVariants = {
    left: {
      x: '0%',
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 20,
        duration: 0.7,
      },
    },
    right: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 20,
        duration: 0.7,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, delay: 0.2 },
    },
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.authLayout}>
      {/* Form Container - Always centered in the visible half */}
      <div className={`${styles.formPanel} ${isRegister ? styles.formRight : styles.formLeft}`}>
        <motion.div 
          className={styles.formContainer}
          initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {children}
        </motion.div>
      </div>

      {/* Sliding Branding Panel */}
      <motion.div 
        className={styles.brandingPanel}
        variants={shouldAnimate ? panelVariants : {}}
        initial={panelPosition}
        animate={panelPosition}
        key={panelPosition}
      >
        {/* Animated Background Shapes */}
        <div className={styles.shapesContainer}>
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
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
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

        {/* Branding Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            className={styles.brandingContent}
            key={variant}
            variants={shouldAnimate ? contentVariants : {}}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Logo to="/" showText={true} />

            <div className={styles.headline}>
              <h2>{content.headline}</h2>
              <p>{content.subline}</p>
            </div>

            {/* CTA Button */}
            <Link to={content.ctaLink} className={styles.ctaButton}>
              {content.ctaText}
            </Link>

            {/* Feature Pills */}
            <div className={styles.features}>
              <div className={styles.featurePill}>
                <span className={styles.featureIcon}>📊</span>
                <span>Echtzeit-Analysen</span>
              </div>
              <div className={styles.featurePill}>
                <span className={styles.featureIcon}>🔒</span>
                <span>Sicher & Privat</span>
              </div>
              <div className={styles.featurePill}>
                <span className={styles.featureIcon}>⚡</span>
                <span>Blitzschnell</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className={styles.brandingFooter}>
          <p>© 2026 Finora. Alle Rechte vorbehalten.</p>
        </div>
      </motion.div>

      {/* Mobile Branding (shown only on mobile) */}
      <div className={`${styles.mobileBranding} ${isRegister ? styles.mobileTop : styles.mobileBottom}`}>
        <div className={styles.mobileContent}>
          <h3>{content.headline}</h3>
          <p>{content.subline}</p>
          <Link to={content.ctaLink} className={styles.mobileCta}>
            {content.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}
