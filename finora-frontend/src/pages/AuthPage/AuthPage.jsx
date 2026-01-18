/**
 * @fileoverview AuthPage Component - Unified Auth Layout
 * 
 * ARCHITECTURE:
 * - Uses useIsDesktop hook to render ONLY ONE layout (no duplicate IDs)
 * - Only ONE form is rendered at a time (Login OR Register)
 * 
 * DESKTOP (Horizontal 50/50):
 * - Login mode:    [Form 50%] [Branding 50%]
 * - Register mode: [Branding 50%] [Form 50%]
 * 
 * MOBILE (Vertical 60/40):
 * - Login mode:    [Form 60%] / [Branding 40%]
 * - Register mode: [Branding 40%] / [Form 60%]
 * 
 * @module pages/AuthPage
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useMotion, useIsDesktop } from '@/hooks';
import { LoginForm, MultiStepRegisterForm, BrandingPanel } from '@/components/auth';
import styles from './AuthPage.module.scss';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldAnimate } = useMotion();
  const isDesktop = useIsDesktop();

  // Determine current mode from URL
  const isRegisterMode = location.pathname === '/register';
  const mode = isRegisterMode ? 'register' : 'login';

  // Auto-redirect if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

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
  const renderFormContent = () => (
    <div className={styles.formInner}>
      <AnimatePresence mode="wait">
        {isRegisterMode ? (
          <motion.div
            key="register-form"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.formWrapper}
          >
            <header className={styles.header}>
              <h1 className={styles.title}>Konto erstellen</h1>
              <p className={styles.subtitle}>
                Starten Sie in wenigen Schritten mit Finora durch.
              </p>
            </header>
            <MultiStepRegisterForm />
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.formWrapper}
          >
            <header className={styles.header}>
              <h1 className={styles.title}>Anmelden</h1>
              <p className={styles.subtitle}>
                Willkommen zurück! Melden Sie sich an, um fortzufahren.
              </p>
            </header>
            <LoginForm />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

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
          animate={{ x: isRegisterMode ? '100%' : '0%' }}
          transition={springConfig}
        >
          {renderFormContent()}
        </motion.div>

        {/* Branding Panel - starts right, slides left on register */}
        <motion.div 
          className={styles.brandingPanel}
          initial={false}
          animate={{ x: isRegisterMode ? '-100%' : '0%' }}
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
    <div className={styles.authPageMobile}>
      {/* Form Panel - 60% height, starts top, slides down on register */}
      <motion.div 
        className={styles.formPanelMobile}
        initial={false}
        animate={{ y: isRegisterMode ? '66.67%' : '0%' }}
        transition={springConfig}
      >
        {renderFormContent()}
      </motion.div>

      {/* Branding Panel - 40% height, starts bottom, slides up on register */}
      <motion.div 
        className={styles.brandingPanelMobile}
        initial={false}
        animate={{ y: isRegisterMode ? '-150%' : '0%' }}
        transition={springConfig}
      >
        <BrandingPanel mode={mode} isDesktop={isDesktop} />
      </motion.div>
    </div>
  );
}
