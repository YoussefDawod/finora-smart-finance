/**
 * @fileoverview ForgotPasswordRequestForm Component - Premium Redesign
 * @description Modern form for requesting password reset email
 * 
 * FEATURES:
 * - Email input with floating label
 * - Loading state with spinner
 * - Success state with email icon
 * - Error handling
 * 
 * @module components/auth/ForgotPasswordRequestForm
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast, useMotion } from '@/hooks';
import { 
  FiMail, 
  FiAlertCircle, 
  FiArrowRight,
  FiArrowLeft,
  FiX
} from 'react-icons/fi';
import styles from './ForgotPasswordRequestForm.module.scss';

export default function ForgotPasswordRequestForm() {
  const { forgotPassword } = useAuth();
  const toast = useToast();
  const { shouldAnimate } = useMotion();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  // ============================================
  // STATE
  // ============================================

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // ============================================
  // VALIDATION
  // ============================================

  const validateEmail = (value) => {
    if (!value) return t('auth.forgot.validation.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('auth.forgot.validation.emailInvalid');
    return '';
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (touched) {
      setError(validateEmail(value));
    }

    if (apiError) setApiError('');
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched(true);
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await forgotPassword(email);
      setIsSuccess(true);
      toast.success(t('auth.forgot.successToast'));
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        t('auth.forgot.errorToast');
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // SUCCESS STATE
  // ============================================

  if (isSuccess) {
    return (
      <motion.div 
        className={styles.successContainer}
        initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.successIcon}>
          <FiMail />
        </div>
        <h2 className={styles.successTitle}>{t('auth.forgot.successTitle')}</h2>
        <p className={styles.successMessage}>
          {t('auth.forgot.successMessage', { email })}
        </p>
        <p className={styles.successHint}>
          {t('auth.forgot.successHint')}
        </p>
        <button
          type="button"
          className={styles.resendButton}
          onClick={() => setIsSuccess(false)}
        >
          {t('auth.forgot.useDifferentEmail')}
        </button>
      </motion.div>
    );
  }

  // ============================================
  // RENDER FORM
  // ============================================

  const hasError = Boolean(error && touched);

  return (
    <form onSubmit={handleSubmit} className={styles.requestForm} noValidate>
      {/* API Error */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FiAlertCircle className={styles.errorIcon} />
            <span>{apiError}</span>
            <button
              type="button"
              className={styles.errorDismiss}
              onClick={() => setApiError('')}
            >
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Field */}
      <div className={styles.inputGroup}>
        <div className={`${styles.inputWrapper} ${hasError ? styles.error : ''}`}>
          <FiMail className={styles.inputIcon} />
          <input
            id="email"
            name="email"
            type="email"
            className={styles.input}
            placeholder=" "
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
          <label htmlFor="email" className={styles.label}>
            {t('auth.forgot.emailLabel')}
          </label>
        </div>
        <AnimatePresence>
          {hasError && (
            <motion.span
              className={styles.errorMessage}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {error}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || hasError || !email}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            <span>{t('auth.forgot.sending')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.forgot.submit')}</span>
            {isRtl ? <FiArrowLeft className={styles.buttonIcon} /> : <FiArrowRight className={styles.buttonIcon} />}
          </>
        )}
      </button>
    </form>
  );
}
