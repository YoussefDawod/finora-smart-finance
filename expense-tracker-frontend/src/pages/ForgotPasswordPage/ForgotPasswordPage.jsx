/**
 * @fileoverview ForgotPasswordPage Component
 * @description Password reset page with two steps: request reset and set new password
 * 
 * FEATURES:
 * - Email input to request reset link
 * - New password form (when token present)
 * - Link back to login
 * - Responsive design
 * 
 * @module pages/ForgotPasswordPage
 */

import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/components/layout';
import { ForgotPasswordRequestForm, ResetPasswordForm } from '@/components/auth';
import styles from './ForgotPasswordPage.module.scss';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

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
  // RENDER
  // ============================================

  return (
    <AuthLayout>
      <div className={styles.forgotPasswordPage}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {token ? 'Neues Passwort setzen' : 'Passwort vergessen'}
          </h1>
          <p className={styles.subtitle}>
            {token
              ? 'Geben Sie Ihr neues Passwort ein'
              : 'Wir senden Ihnen einen Link zum Zurücksetzen'}
          </p>
        </div>

        {/* Conditional Form */}
        {token ? <ResetPasswordForm token={token} /> : <ForgotPasswordRequestForm />}

        {/* Footer Links */}
        <div className={styles.footer}>
          <div className={styles.divider}>
            <span>oder</span>
          </div>

          <div className={styles.links}>
            <Link to="/login" className={styles.link}>
              Zurück zur <strong>Anmeldung</strong>
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
