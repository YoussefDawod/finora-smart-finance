/**
 * @fileoverview AuthLayout Demo Page
 * @description Demo page to showcase all Auth Components and AuthLayout.
 * 
 * SHOWCASED COMPONENTS:
 * - LoginForm (email + password)
 * - RegisterForm (with password strength)
 * - VerifyEmailForm (6-digit code)
 * - ForgotPasswordRequestForm (email for reset)
 * - ResetPasswordForm (new password)
 * 
 * USE THIS FOR:
 * - Testing all authentication flows
 * - Verifying responsive design
 * - Checking glassmorphic card effect
 * - Visual regression testing
 * 
 * @module pages/AuthLayoutDemo
 */

import { useState } from 'react';
import { AuthLayout } from '@/components/layout';
import {
  LoginForm,
  RegisterForm,
  VerifyEmailForm,
  ForgotPasswordRequestForm,
} from '@/components/auth';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm/ResetPasswordForm';
import styles from './AuthLayoutDemo.module.scss';

export default function AuthLayoutDemo() {
  const [activeTab, setActiveTab] = useState('login');

  // ============================================
  // COMPONENT MAP
  // ============================================

  const components = {
    login: {
      label: '🔐 Login',
      component: <LoginForm />,
    },
    register: {
      label: '📝 Register',
      component: <RegisterForm />,
    },
    verify: {
      label: '✉️ Verify Email',
      component: <VerifyEmailForm />,
    },
    forgot: {
      label: '🔑 Forgot Password',
      component: <ForgotPasswordRequestForm />,
    },
    reset: {
      label: '🔄 Reset Password',
      component: <ResetPasswordForm token="demo-token-12345" />,
    },
  };

  return (
    <div className={styles.demoContainer}>
      {/* Header */}
      <div className={styles.demoHeader}>
        <h1 className={styles.pageTitle}>Authentication Components</h1>
        <p className={styles.pageSubtitle}>
          Demo page showcasing all auth components
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {Object.entries(components).map(([key, { label }]) => (
            <button
              key={key}
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Component Display */}
      <AuthLayout>
        {components[activeTab].component}
      </AuthLayout>

      {/* Info Footer */}
      <div className={styles.infoFooter}>
        <div className={styles.infoBox}>
          <p className={styles.infoTitle}>ℹ️ Demo Information</p>
          <ul className={styles.infoList}>
            <li>Alle Komponenten sind responsive</li>
            <li>
              Test-URLs:
              <ul>
                <li>
                  <code>/login</code>
                </li>
                <li>
                  <code>/register</code>
                </li>
                <li>
                  <code>/verify-email</code>
                </li>
                <li>
                  <code>/forgot-password</code>
                </li>
              </ul>
            </li>
            <li>Formularvalidierung ist aktiviert</li>
            <li>Error Handling für alle Komponenten implementiert</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
