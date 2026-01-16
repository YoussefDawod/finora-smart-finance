/**
 * @fileoverview AuthLayout Component
 * @description Layout wrapper for authentication pages (Login, Register, Password Reset).
 * 
 * STRUCTURE:
 * - Centered container with gradient background
 * - Glassmorphic card with max-width 500px
 * - Full viewport height (min 100vh)
 * - No Header/Sidebar (standalone auth pages)
 * 
 * FEATURES:
 * - Centered form layout
 * - Theme-aware gradient background
 * - Glassmorphic card design
 * - Responsive: desktop (40px padding) / mobile (20px padding, full-width)
 * - Smooth animations and transitions
 * - Accessibility: proper semantic HTML
 * 
 * USAGE:
 * ```jsx
 * <AuthLayout>
 *   <LoginForm />
 * </AuthLayout>
 * ```
 * 
 * @module components/layout/AuthLayout
 */

import { motion } from 'framer-motion';
import { useMotion } from '@/context/MotionContext';
import styles from './AuthLayout.module.scss';

/**
 * AuthLayout Component
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Auth form content (LoginForm, RegisterForm, etc.)
 * @returns {React.ReactElement}
 */
export default function AuthLayout({ children }) {
  const { shouldAnimate } = useMotion();

  // ============================================
  // ANIMATION VARIANTS
  // ============================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        delay: 0.1,
      },
    },
  };

  // ============================================
  // RENDER
  // ============================================

  const Container = shouldAnimate ? motion.div : 'div';
  const Card = shouldAnimate ? motion.div : 'div';

  return (
    <Container
      className={styles.authLayout}
      {...(shouldAnimate && {
        variants: containerVariants,
        initial: 'hidden',
        animate: 'visible',
      })}
    >
      <div className={styles.authContainer}>
        <Card
          className={styles.authCard}
          {...(shouldAnimate && {
            variants: cardVariants,
            initial: 'hidden',
            animate: 'visible',
          })}
        >
          {children}
        </Card>
      </div>
    </Container>
  );
}
