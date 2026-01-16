/**
 * @fileoverview ForgotPasswordPage Component
 * @description Page for requesting password reset link via email.
 * 
 * @module pages/ForgotPasswordPage
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks';
import styles from './ForgotPasswordPage.module.scss';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email) {
      setError('E-Mail ist erforderlich');
      toast.warning('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Ungültige E-Mail-Adresse');
      toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual API call
      // await authService.requestPasswordReset(email);
      
      // Simulate API call
      await new Promise(resolve => globalThis.setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast.success('Password-Reset-Link wurde gesendet!');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 
        'Fehler beim Senden des Reset-Links';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.forgotPasswordPage}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>E-Mail gesendet!</h1>
            <p className={styles.description}>
              Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts an <strong>{email}</strong> gesendet.
            </p>
            <p className={styles.hint}>
              Bitte überprüfen Sie auch Ihren Spam-Ordner, falls Sie die E-Mail nicht finden.
            </p>
            <Link to="/login" className={styles.backButton}>
              Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotPasswordPage}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Passwort vergessen?</h1>
          <p className={styles.description}>
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                placeholder="you@example.com"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
              {error && (
                <span className={styles.fieldError}>{error}</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  <span>Wird gesendet...</span>
                </>
              ) : (
                'Reset-Link senden'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <Link to="/login" className={styles.backLink}>
              ← Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
