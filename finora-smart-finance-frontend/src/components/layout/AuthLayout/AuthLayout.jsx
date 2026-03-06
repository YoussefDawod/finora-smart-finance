/**
 * @fileoverview AuthLayout — Auth wrapper for VerifyEmailPage & similar standalone pages
 *
 * DESIGN:
 * - Desktop: 50/50 sliding panel (BrandingPanel left, Form right)
 * - Mobile: 30% branding strip + 70% form content
 * - BrandingPanel uses BrandingBackground internally
 * - P2-Fix: spring stiffness:420, damping:34 (MOTION_GLOW_RULES compliant)
 *
 * @module components/layout/AuthLayout
 */

import { motion } from 'framer-motion';
import { useMotion } from '@/hooks';
import BrandingPanel from '@/components/auth/BrandingPanel/BrandingPanel';
import styles from './AuthLayout.module.scss';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Auth page content
 * @param {'login'|'register'|'forgot'|'verify'} [props.variant]
 */
export default function AuthLayout({ children, variant = 'login' }) {
  const { shouldAnimate } = useMotion();

  const isRegister = variant === 'register';
  const panelPosition = isRegister ? 'left' : 'right';

  // Smooth page-transition spring
  const springTransition = { type: 'spring', stiffness: 220, damping: 28 };

  const panelVariants = {
    left:  { x: '0%',   transition: springTransition },
    right: { x: '100%', transition: springTransition },
  };

  return (
    <div className={styles.authLayout}>
      {/* Form Container */}
      <div className={`${styles.formPanel} ${isRegister ? styles.formRight : styles.formLeft}`}>
        <motion.div
          className={styles.formContainer}
          initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </div>

      {/* Sliding Branding Panel (desktop) */}
      <motion.div
        className={styles.brandingPanel}
        variants={shouldAnimate ? panelVariants : {}}
        initial={panelPosition}
        animate={panelPosition}
        key={panelPosition}
      >
        <BrandingPanel mode={variant} isDesktop />
      </motion.div>

      {/* Mobile Branding — 30% strip */}
      <div className={`${styles.mobileBranding} ${isRegister ? styles.mobileTop : styles.mobileBottom}`}>
        <BrandingPanel mode={variant} isDesktop={false} />
      </div>
    </div>
  );
}

