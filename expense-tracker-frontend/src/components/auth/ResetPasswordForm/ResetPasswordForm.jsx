/**
 * @fileoverview ResetPasswordForm Component
 * @description Form component for resetting password with token validation.
 * 
 * FEATURES:
 * - Password input with strength indicator
 * - Confirm password validation
 * - Token validation
 * - Loading state
 * - Error display
 * 
 * @module components/auth/ResetPasswordForm
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { FloatingLabelInput } from '@/components/common';
import styles from './ResetPasswordForm.module.scss';

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
    hasSpecial: /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(password),
    isLongEnough: password.length >= 8,
  };

  Object.values(checks).forEach((check) => {
    if (check) score += 20;
  });

  let level = 'weak';
  if (score >= 60) level = 'medium';
  if (score >= 80) level = 'strong';

  return { level, score };
};

export default function ResetPasswordForm({ token }) {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    level: 'weak',
    score: 0,
  });

  // ============================================
  // VALIDATION
  // ============================================

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen haben';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwortbestätigung ist erforderlich';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await resetPassword(token, formData.password);
      
      // Success - redirect to login
      navigate('/login', {
        state: {
          message: 'Passwort erfolgreich zurückgesetzt. Bitte melden Sie sich an.',
        },
        replace: true,
      });
    } catch (error) {
      setApiError(
        error?.response?.data?.message ||
        'Passwort konnte nicht zurückgesetzt werden. Der Link könnte abgelaufen sein.'
      );
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

  return (
    <form onSubmit={handleSubmit} className={styles.resetForm}>
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

      {/* Password Field */}
      <div className={styles.formGroup}>
        <FloatingLabelInput
          id="password"
          name="password"
          type="password"
          label="Passwort"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isLoading}
          autoComplete="new-password"
          required
          showPasswordToggle
        />

        {/* Password Strength */}
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
            <span
              className={styles.strengthLabel}
              style={{ color: strengthColor }}
            >
              {passwordStrength.level === 'weak' && 'Schwaches Passwort'}
              {passwordStrength.level === 'medium' && 'Mittleres Passwort'}
              {passwordStrength.level === 'strong' && 'Starkes Passwort'}
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className={styles.formGroup}>
        <FloatingLabelInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Passwort bestätigen"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={isLoading}
          autoComplete="new-password"
          required
          showPasswordToggle
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || !formData.password || !formData.confirmPassword}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            Wird aktualisiert...
          </>
        ) : (
          'Passwort zurücksetzen'
        )}
      </button>
    </form>
  );
}
