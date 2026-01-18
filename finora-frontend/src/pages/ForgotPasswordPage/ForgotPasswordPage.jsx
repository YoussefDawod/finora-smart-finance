/**
 * @fileoverview ForgotPasswordPage Component - Premium Redesign
 * @description Modern password reset page with split-screen layout
 * 
 * FEATURES:
 * - Email input to request reset link
 * - New password form (when token present)
 * - Link back to login
 * - Responsive design
 * 
 * @module pages/ForgotPasswordPage
 */

import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, useMotion } from '@/hooks';
import { AuthLayout } from '@/components/layout';
import { ForgotPasswordRequestForm, ResetPasswordForm } from '@/components/auth';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './ForgotPasswordPage.module.scss';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldAnimate } = useMotion();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

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
    <AuthLayout variant="forgot">
      <motion.div 
        className={styles.forgotPasswordPage}
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
          <h1 className={styles.title}>
            {token ? 'Neues Passwort' : 'Passwort vergessen?'}
          </h1>
          <p className={styles.subtitle}>
            {token
              ? 'Geben Sie Ihr neues sicheres Passwort ein.'
              : 'Kein Problem! Wir senden Ihnen einen Link.'}
          </p>
        </motion.header>

        {/* Form */}
        <motion.div variants={shouldAnimate ? itemVariants : {}}>
          {token ? <ResetPasswordForm token={token} /> : <ForgotPasswordRequestForm />}
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
