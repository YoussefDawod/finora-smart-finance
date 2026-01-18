/**
 * @fileoverview LoginForm Component - Premium Redesign
 * @description Modern login form with floating labels and smooth animations
 * 
 * FEATURES:
 * - Email and password inputs with floating labels
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
import { useAuth, useToast, useMotion } from '@/hooks';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle,
  FiArrowRight,
  FiCheck,
  FiX
} from 'react-icons/fi';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const { login } = useAuth();
  const toast = useToast();
  const { shouldAnimate } = useMotion();

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ============================================
  // VALIDATION
  // ============================================

  const validateEmail = (email) => {
    if (!email) return 'E-Mail ist erforderlich';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ungültige E-Mail-Adresse';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Passwort ist erforderlich';
    if (password.length < 6) return 'Mindestens 6 Zeichen';
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

  // Get field status
  const getFieldStatus = (field) => {
    if (!touched[field]) return null;
    return errors[field] ? 'error' : 'valid';
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

    // Validate on change if field was touched
    if (touched[name]) {
      const error = name === 'email' 
        ? validateEmail(value) 
        : name === 'password' 
          ? validatePassword(value) 
          : '';
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Clear API error on input
    if (apiError) setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const error = name === 'email' 
      ? validateEmail(value) 
      : name === 'password' 
        ? validatePassword(value) 
        : '';
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all as touched
    setTouched({ email: true, password: true });
    
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
      // AuthContext will handle redirect
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

  const emailStatus = getFieldStatus('email');
  const passwordStatus = getFieldStatus('password');
  const isFormValid = formData.email && formData.password && !errors.email && !errors.password;

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
      {/* API Error Banner */}
      <AnimatePresence>
        {apiError && (
          <motion.div 
            className={styles.errorBanner}
            initial={shouldAnimate ? { opacity: 0, y: -8, height: 0 } : {}}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={shouldAnimate ? { opacity: 0, y: -8, height: 0 } : {}}
            transition={{ duration: 0.2 }}
          >
            <FiAlertCircle className={styles.errorIcon} />
            <span className={styles.errorText}>{apiError}</span>
            <button
              type="button"
              className={styles.errorDismiss}
              onClick={() => setApiError('')}
              aria-label="Fehler schließen"
            >
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Field */}
      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>
          E-Mail-Adresse
        </label>
        <div className={`${styles.inputWrapper} ${emailStatus ? styles[emailStatus] : ''}`}>
          <FiMail className={styles.inputIcon} />
          <input
            id="email"
            name="email"
            type="email"
            className={styles.input}
            placeholder="name@beispiel.de"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="email"
            aria-invalid={emailStatus === 'error'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {emailStatus === 'valid' && (
            <FiCheck className={styles.statusIcon} />
          )}
        </div>
        <AnimatePresence>
          {errors.email && touched.email && (
            <motion.span 
              id="email-error"
              className={styles.errorMessage}
              initial={shouldAnimate ? { opacity: 0, y: -4 } : {}}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, y: -4 } : {}}
            >
              {errors.email}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Password Field */}
      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>
          Passwort
        </label>
        <div className={`${styles.inputWrapper} ${passwordStatus ? styles[passwordStatus] : ''}`}>
          <FiLock className={styles.inputIcon} />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder="Ihr Passwort"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="current-password"
            aria-invalid={passwordStatus === 'error'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            tabIndex={-1}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
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
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span className={styles.checkmark}>
            <FiCheck />
          </span>
          <span className={styles.checkboxLabel}>Angemeldet bleiben</span>
        </label>

        <Link to="/forgot-password" className={styles.forgotLink}>
          Passwort vergessen?
        </Link>
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
            <span>Anmelden...</span>
          </>
        ) : (
          <>
            <span>Anmelden</span>
            <FiArrowRight className={styles.buttonIcon} />
          </>
        )}
      </button>
    </form>
  );
}
