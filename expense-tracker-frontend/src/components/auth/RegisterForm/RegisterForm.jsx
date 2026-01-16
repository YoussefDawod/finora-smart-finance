/**
 * @fileoverview RegisterForm Component
 * @description Form component for user registration with password strength indicator.
 * 
 * FEATURES:
 * - Email, name, password, confirm password inputs
 * - Password strength indicator (Weak/Medium/Strong)
 * - Terms acceptance checkbox
 * - Form validation
 * - Loading state with spinner
 * - Error display
 * 
 * @module components/auth/RegisterForm
 */

import { useState } from 'react';
import { useAuth, useToast } from '@/hooks';
import { FloatingLabelInput } from '@/components/common';
import styles from './RegisterForm.module.scss';

/**
 * Calculate password strength
 * @param {string} password
 * @returns {{ level: 'weak'|'medium'|'strong', score: number }}
 */
const calculatePasswordStrength = (password) => {
  if (!password) return { level: 'weak', score: 0 };

  let score = 0;
  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    isLongEnough: password.length >= 8,
  };

  // Award points for each check
  Object.values(checks).forEach((check) => {
    if (check) score += 20;
  });

  // Determine level
  let level = 'weak';
  if (score >= 60) level = 'medium';
  if (score >= 80) level = 'strong';

  return { level, score };
};

export default function RegisterForm() {
  const { register } = useAuth();
  const toast = useToast();

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    level: 'weak',
    score: 0,
  });

  // ============================================
  // VALIDATION
  // ============================================

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name ist erforderlich';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name muss mindestens 2 Zeichen haben';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name darf maximal 50 Zeichen haben';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen haben';
    } else if (passwordStrength.level === 'weak') {
      newErrors.password = 'Passwort ist zu schwach. Nutzen Sie Großbuchstaben, Zahlen und Sonderzeichen';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwortbestätigung ist erforderlich';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Sie müssen den Bedingungen zustimmen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time field validation helpers
  const getEmailStatus = () => {
    if (!formData.email) return null;
    return /\S+@\S+\.\S+/.test(formData.email) ? 'valid' : 'error';
  };

  const getNameStatus = () => {
    if (!formData.name) return null;
    return formData.name.length >= 2 && formData.name.length <= 50 ? 'valid' : 'error';
  };

  const getPasswordStatus = () => {
    if (!formData.password) return null;
    return formData.password.length >= 8 ? 'valid' : 'error';
  };

  const getConfirmPasswordStatus = () => {
    if (!formData.confirmPassword) return null;
    return formData.password === formData.confirmPassword ? 'valid' : 'error';
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Calculate strength for password field
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Real-time validation for each field
    if (name === 'name') {
      const nameError = validateForm.call({ formData: { ...formData, [name]: newValue } }, null, 'name');
      setErrors((prev) => ({ ...prev, name: nameError }));
    } else if (name === 'email') {
      if (value) {
        const emailError = /\S+@\S+\.\S+/.test(value) ? '' : 'Ungültige E-Mail-Adresse';
        setErrors((prev) => ({ ...prev, email: emailError }));
      } else {
        setErrors((prev) => ({ ...prev, email: 'E-Mail ist erforderlich' }));
      }
    } else if (name === 'password') {
      if (value.length < 8) {
        setErrors((prev) => ({ ...prev, password: 'Passwort muss mindestens 8 Zeichen haben' }));
      } else if (calculatePasswordStrength(value).level === 'weak') {
        setErrors((prev) => ({ ...prev, password: 'Passwort zu schwach' }));
      } else {
        setErrors((prev) => ({ ...prev, password: '' }));
      }
    } else if (name === 'confirmPassword') {
      const confirmError = value !== formData.password ? 'Passwörter stimmen nicht überein' : '';
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    } else if (name === 'agreeToTerms') {
      if (!newValue) {
        setErrors((prev) => ({ ...prev, agreeToTerms: 'Sie müssen den Bedingungen zustimmen' }));
      } else {
        setErrors((prev) => ({ ...prev, agreeToTerms: '' }));
      }
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
      await register(
        formData.email,
        formData.password,
        formData.name
      );

      toast.success('Registrierung erfolgreich!');
      // Success - redirect will be handled by AuthContext
    } catch (error) {
      const errorMessage = 
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const strengthPercentage = passwordStrength.score;
  const strengthColor = {
    weak: '#ef4444',
    medium: '#f59e0b',
    strong: '#10b981',
  }[passwordStrength.level];

  const hasFieldErrors = Object.values(errors).some(Boolean);

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.registerForm} ${(apiError || hasFieldErrors) ? styles.shake : ''}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Registrieren</h1>
        <p className={styles.subtitle}>
          Erstellen Sie ein neues Konto
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

      {/* Name Field with Floating Label */}
      <div className={styles.formGroup}>
        <FloatingLabelInput
          id="name"
            name="name"
          label="Name"
          type="text"
          placeholder="Ihr Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          disabled={isLoading}
          autoComplete="name"
          required
        />
      </div>

      {/* Password Field with Floating Label and Strength Indicator */}
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
            hint={formData.password ? `Stärke: ${passwordStrength.level === 'weak' ? 'Schwach' : passwordStrength.level === 'medium' ? 'Mittel' : 'Stark'}` : ''}
            disabled={isLoading}
            autoComplete="new-password"
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

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className={styles.strengthContainer}>
            <div className={styles.strengthBar}>
              <div
                className={styles.strengthFill}
                style={{
                  width: `${strengthPercentage}%`,
                  backgroundColor: strengthColor,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field with Floating Label */}
      <div className={styles.formGroup}>
        <div className={styles.floatingPasswordWrapper}>
          <FloatingLabelInput
            id="confirmPassword"
            name="confirmPassword"
            label="Passwort bestätigen"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={isLoading}
            autoComplete="new-password"
            required
            iconRight={
              <button
                type="button"
                className={styles.passwordToggleButton}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                tabIndex={-1}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            }
          />
        </div>
      </div>

      {/* Terms Checkbox */}
      <div className={styles.checkboxGroup}>
        <input
          id="agreeToTerms"
          name="agreeToTerms"
          type="checkbox"
          checked={formData.agreeToTerms}
          onChange={handleChange}
          className={`${styles.checkbox} ${errors.agreeToTerms ? styles.checkboxError : ''}`}
          disabled={isLoading}
          aria-invalid={!!errors.agreeToTerms}
          aria-describedby={errors.agreeToTerms ? 'terms-error' : undefined}
        />
        <label htmlFor="agreeToTerms" className={styles.checkboxLabel}>
          Ich stimme den{' '}
          <a href="/terms" className={styles.termsLink} target="_blank" rel="noopener noreferrer">
            Nutzungsbedingungen
          </a>{' '}
          zu
        </label>
      </div>
      {errors.agreeToTerms && (
        <span className={styles.fieldError} id="terms-error" role="alert">⚠ {errors.agreeToTerms}</span>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || Object.values(errors).some(Boolean) || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.agreeToTerms}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            <span>Registrieren...</span>
          </>
        ) : (
          'Registrieren'
        )}
      </button>
    </form>
  );
}
