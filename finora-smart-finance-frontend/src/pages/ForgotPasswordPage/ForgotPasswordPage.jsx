/**
 * @fileoverview ForgotPasswordPage Component - Premium Design
 * @description Password reset page matching AuthPage design pattern
 * 
 * ARCHITECTURE:
 * - Uses useIsDesktop hook for responsive layouts
 * - Includes BrandingPanel for consistent design
 * 
 * DESKTOP (Horizontal 50/50):
 * - [Form 50%] [Branding 50%]
 * 
 * MOBILE (Vertical 60/40):
 * - [Form 60%] / [Branding 40%]
 * 
 * @module pages/ForgotPasswordPage
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, useMotion, useIsDesktop } from '@/hooks';
import { ForgotPasswordRequestForm, ResetPasswordForm, BrandingPanel } from '@/components/auth';
import styles from './ForgotPasswordPage.module.scss';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldAnimate } = useMotion();
  const isDesktop = useIsDesktop();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useTranslation();

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
  // RENDER FORM CONTENT
  // ============================================
  const renderFormContent = () => (
    <div className={styles.formInner}>
      <motion.div
        key={token ? 'reset-form' : 'forgot-form'}
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={styles.formWrapper}
      >
        <header className={styles.header}>
          <h1 className={styles.title}>
            {token ? t('auth.resetTitle') : t('auth.forgotTitle')}
          </h1>
          <p className={styles.subtitle}>
            {token ? t('auth.resetSubtitle') : t('auth.forgotSubtitle')}
          </p>
        </header>
        {token ? <ResetPasswordForm token={token} /> : <ForgotPasswordRequestForm />}
      </motion.div>
    </div>
  );

  // ============================================
  // DESKTOP LAYOUT (Horizontal 50/50)
  // ============================================
  if (isDesktop) {
    return (
      <div className={styles.authPage}>
        {/* Form Panel */}
        <div className={styles.formPanel}>
          {renderFormContent()}
        </div>

        {/* Branding Panel */}
        <div className={styles.brandingPanel}>
          <BrandingPanel mode="forgot" isDesktop={isDesktop} />
        </div>
      </div>
    );
  }

  // ============================================
  // MOBILE LAYOUT (Vertical 60/40)
  // ============================================
  return (
    <div className={styles.authPageMobile}>
      <div className={styles.formPanelMobile}>
        {renderFormContent()}
      </div>

      <div className={styles.brandingPanelMobile}>
        <BrandingPanel mode="forgot" isDesktop={isDesktop} />
      </div>
    </div>
  );
}
