/**
 * @fileoverview VerifyEmailForm Component
 * @description Form component for email verification with 6-digit code input.
 * 
 * FEATURES:
 * - 6 input fields (1 digit each)
 * - Auto-focus on digit entry
 * - Auto-submit when all digits filled
 * - Keyboard navigation (arrow keys, backspace)
 * - Resend email with countdown timer
 * - Error display
 * 
 * @module components/auth/VerifyEmailForm
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks';
import styles from './VerifyEmailForm.module.scss';

export default function VerifyEmailForm() {
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const inputRefs = useRef([]);

  // ============================================
  // STATE
  // ============================================

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // ============================================
  // RESEND COUNTDOWN TIMER
  // ============================================

  useEffect(() => {
    if (resendCountdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = globalThis.setTimeout(() => {
      setResendCountdown(resendCountdown - 1);
    }, 1000);

    return () => globalThis.clearTimeout(timer);
  }, [resendCountdown]);

  // ============================================
  // AUTO-SUBMIT WHEN CODE COMPLETE
  // ============================================

  useEffect(() => {
    // Check if all digits are filled
    const isComplete = code.every((digit) => digit !== '');
    if (isComplete && !isLoading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleInputChange = (index, value) => {
    // Only allow digits
    if (!/^\d?$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Clear API error
    if (apiError) {
      setApiError('');
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (code[index]) {
          // Clear current field
          const newCode = [...code];
          newCode[index] = '';
          setCode(newCode);
        } else if (index > 0) {
          // Move to previous field and clear
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

  const handleSubmit = async () => {
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setApiError('Bitte geben Sie alle 6 Ziffern ein');
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await verifyEmail(fullCode);
      // Success - AuthContext will redirect to /dashboard
    } catch (error) {
      setApiError(
        error?.response?.data?.message ||
        'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setApiError('');

    try {
      await resendVerificationEmail();
      setResendCountdown(60);
      setCanResend(false);
    } catch (error) {
      setApiError(
        error?.response?.data?.message ||
        'E-Mail konnte nicht erneut gesendet werden. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={styles.verifyForm}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>E-Mail bestätigen</h1>
        <p className={styles.subtitle}>
          Geben Sie den 6-stelligen Code ein, der an Ihre E-Mail gesendet wurde
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>{apiError}</span>
          <button
            type="button"
            className={styles.errorDismiss}
            onClick={() => setApiError('')}
            aria-label="Fehler schließen"
          >
            ×
          </button>
        </div>
      )}

      {/* Code Input Fields */}
      <div className={styles.codeContainer}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`${styles.codeInput} ${
              digit ? styles.codeInputFilled : ''
            } ${isLoading ? styles.codeInputDisabled : ''}`}
            disabled={isLoading}
            placeholder="0"
            aria-label={`Ziffer ${index + 1}`}
          />
        ))}
      </div>

      {/* Resend Email Section */}
      <div className={styles.resendSection}>
        <p className={styles.resendText}>
          {canResend
            ? 'Haben Sie keinen Code erhalten?'
            : `Code wird in ${resendCountdown}s erneut gesendet`}
        </p>
        <button
          type="button"
          className={styles.resendButton}
          onClick={handleResendEmail}
          disabled={!canResend || resendLoading}
        >
          {resendLoading ? 'Wird gesendet...' : 'E-Mail erneut senden'}
        </button>
      </div>

      {/* Status Info */}
      <div className={styles.statusInfo}>
        <span className={styles.statusLabel}>
          {isLoading ? '⏳ Wird verifyf...' : '📧 Verifizierungscode eingeben'}
        </span>
      </div>
    </div>
  );
}
