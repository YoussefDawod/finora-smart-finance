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
 * BRANDING:
 * - Delegates all visual branding to <BrandingPanel> component
 * - No duplicate branding logic here
 * 
 * @module components/layout/AuthLayout
 */

import { motion } from 'framer-motion';
import { useMotion } from '@/hooks/useMotion';
import BrandingPanel from '@/components/auth/BrandingPanel/BrandingPanel';
import styles from './AuthLayout.module.scss';

/**
 * AuthLayout Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Auth form content
 * @param {'login'|'register'|'forgot'|'verify'} props.variant - Auth page variant
 */
export default function AuthLayout({ children, variant = 'login' }) {
  const { shouldAnimate } = useMotion();

  const isRegister = variant === 'register';
  const panelPosition = isRegister ? 'left' : 'right';

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

      {/* Mobile Branding */}
      <div className={`${styles.mobileBranding} ${isRegister ? styles.mobileTop : styles.mobileBottom}`}>
        <BrandingPanel mode={variant} isDesktop={false} />
      </div>
    </div>
  );
}

