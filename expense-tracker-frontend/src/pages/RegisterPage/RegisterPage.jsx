/**
 * @fileoverview RegisterPage Component
 * @description Professional registration page
 * 
 * FEATURES:
 * - Clean registration form
 * - Link back to login
 * - Auto-redirect if already authenticated
 * - Responsive design
 * 
 * @module pages/RegisterPage
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AuthLayout } from '@/components/layout';
import { MultiStepRegisterForm } from '@/components/auth';
import styles from './RegisterPage.module.scss';

export default function RegisterPage() {
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
      <div className={styles.registerPage}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Konto erstellen</h1>
          <p className={styles.subtitle}>Registrieren Sie sich in drei klaren Schritten</p>
        </div>

        {/* Register Form */}
        <MultiStepRegisterForm />

        {/* Footer Links */}
        <div className={styles.footer}>
          <div className={styles.divider}>
            <span>oder</span>
          </div>
          
          <div className={styles.links}>
            <Link to="/login" className={styles.link}>
              Bereits ein Konto? <strong>Anmelden</strong>
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
