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
import { useTranslation } from 'react-i18next';
import { useAuth, useToast, useMotion } from '@/hooks';
import { 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiCheck,
  FiX
} from 'react-icons/fi';
import { calculatePasswordStrength, validatePassword as _validatePassword, validatePasswordMatch as _validatePasswordMatch } from '@/validators';
import styles from './ResetPasswordForm.module.scss';

export default function ResetPasswordForm({ token }) {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const toast = useToast();
  const { shouldAnimate } = useMotion();
  const { t } = useTranslation();

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

  const passwordErrorMap = {
    required: t('auth.reset.validation.passwordRequired'),
    tooShort: t('auth.reset.validation.passwordMin'),
    noUppercase: t('auth.reset.validation.passwordWeak'),
    noNumber: t('auth.reset.validation.passwordWeak'),
    noSpecial: t('auth.reset.validation.passwordWeak'),
  };

  const validatePassword = (password) => {
    const key = _validatePassword(password);
    return key ? (passwordErrorMap[key] || key) : '';
  };

  const confirmErrorMap = {
    confirmRequired: t('auth.reset.validation.confirmRequired'),
    mismatch: t('auth.reset.validation.passwordMismatch'),
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    const key = _validatePasswordMatch(password, confirmPassword);
    return key ? (confirmErrorMap[key] || key) : '';
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
      toast.warning(t('auth.reset.validation.formInvalid'));
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await resetPassword(token, formData.password);
      setIsSuccess(true);
      toast.success(t('auth.reset.successToast'));

      // Redirect to login after delay
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        t('auth.reset.errorToast');
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
      weak: t('auth.reset.strength.weak'),
      medium: t('auth.reset.strength.medium'),
      strong: t('auth.reset.strength.strong'),
      excellent: t('auth.reset.strength.excellent'),
    };
    return labels[level] || '';
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
        <h2 className={styles.successTitle}>{t('auth.reset.successTitle')}</h2>
        <p className={styles.successMessage}>
          {t('auth.reset.successMessage')}
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
        <label htmlFor="password" className={styles.label}>
          {t('auth.reset.passwordLabel')}
        </label>
        <div className={`${styles.inputWrapper} ${hasPasswordError ? styles.error : ''}`}>
          <FiLock className={styles.inputIcon} />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder={t('auth.reset.passwordPlaceholder')}
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="new-password"
            autoFocus
          />
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
        <label htmlFor="confirmPassword" className={styles.label}>
          {t('auth.reset.confirmLabel')}
        </label>
        <div className={`${styles.inputWrapper} ${hasConfirmError ? styles.error : ''}`}>
          <FiLock className={styles.inputIcon} />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder={t('auth.reset.confirmPlaceholder')}
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="new-password"
          />
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
            <span>{t('auth.reset.saving')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.reset.submit')}</span>
            <FiCheck className={styles.buttonIcon} />
          </>
        )}
      </button>
    </form>
  );
}
