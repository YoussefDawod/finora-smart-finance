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
      toast.success('E-Mail erfolgreich bestätigt!');

      // Redirect after delay
      window.setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      setApiError(errorMessage);
      toast.error(errorMessage);

      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [verifyEmail, toast, navigate, isLoading]);

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
      toast.success('Neuer Code wurde gesendet!');
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        'Fehler beim Senden. Bitte versuchen Sie es später erneut.';
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
        <h2 className={styles.successTitle}>E-Mail bestätigt!</h2>
        <p className={styles.successMessage}>
          Sie werden zum Dashboard weitergeleitet...
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
            aria-label={`Ziffer ${index + 1}`}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <span className={styles.spinner} />
          <span>Verifiziere...</span>
        </div>
      )}

      {/* Resend Section */}
      <div className={styles.resendSection}>
        <span className={styles.resendText}>
          Keinen Code erhalten?
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
              Senden...
            </>
          ) : resendCountdown > 0 ? (
            `Erneut senden (${resendCountdown}s)`
          ) : (
            <>
              <FiRefreshCw className={styles.resendIcon} />
              Code erneut senden
            </>
          )}
        </button>
      </div>

      {/* Email hint */}
      {email && (
        <div className={styles.emailHint}>
          <FiMail className={styles.emailIcon} />
          <span>Prüfen Sie auch Ihren Spam-Ordner</span>
        </div>
      )}
    </div>
  );
}
