/**
 * @fileoverview VerifyEmailForm Component - Premium Redesign
 * @description Modern 6-digit code verification form
 * 
 * FEATURES:
 * - 6 input fields (1 digit each)
 * - Auto-focus on digit entry
 * - Auto-submit when complete
 * - Keyboard navigation
 * - Resend email with countdown
 * - Animated transitions
 * 
 * @module components/auth/VerifyEmailForm
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast, useMotion } from '@/hooks';
import { 
  FiMail, 
  FiAlertCircle, 
  FiCheck,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';
import styles from './VerifyEmailForm.module.scss';

export default function VerifyEmailForm({ email }) {
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const toast = useToast();
  const { shouldAnimate } = useMotion();
  const { t } = useTranslation();
  const inputRefs = useRef([]);

  // ============================================
  // STATE
  // ============================================

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // ============================================
  // RESEND COUNTDOWN
  // ============================================

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  // ============================================
  // AUTO-SUBMIT
  // ============================================

  const handleSubmit = useCallback(async (fullCode) => {
    if (fullCode.length !== 6 || isLoading) return;

    setIsLoading(true);
    setApiError('');

    try {
      await verifyEmail(fullCode);
      setIsSuccess(true);
      toast.success(t('auth.verifyForm.successToast'));

      // Redirect after delay
      window.setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        t('auth.verifyForm.errorToast');
      setApiError(errorMessage);
      toast.error(errorMessage);

      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [verifyEmail, toast, navigate, t, isLoading]);

  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !isLoading && !isSuccess) {
      handleSubmit(fullCode);
    }
  }, [code, handleSubmit, isLoading, isSuccess]);

  // ============================================
  // INPUT HANDLERS
  // ============================================

  const handleInputChange = (index, value) => {
    // Only allow single digit
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (apiError) setApiError('');

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (code[index]) {
          const newCode = [...code];
          newCode[index] = '';
          setCode(newCode);
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
          const newCode = [...code];
          newCode[index - 1] = '';
          setCode(newCode);
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (index < 5) {
          inputRefs.current[index + 1]?.focus();
        }
        break;

      default:
        break;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newCode[i] = digits[i];
      }
      setCode(newCode);

      // Focus last filled or next empty
      const focusIndex = Math.min(digits.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // ============================================
  // RESEND HANDLER
  // ============================================

  const handleResend = async () => {
    if (resendCountdown > 0 || resendLoading) return;

    setResendLoading(true);
    setApiError('');

    try {
      await resendVerificationEmail(email);
      setResendCountdown(60);
      toast.success(t('auth.verifyForm.resendSuccess'));
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        t('auth.verifyForm.resendError');
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
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
          <FiCheck />
        </div>
        <h2 className={styles.successTitle}>{t('auth.verifyForm.successTitle')}</h2>
        <p className={styles.successMessage}>
          {t('auth.verifyForm.successMessage')}
        </p>
      </motion.div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={styles.verifyForm}>
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

      {/* Code Input */}
      <div className={styles.codeInputContainer}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={`${styles.codeInput} ${digit ? styles.filled : ''}`}
            autoFocus={index === 0}
            aria-label={t('auth.verifyForm.digitLabel', { index: index + 1 })}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <span className={styles.spinner} />
          <span>{t('auth.verifyForm.loading')}</span>
        </div>
      )}

      {/* Resend Section */}
      <div className={styles.resendSection}>
        <span className={styles.resendText}>
          {t('auth.verifyForm.resendPrompt')}
        </span>
        <button
          type="button"
          className={styles.resendButton}
          onClick={handleResend}
          disabled={resendCountdown > 0 || resendLoading}
        >
          {resendLoading ? (
            <>
              <span className={styles.resendSpinner} />
              {t('auth.verifyForm.resendSending')}
            </>
          ) : resendCountdown > 0 ? (
            t('auth.verifyForm.resendCountdown', { count: resendCountdown })
          ) : (
            <>
              <FiRefreshCw className={styles.resendIcon} />
              {t('auth.verifyForm.resendAction')}
            </>
          )}
        </button>
      </div>

      {/* Email hint */}
      {email && (
        <div className={styles.emailHint}>
          <FiMail className={styles.emailIcon} />
          <span>{t('auth.verifyForm.spamHint')}</span>
        </div>
      )}
    </div>
  );
}
