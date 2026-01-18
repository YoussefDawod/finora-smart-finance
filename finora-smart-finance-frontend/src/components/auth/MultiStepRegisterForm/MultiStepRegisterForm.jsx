/**
 * @fileoverview Multi-Step Register Form - Premium Redesign
 * @description Modern registration form with step indicator and smooth animations
 * 
 * STEPS:
 * 1. Personal Info (Name, Email)
 * 2. Password (Password, Confirm Password with strength indicator)
 * 3. Terms & Conditions
 * 
 * @module components/auth/MultiStepRegisterForm
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast, useMotion } from '@/hooks';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiCheck,
  FiChevronRight,
  FiChevronLeft,
  FiShield,
  FiAlertCircle
} from 'react-icons/fi';
import styles from './MultiStepRegisterForm.module.scss';

// ============================================
// PASSWORD STRENGTH CALCULATOR
// ============================================

const calculatePasswordStrength = (password) => {
  if (!password) return { level: 'none', score: 0, checks: {} };

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

  return { level, score, checks };
};

export default function MultiStepRegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const { shouldAnimate } = useMotion();

  // ============================================
  // STATE
  // ============================================

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const totalSteps = 3;

  // ============================================
  // VALIDATION
  // ============================================

  const validateName = (name) => {
    if (!name) return 'Name ist erforderlich';
    if (name.length < 2) return 'Mindestens 2 Zeichen';
    if (name.length > 50) return 'Maximal 50 Zeichen';
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'E-Mail ist erforderlich';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ungültige E-Mail';
    return '';
  };

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

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      const nameError = validateName(formData.name);
      const emailError = validateEmail(formData.email);
      if (nameError) newErrors.name = nameError;
      if (emailError) newErrors.email = emailError;
    } else if (step === 1) {
      const passwordError = validatePassword(formData.password);
      const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password);
      if (passwordError) newErrors.password = passwordError;
      if (confirmError) newErrors.confirmPassword = confirmError;
    } else if (step === 2) {
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'Zustimmung erforderlich';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (apiError) setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    let error = '';
    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
      default:
        break;
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    } else {
      toast.warning('Bitte füllen Sie alle Felder korrekt aus');
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      toast.warning('Bitte stimmen Sie den Bedingungen zu');
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await register(formData.email, formData.password, formData.name);
      toast.success('Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail.');
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Registrierung fehlgeschlagen';

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
  // ANIMATION VARIANTS
  // ============================================

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const [slideDirection, setSlideDirection] = useState(0);

  const goToStep = (step) => {
    setSlideDirection(step > currentStep ? 1 : -1);
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  // ============================================
  // STEP CONFIG
  // ============================================

  const steps = [
    { icon: FiUser, label: 'Daten' },
    { icon: FiLock, label: 'Passwort' },
    { icon: FiShield, label: 'Abschluss' },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <form onSubmit={handleSubmit} className={styles.registerForm} noValidate>
      {/* Step Indicator */}
      <div className={styles.stepIndicator}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className={styles.stepItem}>
              <button
                type="button"
                className={`${styles.stepCircle} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                onClick={() => goToStep(index)}
                disabled={index > currentStep + 1}
              >
                {isCompleted ? <FiCheck /> : <Icon />}
              </button>
              <span className={`${styles.stepLabel} ${isCurrent ? styles.active : ''}`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`${styles.stepLine} ${isCompleted ? styles.completed : ''}`} />
              )}
            </div>
          );
        })}
      </div>

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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <div className={styles.stepContent}>
        <AnimatePresence mode="wait" custom={slideDirection}>
          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <motion.div
              key="step1"
              custom={slideDirection}
              variants={shouldAnimate ? slideVariants : {}}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={styles.stepPane}
            >
              <h3 className={styles.stepTitle}>Persönliche Daten</h3>
              <p className={styles.stepDescription}>Erzählen Sie uns etwas über sich.</p>

              {/* Name Field */}
              <div className={styles.inputGroup}>
                <label htmlFor="register-name" className={styles.label}>Vollständiger Name</label>
                <div className={`${styles.inputWrapper} ${errors.name && touched.name ? styles.error : ''}`}>
                  <FiUser className={styles.inputIcon} />
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder="Max Mustermann"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    autoComplete="name"
                    className={styles.input}
                  />
                </div>
                {errors.name && touched.name && (
                  <span className={styles.errorMessage}>{errors.name}</span>
                )}
              </div>

              {/* Email Field */}
              <div className={styles.inputGroup}>
                <label htmlFor="register-email" className={styles.label}>E-Mail-Adresse</label>
                <div className={`${styles.inputWrapper} ${errors.email && touched.email ? styles.error : ''}`}>
                  <FiMail className={styles.inputIcon} />
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="name@beispiel.de"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    autoComplete="email"
                    className={styles.input}
                  />
                </div>
                {errors.email && touched.email && (
                  <span className={styles.errorMessage}>{errors.email}</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Password */}
          {currentStep === 1 && (
            <motion.div
              key="step2"
              custom={slideDirection}
              variants={shouldAnimate ? slideVariants : {}}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={styles.stepPane}
            >
              <h3 className={styles.stepTitle}>Passwort erstellen</h3>
              <p className={styles.stepDescription}>Wählen Sie ein sicheres Passwort.</p>

              {/* Password Field */}
              <div className={styles.inputGroup}>
                <label htmlFor="register-password" className={styles.label}>Passwort</label>
                <div className={`${styles.inputWrapper} ${errors.password && touched.password ? styles.error : ''}`}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Mindestens 8 Zeichen"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className={styles.input}
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
                {errors.password && touched.password && (
                  <span className={styles.errorMessage}>{errors.password}</span>
                )}
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
                <label htmlFor="register-confirm-password" className={styles.label}>Passwort bestätigen</label>
                <div className={`${styles.inputWrapper} ${errors.confirmPassword && touched.confirmPassword ? styles.error : ''}`}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Passwort wiederholen"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className={styles.input}
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
                {errors.confirmPassword && touched.confirmPassword && (
                  <span className={styles.errorMessage}>{errors.confirmPassword}</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Terms */}
          {currentStep === 2 && (
            <motion.div
              key="step3"
              custom={slideDirection}
              variants={shouldAnimate ? slideVariants : {}}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={styles.stepPane}
            >
              <h3 className={styles.stepTitle}>Fast geschafft!</h3>
              <p className={styles.stepDescription}>Akzeptieren Sie unsere Bedingungen.</p>

              <div className={styles.termsBox}>
                <h4>Nutzungsbedingungen</h4>
                <p>
                  Mit der Registrierung akzeptieren Sie unsere Allgemeinen Geschäftsbedingungen
                  und Datenschutzrichtlinien. Sie sind verantwortlich für alle Aktivitäten
                  unter Ihrem Konto.
                </p>
              </div>

              <label className={`${styles.checkbox} ${errors.agreeToTerms ? styles.error : ''}`}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={styles.checkmark}>
                  <FiCheck />
                </span>
                <span className={styles.checkboxText}>
                  Ich akzeptiere die{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    Nutzungsbedingungen
                  </a>
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className={styles.navigation}>
        {currentStep > 0 && (
          <button
            type="button"
            className={styles.prevButton}
            onClick={handlePrev}
            disabled={isLoading}
          >
            <FiChevronLeft />
            <span>Zurück</span>
          </button>
        )}

        {currentStep < totalSteps - 1 ? (
          <button
            type="button"
            className={styles.nextButton}
            onClick={handleNext}
            disabled={isLoading}
          >
            <span>Weiter</span>
            <FiChevronRight />
          </button>
        ) : (
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !formData.agreeToTerms}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                <span>Registrieren...</span>
              </>
            ) : (
              <>
                <span>Konto erstellen</span>
                <FiCheck />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
