/**
 * @fileoverview VerifyEmailPage Component
 * @description Email verification page with 6-digit code input
 * 
 * FEATURES:
 * - 6-digit code verification
 * - Auto-submit when complete
 * - Resend code option
 * - Link back to login
 * 
 * @module pages/VerifyEmailPage
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/components/layout';
import { VerifyEmailForm } from '@/components/auth';
import styles from './VerifyEmailPage.module.scss';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

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
      <div className={styles.verifyEmailPage}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Email verifizieren</h1>
          <p className={styles.subtitle}>Geben Sie den 6-stelligen Code ein, den wir Ihnen gesendet haben</p>
        </div>

        {/* Verify Form */}
        <VerifyEmailForm />

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
