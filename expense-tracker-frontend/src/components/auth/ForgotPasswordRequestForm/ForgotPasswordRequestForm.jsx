/**
 * @fileoverview ForgotPasswordRequestForm Component
 * @description Form component for requesting password reset email.
 * 
 * FEATURES:
 * - Email input with FloatingLabelInput
 * - Form validation
 * - Loading state with spinner
 * - Error display
 * - Success message
 * 
 * @module components/auth/ForgotPasswordRequestForm
 */

import { useState } from 'react';
import { useAuth } from '@/hooks';
import { FloatingLabelInput } from '@/components/common';
import styles from './ForgotPasswordRequestForm.module.scss';

export default function ForgotPasswordRequestForm() {
  const { forgotPassword } = useAuth();

  // ============================================
  // STATE
  // ============================================

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldError, setFieldError] = useState('');

  // ============================================
  // VALIDATION
  // ============================================

  const validateForm = () => {
    if (!email) {
      setFieldError('E-Mail ist erforderlich');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError('Ungültige E-Mail-Adresse');
      return false;
    }

    setFieldError('');
    return true;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError('');
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (error) {
      setApiError(
        error?.response?.data?.message ||
        'Fehler beim Senden des Reset-Links. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (isSuccess) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIcon}>📧</div>
        <h1 className={styles.successTitle}>
          Überprüfen Sie Ihr E-Mail
        </h1>
        <p className={styles.successMessage}>
          Wir haben einen Link zum Zurücksetzen Ihres Passworts an{' '}
          <strong>{email}</strong> gesendet.
        </p>
        <p className={styles.successSubtext}>
          Der Link ist 24 Stunden lang gültig. Überprüfen Sie auch Ihren Spam-Ordner.
        </p>
        <button
          className={styles.backButton}
          onClick={() => globalThis.location.href = '/login'}
        >
          Zurück zur Anmeldung
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.requestForm}>
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

      {/* Email Field */}
      <div className={styles.formGroup}>
        <FloatingLabelInput
          id="email"
          label="E-Mail"
          type="email"
          value={email}
          onChange={handleChange}
          name="email"
          placeholder="you@example.com"
          disabled={isLoading}
          autoComplete="email"
          error={fieldError}
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || !email}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            <span>Link wird gesendet...</span>
          </>
        ) : (
          'Reset-Link senden'
        )}
      </button>
    </form>
  );
}
