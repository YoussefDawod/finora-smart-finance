/**
 * @fileoverview ResetPasswordForm Component - Premium Redesign
 * @description Modern form for resetting password with token validation
 * 
 * FEATURES:
 * - Password input with strength indicator
 * - Confirm password validation
 * - Loading state with spinner
 * - Success state
 * 
 * @module components/auth/ResetPasswordForm
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useToast, useMotion } from '@/hooks';
import { 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiCheck,
  FiX
} from 'react-icons/fi';
import styles from './ResetPasswordForm.module.scss';

// ============================================
// PASSWORD STRENGTH
// ============================================

const calculatePasswordStrength = (password) => {
  if (!password) return { level: 'none', score: 0 };

  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(password),
    isLongEnough: password.length >= 8,
  };

  const score = Object.values(checks).filter(Boolean).length * 20;

  let level = 'weak';
  if (score >= 60) level = 'medium';
  if (score >= 80) level = 'strong';
  if (score === 100) level = 'excellent';

  return { level, score };
};

export default function ResetPasswordForm({ token }) {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const toast = useToast();
  const { shouldAnimate } = useMotion();

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // ============================================
  // VALIDATION
  // ============================================

  const validatePassword = (password) => {
    if (!password) return 'Passwort ist erforderlich';
    if (password.length < 8) return 'Mindestens 8 Zeichen';
    const strength = calculatePasswordStrength(password);
    if (strength.level === 'weak') return 'Zu schwach';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Bestätigung erforderlich';
    if (confirmPassword !== password) return 'Passwörter stimmen nicht überein';
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    const passwordError = validatePassword(formData.password);
    const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password);

    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = name === 'password' 
        ? validatePassword(value)
        : validateConfirmPassword(value, name === 'confirmPassword' ? formData.password : value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (apiError) setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = name === 'password'
      ? validatePassword(value)
      : validateConfirmPassword(value, formData.password);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ password: true, confirmPassword: true });

    if (!validateForm()) {
      toast.warning('Bitte füllen Sie alle Felder korrekt aus');
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await resetPassword(token, formData.password);
      setIsSuccess(true);
      toast.success('Passwort erfolgreich geändert!');

      // Redirect to login after delay
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        'Fehler beim Zurücksetzen. Der Link ist möglicherweise abgelaufen.';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // PASSWORD STRENGTH
  // ============================================

  const passwordStrength = calculatePasswordStrength(formData.password);

  const getStrengthLabel = (level) => {
    const labels = {
      none: '',
      weak: 'Schwach',
      medium: 'Mittel',
      strong: 'Stark',
      excellent: 'Exzellent',
    };
    return labels[level];
  };

  // ============================================
  // SUCCESS STATE
  // ============================================

  if (isSuccess) {
    return (
      <motion.div
        className={styles.successContainer}
        initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.successIcon}>
          <FiCheck />
        </div>
        <h2 className={styles.successTitle}>Passwort geändert!</h2>
        <p className={styles.successMessage}>
          Ihr Passwort wurde erfolgreich aktualisiert. Sie werden zur Anmeldung weitergeleitet...
        </p>
      </motion.div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  const hasPasswordError = errors.password && touched.password;
  const hasConfirmError = errors.confirmPassword && touched.confirmPassword;
  const isFormValid = formData.password && formData.confirmPassword && !errors.password && !errors.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className={styles.resetForm} noValidate>
      {/* API Error */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FiAlertCircle className={styles.errorIcon} />
            <span>{apiError}</span>
            <button
              type="button"
              className={styles.errorDismiss}
              onClick={() => setApiError('')}
            >
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Field */}
      <div className={styles.inputGroup}>
        <div className={`${styles.inputWrapper} ${hasPasswordError ? styles.error : ''}`}>
          <FiLock className={styles.inputIcon} />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder=" "
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="new-password"
            autoFocus
          />
          <label htmlFor="password" className={styles.label}>
            Neues Passwort
          </label>
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        <AnimatePresence>
          {hasPasswordError && (
            <motion.span
              className={styles.errorMessage}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {errors.password}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Password Strength */}
      {formData.password && (
        <div className={styles.strengthContainer}>
          <div className={styles.strengthBar}>
            <div
              className={`${styles.strengthFill} ${styles[passwordStrength.level]}`}
              style={{ width: `${passwordStrength.score}%` }}
            />
          </div>
          <span className={`${styles.strengthLabel} ${styles[passwordStrength.level]}`}>
            {getStrengthLabel(passwordStrength.level)}
          </span>
        </div>
      )}

      {/* Confirm Password Field */}
      <div className={styles.inputGroup}>
        <div className={`${styles.inputWrapper} ${hasConfirmError ? styles.error : ''}`}>
          <FiLock className={styles.inputIcon} />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder=" "
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <label htmlFor="confirmPassword" className={styles.label}>
            Passwort bestätigen
          </label>
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
          >
            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        <AnimatePresence>
          {hasConfirmError && (
            <motion.span
              className={styles.errorMessage}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {errors.confirmPassword}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            <span>Speichern...</span>
          </>
        ) : (
          <>
            <span>Passwort speichern</span>
            <FiCheck className={styles.buttonIcon} />
          </>
        )}
      </button>
    </form>
  );
}
