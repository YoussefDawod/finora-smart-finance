/**
 * @fileoverview LoginForm Component - Premium Redesign
 * @description Modern login form with name-based authentication
 *
 * FEATURES:
 * - Username and password inputs
 * - Remember me checkbox
 * - Form validation with real-time feedback
 * - Loading state with spinner
 * - Error display with dismiss
 * - Forgot password link
 *
 * @module components/auth/LoginForm
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast, useMotion } from '@/hooks';
import { parseApiError } from '@/api/errorHandler';
import { FiUser, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import Checkbox from '@/components/common/Checkbox/Checkbox';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import PasswordInput from '../PasswordInput/PasswordInput';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const { login } = useAuth();
  const toast = useToast();
  const { shouldAnimate } = useMotion();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // ============================================
  // VALIDATION
  // ============================================

  const validateName = name => {
    if (!name) return t('auth.login.validation.usernameRequired');
    if (name.length < 3) return t('auth.login.validation.usernameMin');
    return '';
  };

  const validatePassword = password => {
    if (!password) return t('auth.login.validation.passwordRequired');
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    const nameError = validateName(formData.name);
    const passwordError = validatePassword(formData.password);

    if (nameError) newErrors.name = nameError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get field status
  const getFieldStatus = field => {
    if (!touched[field]) return null;
    return errors[field] ? 'error' : 'valid';
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate on change if field was touched
    if (touched[name]) {
      const error =
        name === 'name' ? validateName(value) : name === 'password' ? validatePassword(value) : '';
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    // Clear API error on input
    if (apiError) setApiError('');
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error =
      name === 'name' ? validateName(value) : name === 'password' ? validatePassword(value) : '';
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ name: true, password: true });

    // Validate form
    if (!validateForm()) {
      toast.warning(t('auth.login.validation.formInvalid'));
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await login(formData.name, formData.password, formData.rememberMe);
      toast.success(t('auth.login.success'));
      // No manual navigation here - AuthContext updates trigger PublicRoute to redirect
    } catch (error) {
      // L-11: Use sanitized i18n messages instead of raw server errors
      const { message } = parseApiError(error);
      setApiError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const nameStatus = getFieldStatus('name');
  const passwordStatus = getFieldStatus('password');
  const isFormValid = formData.name && formData.password && !errors.name && !errors.password;

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
      {/* API Error Banner */}
      <ErrorBanner
        error={apiError}
        onDismiss={() => setApiError('')}
        dismissAriaLabel={t('auth.login.dismissError')}
      />

      {/* Username Field */}
      <div className={styles.inputGroup}>
        <label htmlFor="name" className={styles.label}>
          {t('auth.login.username')}
        </label>
        <div className={`${styles.inputWrapper} ${nameStatus ? styles[nameStatus] : ''}`}>
          <FiUser className={styles.inputIcon} />
          <input
            id="name"
            name="name"
            type="text"
            className={styles.input}
            placeholder={t('auth.login.usernamePlaceholder')}
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="username"
            aria-invalid={nameStatus === 'error'}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {nameStatus === 'valid' && <FiCheck className={styles.statusIcon} />}
        </div>
        <AnimatePresence>
          {errors.name && touched.name && (
            <motion.span
              id="name-error"
              className={styles.errorMessage}
              initial={shouldAnimate ? { opacity: 0, y: -4 } : {}}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, y: -4 } : {}}
            >
              {errors.name}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Password Field */}
      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>
          {t('auth.login.password')}
        </label>
        <PasswordInput
          formStyles={styles}
          wrapperErrorClass={passwordStatus ? styles[passwordStatus] : ''}
          id="password"
          name="password"
          placeholder={t('auth.login.passwordPlaceholder')}
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          autoComplete="current-password"
          aria-invalid={passwordStatus === 'error'}
          aria-describedby={errors.password ? 'password-error' : undefined}
          showPasswordLabel={t('auth.login.showPassword')}
          hidePasswordLabel={t('auth.login.hidePassword')}
        />
        <AnimatePresence>
          {errors.password && touched.password && (
            <motion.span
              id="password-error"
              className={styles.errorMessage}
              initial={shouldAnimate ? { opacity: 0, y: -4 } : {}}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, y: -4 } : {}}
            >
              {errors.password}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className={styles.optionsRow}>
        <Checkbox
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleChange}
          disabled={isLoading}
          label={t('auth.login.rememberMe')}
        />

        <Link to="/forgot-password" className={styles.forgotLink}>
          {t('auth.login.forgot')}
        </Link>
      </div>

      {/* Submit Button */}
      <button type="submit" className={styles.submitButton} disabled={isLoading || !isFormValid}>
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            <span>{t('auth.login.loading')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.login.submit')}</span>
            {isRtl ? (
              <FiArrowLeft className={styles.buttonIcon} />
            ) : (
              <FiArrowRight className={styles.buttonIcon} />
            )}
          </>
        )}
      </button>
    </form>
  );
}
