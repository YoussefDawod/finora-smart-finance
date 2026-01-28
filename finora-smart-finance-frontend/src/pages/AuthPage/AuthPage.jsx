/**
 * @fileoverview AuthPage Component - Unified Auth Layout
 * 
 * ARCHITECTURE:
 * - Uses useIsDesktop hook to render ONLY ONE layout (no duplicate IDs)
 * - Supports Login, Register, and ForgotPassword modes
 * 
 * DESKTOP (Horizontal 50/50):
 * - Login mode:    [Form 50%] [Branding 50%]
 * - Register mode: [Branding 50%] [Form 50%]
 * - Forgot mode:   [Form 50%] [Branding 50%] (same as login)
 * 
 * MOBILE (Vertical 60/40):
 * - Login mode:    [Form 60%] / [Branding 40%]
 * - Register mode: [Branding 40%] / [Form 60%]
 * - Forgot mode:   [Form 60%] / [Branding 40%] (same as login)
 * 
 * @module pages/AuthPage
 */

import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, useMotion, useIsDesktop } from '@/hooks';
import { LoginForm, MultiStepRegisterForm, ForgotPasswordRequestForm, ResetPasswordForm, BrandingPanel } from '@/components/auth';
import styles from './AuthPage.module.scss';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldAnimate } = useMotion();
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();

  // Determine current mode from URL
  const pathname = location.pathname;
  const isRegisterMode = pathname === '/register';
  const isForgotMode = pathname === '/forgot-password' || pathname.startsWith('/forgot-password');
  const resetToken = searchParams.get('token');
  
  // Mode für BrandingPanel
  const mode = isRegisterMode ? 'register' : isForgotMode ? 'forgot' : 'login';
  
  // Für Animation: Register ist "rechts", Login/Forgot sind "links"
  const isPanelRight = isRegisterMode;

  // Auto-redirect if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Set data attribute on HTML element for CSS styling
  useEffect(() => {
    const htmlElement = document.documentElement;

    if (!isDesktop && !isPanelRight) {
      // Mobile in login/forgot mode: Branding panel is at bottom
      htmlElement.setAttribute('data-auth-branding-bottom', 'true');
    } else {
      htmlElement.removeAttribute('data-auth-branding-bottom');
    }
  }, [isDesktop, isPanelRight]);

  // Loading state
  if (isLoading) {
    return null;
  }

  // ============================================
  // SPRING ANIMATION CONFIG
  // ============================================
  const springConfig = {
    type: 'spring',
    stiffness: 50,
    damping: 15,
    mass: 1,
  };

  // ============================================
  // RENDER FORM CONTENT
  // ============================================
  const renderFormContent = () => {
    // Determine which form to show
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
      if (isForgotMode) return resetToken ? <ResetPasswordForm token={resetToken} /> : <ForgotPasswordRequestForm />;
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
        {/* Form Panel - starts left, slides right on register */}
        <motion.div 
          className={styles.formPanel}
          initial={false}
          animate={{ x: isPanelRight ? '100%' : '0%' }}
          transition={springConfig}
        >
          {renderFormContent()}
        </motion.div>

        {/* Branding Panel - starts right, slides left on register */}
        <motion.div 
          className={styles.brandingPanel}
          initial={false}
          animate={{ x: isPanelRight ? '-100%' : '0%' }}
          transition={springConfig}
        >
          <BrandingPanel mode={mode} isDesktop={isDesktop} />
        </motion.div>
      </div>
    );
  }

  // ============================================
  // MOBILE LAYOUT (Vertical 60/40)
  // ============================================
  return (
    <div className={`${styles.authPageMobile} ${isPanelRight ? styles.registerMode : ''}`}>
      <motion.div 
        layout
        className={styles.formPanelMobile}
        transition={springConfig}
      >
        {renderFormContent()}
      </motion.div>

      <motion.div 
        layout
        className={styles.brandingPanelMobile}
        transition={springConfig}
      >
        <BrandingPanel mode={mode} isDesktop={isDesktop} />
      </motion.div>
    </div>
  );
}
