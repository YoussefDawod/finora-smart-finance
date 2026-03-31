/**
 * @fileoverview AuthPage — Unified Auth Layout
 *
 * ARCHITECTURE:
 * - Desktop: 50/50 horizontal split with spring-animated panel slide
 * - Mobile:  30/70 vertical stack (branding 30% / form 70%) — P8-Fix
 * - BrandingPanel uses BrandingBackground internally (no own gradient)
 * - P9-Fix: removed data-auth-branding-bottom DOM mutation
 * - P2-Fix: spring stiffness:420, damping:34 (MOTION_GLOW_RULES compliant)
 *
 * DESKTOP PANEL BEHAVIOR:
 * - Login:    [Form left 0%] [Branding right 0%]
 * - Register: [Form x:100%] [Branding x:-100%]  (panel slide)
 * - Forgot:   [Form x:100%] [Branding x:-100%]  (panel slide)
 *
 * MOBILE BEHAVIOR:
 * - Login:    Branding 30% BOTTOM, Form 70% TOP
 * - Register: Branding 30% TOP, Form 70% BOTTOM (CSS order swap)
 *
 * @module pages/AuthPage
 */

import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, useMotion, useIsDesktop } from '@/hooks';
import {
  LoginForm,
  MultiStepRegisterForm,
  ForgotPasswordRequestForm,
  ResetPasswordForm,
  BrandingPanel,
} from '@/components/auth';
import { AuthPageSkeleton } from '@/components/common/Skeleton';
import styles from './AuthPage.module.scss';

const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 220,
  damping: 28,
};

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldAnimate } = useMotion();
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();

  const pathname = location.pathname;
  const isRegisterMode = pathname === '/register';
  const isForgotMode = pathname === '/forgot-password' || pathname.startsWith('/forgot-password');
  const resetToken = searchParams.get('token');

  const mode = isRegisterMode ? 'register' : isForgotMode ? 'forgot' : 'login';
  // Desktop: Register/Forgot → panels slide, Login → panels static
  const isPanelRight = isRegisterMode || isForgotMode;
  // Mobile: Register/Forgot → branding on top, Login → branding on bottom
  const isPanelTop = isRegisterMode || isForgotMode;

  // Auto-redirect if authenticated (except password reset with token)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !(isForgotMode && resetToken)) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, isForgotMode, resetToken]);

  // Loading state
  if (isLoading) {
    const skeletonVariant = isRegisterMode ? 'register' : isForgotMode ? 'forgot' : 'login';
    return <AuthPageSkeleton variant={skeletonVariant} showBranding />;
  }

  // ============================================
  // RENDER FORM CONTENT
  // ============================================
  const renderFormContent = () => {
    const getFormKey = () => {
      if (isRegisterMode) return 'register-form';
      if (isForgotMode) return resetToken ? 'reset-form' : 'forgot-form';
      return 'login-form';
    };

    const getTitle = () => {
      if (isRegisterMode) return t('auth.page.registerTitle');
      if (isForgotMode) return resetToken ? t('auth.resetTitle') : t('auth.forgotTitle');
      return t('auth.page.loginTitle');
    };

    const getSubtitle = () => {
      if (isRegisterMode) return t('auth.page.registerSubtitle');
      if (isForgotMode) return resetToken ? t('auth.resetSubtitle') : t('auth.forgotSubtitle');
      return t('auth.page.loginSubtitle');
    };

    const renderForm = () => {
      if (isRegisterMode) return <MultiStepRegisterForm />;
      if (isForgotMode)
        return resetToken ? (
          <ResetPasswordForm token={resetToken} />
        ) : (
          <ForgotPasswordRequestForm />
        );
      return <LoginForm />;
    };

    return (
      <div className={styles.formInner}>
        <AnimatePresence mode="wait">
          <motion.div
            key={getFormKey()}
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.formWrapper}
          >
            <header className={styles.header}>
              <h1 className={styles.title}>{getTitle()}</h1>
              <p className={styles.subtitle}>{getSubtitle()}</p>
            </header>
            {renderForm()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  // ============================================
  // DESKTOP LAYOUT (Horizontal 50/50)
  // ============================================
  if (isDesktop) {
    return (
      <div className={styles.authPage}>
        {/* Form Panel — slides right on register/forgot */}
        <motion.div
          className={styles.formPanel}
          initial={false}
          animate={{ x: isPanelRight ? '100%' : '0%' }}
          transition={SPRING_CONFIG}
        >
          {renderFormContent()}
        </motion.div>

        {/* Branding Panel — slides left on register/forgot */}
        <motion.div
          className={styles.brandingPanel}
          initial={false}
          animate={{ x: isPanelRight ? '-100%' : '0%' }}
          transition={SPRING_CONFIG}
        >
          <BrandingPanel mode={mode} isDesktop={isDesktop} />
        </motion.div>
      </div>
    );
  }

  // ============================================
  // MOBILE LAYOUT (Vertical 30/70)
  // ============================================
  return (
    <div className={`${styles.authPageMobile} ${isPanelTop ? styles.registerMode : ''}`}>
      <motion.div layout className={styles.formPanelMobile} transition={SPRING_CONFIG}>
        {renderFormContent()}
      </motion.div>

      <motion.div layout className={styles.brandingPanelMobile} transition={SPRING_CONFIG}>
        <BrandingPanel mode={mode} isDesktop={isDesktop} />
      </motion.div>
    </div>
  );
}
