/**
 * @fileoverview LoginPage Component
 * @description Professional login page with clean design
 * 
 * FEATURES:
 * - Clean, modern login interface
 * - Links to registration and password reset
 * - Auto-redirect if already authenticated
 * - Responsive design
 * 
 * @module pages/LoginPage
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/components/layout';
import { LoginForm } from '@/components/auth';
import styles from './LoginPage.module.scss';

export default function LoginPage() {
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
      <div className={styles.loginPage}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Willkommen zurück</h1>
          <p className={styles.subtitle}>Melden Sie sich bei Ihrem Konto an</p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer Links */}
        <div className={styles.footer}>
          <div className={styles.divider}>
            <span>oder</span>
          </div>
          
          <div className={styles.links}>
            <Link to="/register" className={styles.link}>
              Noch kein Konto? <strong>Registrieren</strong>
            </Link>
            <Link to="/forgot-password" className={styles.link}>
              Passwort vergessen?
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
