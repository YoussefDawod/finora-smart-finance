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
import Skeleton from '@/components/common/Skeleton/Skeleton';
import { useAuth, useMotion } from '@/hooks';
import { AuthLayout } from '@/components/layout';
import { VerifyEmailForm } from '@/components/auth';
import Logo from '@/components/common/Logo/Logo';
import { FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './VerifyEmailPage.module.scss';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldAnimate } = useMotion();
  const { t } = useTranslation();
  
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
  // LOADING STATE - Skeleton statt White Screen
  // ============================================

  if (isLoading) {
    return (
      <div className={styles.verifyEmailPage} aria-busy="true" aria-label={t('common.loadingContent')}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-xl)' }}>
          <Skeleton width="120px" height="40px" borderRadius="var(--r-lg)" />
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Skeleton width="200px" height="28px" borderRadius="var(--r-md)" />
            <Skeleton width="280px" height="18px" borderRadius="var(--r-sm)" />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} width="48px" height="56px" borderRadius="var(--r-md)" />
            ))}
          </div>
          <Skeleton width="140px" height="16px" borderRadius="var(--r-sm)" />
        </div>
      </div>
    );
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
          <h1 className={styles.title}>{t('auth.verifyEmailTitle')}</h1>
          <p className={styles.subtitle}>
            {email 
              ? <>{t('auth.verifyEmailSent', { email })}</>
              : t('auth.verifyEmailSubtitle')}
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
          <span>{t('common.or')}</span>
        </motion.div>

        {/* Login Link */}
        <motion.div 
          className={styles.footer}
          variants={shouldAnimate ? itemVariants : {}}
        >
          <Link to="/login" className={styles.loginLink}>
            <FiArrowLeft className={styles.linkIcon} />
            {t('common.backToLogin')}
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
