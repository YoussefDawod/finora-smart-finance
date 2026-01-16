/**
 * @fileoverview LoginForm Component
 * @description Form component for user login with email/password.
 * 
 * FEATURES:
 * - Email and password inputs
 * - Remember me checkbox
 * - Form validation
 * - Loading state with spinner
 * - Error display
 * - Submit handler
 * 
 * @module components/auth/LoginForm
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '@/hooks';
import { FloatingLabelInput } from '@/components/common';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ============================================
  // VALIDATION
  // ============================================

  const validateEmail = (email) => {
    if (!email) return 'E-Mail ist erforderlich';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Ungültige E-Mail-Adresse';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Passwort ist erforderlich';
    if (password.length < 6) return 'Passwort muss mindestens 6 Zeichen haben';
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation
  const getEmailStatus = () => {
    if (!formData.email) return null;
    return validateEmail(formData.email) ? 'error' : 'valid';
  };

  const getPasswordStatus = () => {
    if (!formData.password) return null;
    return validatePassword(formData.password) ? 'error' : 'valid';
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Real-time validation for this field
    if (name === 'email') {
      const emailError = validateEmail(value);
      setErrors((prev) => ({ ...prev, email: emailError }));
    } else if (name === 'password') {
      const passwordError = validatePassword(value);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
    
    // Clear API error
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.warning('Bitte füllen Sie alle Felder korrekt aus');
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await login(formData.email, formData.password);
      
      toast.success('Erfolgreich angemeldet!');
      // Success - AuthContext will redirect to /dashboard
      // navigate('/dashboard'); // Not needed, AuthContext handles it
    } catch (error) {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.response?.data?.error ||
        'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const hasFieldErrors = Object.values(errors).some(Boolean);

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.loginForm} ${(apiError || hasFieldErrors) ? styles.shake : ''}`}
    >
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

      {/* Email Field with Floating Label */}
      <div className={styles.formGroup}>
        <FloatingLabelInput
          id="email"
            name="email"
          label="E-Mail"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          disabled={isLoading}
          autoComplete="email"
          required
        />
      </div>

      {/* Password Field with Floating Label */}
      <div className={styles.formGroup}>
        <div className={styles.floatingPasswordWrapper}>
          <FloatingLabelInput
            id="password"
            name="password"
            label="Passwort"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
            autoComplete="current-password"
            required
            iconRight={
              <button
                type="button"
                className={styles.passwordToggleButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            }
          />
        </div>
      </div>

      {/* Remember Me */}
      <div className={styles.checkboxGroup}>
        <input
          id="rememberMe"
          name="rememberMe"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={handleChange}
          className={styles.checkbox}
          disabled={isLoading}
        />
        <label htmlFor="rememberMe" className={styles.checkboxLabel}>
          Angemeldet bleiben
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || hasFieldErrors || !formData.email || !formData.password}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            <span>Anmelden...</span>
          </>
        ) : (
          'Anmelden'
        )}
      </button>
    </form>
  );
}
