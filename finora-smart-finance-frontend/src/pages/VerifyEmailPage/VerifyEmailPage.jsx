/**
 * @fileoverview VerifyEmailPage Component - Premium Redesign
 * @description Modern email verification page with 6-digit code input
 * 
 * FEATURES:
 * - 6-digit code verification
 * - Auto-submit when complete
 * - Resend code option
 * - Animated transitions
 * 
 * @module pages/VerifyEmailPage
 */

import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, useMotion } from '@/hooks';
import { AuthLayout } from '@/components/layout';
import { VerifyEmailForm } from '@/components/auth';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './VerifyEmailPage.module.scss';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldAnimate } = useMotion();
  
  // Get email from navigation state (passed from registration)
  const email = location.state?.email || '';

  // ============================================
  // AUTO-REDIRECT IF AUTHENTICATED
  // ============================================

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return null;
  }

  // ============================================
  // ANIMATION VARIANTS
  // ============================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <AuthLayout variant="verify">
      <motion.div 
        className={styles.verifyEmailPage}
        variants={shouldAnimate ? containerVariants : {}}
        initial="hidden"
        animate="visible"
      >
        {/* Mobile Logo */}
        <motion.div 
          className={styles.mobileLogo}
          variants={shouldAnimate ? itemVariants : {}}
        >
          <Logo to="/" size="default" showText={true} />
        </motion.div>

        {/* Header */}
        <motion.header 
          className={styles.header}
          variants={shouldAnimate ? itemVariants : {}}
        >
          <h1 className={styles.title}>E-Mail bestätigen</h1>
          <p className={styles.subtitle}>
            {email 
              ? <>Wir haben einen Code an <strong>{email}</strong> gesendet.</>
              : 'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.'}
          </p>
        </motion.header>

        {/* Verify Form */}
        <motion.div variants={shouldAnimate ? itemVariants : {}}>
          <VerifyEmailForm email={email} />
        </motion.div>

        {/* Divider */}
        <motion.div 
          className={styles.divider}
          variants={shouldAnimate ? itemVariants : {}}
        >
          <span>oder</span>
        </motion.div>

        {/* Login Link */}
        <motion.div 
          className={styles.footer}
          variants={shouldAnimate ? itemVariants : {}}
        >
          <Link to="/login" className={styles.loginLink}>
            <FiArrowLeft className={styles.linkIcon} />
            Zurück zur Anmeldung
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
