/**
 * @fileoverview Multi-Step Register Form - Premium Redesign
 * @description Modern registration form with step indicator and smooth animations
 * 
 * STEPS:
 * 1. Personal Info (Name required, Email OPTIONAL)
 * 2. Password (Password, Confirm Password with strength indicator)
 * 3. Terms & Conditions (+ Warning if no email)
 * 
 * @module components/auth/MultiStepRegisterForm
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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
  FiAlertCircle,
  FiAlertTriangle
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
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  // ============================================
  // STATE
  // ============================================

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '', // Optional
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    understoodNoEmailReset: false, // Nur relevant wenn keine Email
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const totalSteps = 3;
  const hasEmail = formData.email.trim().length > 0;

  // Reset understoodNoEmailReset wenn Email eingegeben wird
  useEffect(() => {
    if (hasEmail && formData.understoodNoEmailReset) {
      setFormData(prev => ({ ...prev, understoodNoEmailReset: false }));
    }
  }, [hasEmail, formData.understoodNoEmailReset]);

  // ============================================
  // VALIDATION
  // ============================================

  const validateName = (name) => {
    if (!name) return t('auth.register.validation.nameRequired');
    if (name.length < 3) return t('auth.register.validation.nameMin');
    if (name.length > 50) return t('auth.register.validation.nameMax');
    // Erlaubte Zeichen: Buchstaben (inkl. Umlaute), Zahlen, Leerzeichen, Bindestriche
    if (!/^[a-zA-ZäöüÄÖÜß0-9\s-]+$/.test(name)) {
      return t('auth.register.validation.nameChars');
    }
    return '';
  };

  const validateEmail = (email) => {
    // Email ist optional - nur validieren wenn eingegeben
    if (!email || email.trim() === '') return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.register.validation.emailInvalid');
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return t('auth.register.validation.passwordRequired');
    if (password.length < 8) return t('auth.register.validation.passwordMin');
    if (!/[A-Z]/.test(password)) return t('auth.register.validation.passwordUpper');
    if (!/\d/.test(password)) return t('auth.register.validation.passwordNumber');
    if (!/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(password)) {
      return t('auth.register.validation.passwordSpecial');
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return t('auth.register.validation.confirmRequired');
    if (confirmPassword !== password) return t('auth.register.validation.passwordMismatch');
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
      if (!formData.agreeToTerms) newErrors.agreeToTerms = t('auth.register.validation.termsRequired');
      // Wenn keine Email: Checkbox für "Verstanden" ist erforderlich
      if (!hasEmail && !formData.understoodNoEmailReset) {
        newErrors.understoodNoEmailReset = t('auth.register.validation.noEmailConfirm');
      }
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
      toast.warning(t('auth.register.validation.stepInvalid'));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      toast.warning(t('auth.register.validation.formInvalid'));
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      // Registrierung mit optionaler Email
      await register({
        name: formData.name.trim(),
        password: formData.password,
        email: hasEmail ? formData.email.trim() : undefined,
        understoodNoEmailReset: !hasEmail ? formData.understoodNoEmailReset : undefined,
      });
      
      if (hasEmail) {
        toast.success(t('auth.register.successVerifyEmail'));
        navigate('/verify-email', { state: { email: formData.email } });
      } else {
        toast.success(t('auth.register.successWelcome'));
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t('auth.register.error');

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
      weak: t('auth.register.strength.weak'),
      medium: t('auth.register.strength.medium'),
      strong: t('auth.register.strength.strong'),
      excellent: t('auth.register.strength.excellent'),
    };
    return labels[level] || '';
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
    { icon: FiUser, label: t('auth.register.steps.data') },
    { icon: FiLock, label: t('auth.register.steps.password') },
    { icon: FiShield, label: t('auth.register.steps.finish') },
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
              <div className={styles.stepCore}>
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
              </div>
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
              <h3 className={styles.stepTitle}>{t('auth.register.step1.title')}</h3>
              <p className={styles.stepDescription}>{t('auth.register.step1.description')}</p>

              {/* Name Field */}
              <div className={styles.inputGroup}>
                <label htmlFor="register-name" className={styles.label}>
                  {t('auth.register.step1.usernameLabel')} <span className={styles.required}>*</span>
                </label>
                <div className={`${styles.inputWrapper} ${errors.name && touched.name ? styles.error : ''}`}>
                  <FiUser className={styles.inputIcon} />
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder={t('auth.register.step1.usernamePlaceholder')}
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    autoComplete="username"
                    className={styles.input}
                  />
                </div>
                {errors.name && touched.name && (
                  <span className={styles.errorMessage}>{errors.name}</span>
                )}
                <span className={styles.hint}>{t('auth.register.step1.usernameHint')}</span>
              </div>

              {/* Email Field - OPTIONAL */}
              <div className={styles.inputGroup}>
                <label htmlFor="register-email" className={styles.label}>
                  {t('auth.register.step1.emailLabel')} <span className={styles.optional}>{t('auth.register.step1.optional')}</span>
                </label>
                <div className={`${styles.inputWrapper} ${errors.email && touched.email ? styles.error : ''}`}>
                  <FiMail className={styles.inputIcon} />
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder={t('auth.register.step1.emailPlaceholder')}
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
                <span className={styles.hint}>
                  {t('auth.register.step1.emailHint')}
                </span>
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
              <h3 className={styles.stepTitle}>{t('auth.register.step2.title')}</h3>
              <p className={styles.stepDescription}>{t('auth.register.step2.description')}</p>

              {/* Password Field */}
              <div className={styles.inputGroup}>
                <label htmlFor="register-password" className={styles.label}>{t('auth.register.step2.passwordLabel')}</label>
                <div className={`${styles.inputWrapper} ${errors.password && touched.password ? styles.error : ''}`}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder={t('auth.register.step2.passwordPlaceholder')}
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
                <label htmlFor="register-confirm-password" className={styles.label}>{t('auth.register.step2.confirmLabel')}</label>
                <div className={`${styles.inputWrapper} ${errors.confirmPassword && touched.confirmPassword ? styles.error : ''}`}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder={t('auth.register.step2.confirmPlaceholder')}
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
              <h3 className={styles.stepTitle}>{t('auth.register.step3.title')}</h3>
              <p className={styles.stepDescription}>{t('auth.register.step3.description')}</p>

              {/* Warning wenn keine Email */}
              {!hasEmail && (
                <div className={styles.warningBox}>
                  <FiAlertTriangle className={styles.warningIcon} />
                  <div className={styles.warningContent}>
                    <h4>{t('auth.register.step3.noEmailTitle')}</h4>
                    <p>
                      <Trans i18nKey="auth.register.step3.noEmailText" components={{ strong: <strong /> }} />
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.termsBox}>
                <h4>{t('auth.register.step3.termsTitle')}</h4>
                <p>{t('auth.register.step3.termsText')}</p>
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
                  {t('auth.register.step3.termsAccept')}{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    {t('auth.register.step3.termsLink')}
                  </a>
                </span>
              </label>

              {/* Checkbox für "Verstanden" wenn keine Email */}
              {!hasEmail && (
                <label className={`${styles.checkbox} ${styles.warningCheckbox} ${errors.understoodNoEmailReset ? styles.error : ''}`}>
                  <input
                    type="checkbox"
                    name="understoodNoEmailReset"
                    checked={formData.understoodNoEmailReset}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <span className={styles.checkmark}>
                    <FiCheck />
                  </span>
                  <span className={styles.checkboxText}>
                    {t('auth.register.step3.noEmailConfirm')}
                  </span>
                </label>
              )}
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
            {isRtl ? <FiChevronRight /> : <FiChevronLeft />}
            <span>{t('auth.register.navigation.back')}</span>
          </button>
        )}

        {currentStep < totalSteps - 1 ? (
          <button
            type="button"
            className={styles.nextButton}
            onClick={handleNext}
            disabled={isLoading}
          >
            <span>{t('auth.register.navigation.next')}</span>
            {isRtl ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        ) : (
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !formData.agreeToTerms || (!hasEmail && !formData.understoodNoEmailReset)}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                <span>{t('auth.register.navigation.submitting')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.register.navigation.submit')}</span>
                <FiCheck />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
