/**
 * @fileoverview Multi-Step Register Form
 * @description Registration form split into 3 steps for better UX
 * 
 * STEPS:
 * 1. Personal Info (Name, Email)
 * 2. Password (Password, Confirm Password)
 * 3. Terms & Conditions
 * 
 * @module components/auth/MultiStepRegisterForm
 */

import { useState, useCallback } from 'react';
import { useAuth, useToast } from '@/hooks';
import { MultiStepForm, FloatingLabelInput } from '@/components/common';
import styles from './MultiStepRegisterForm.module.scss';

// Password strength calculator
const calculatePasswordStrength = (password) => {
  if (!password) return { level: 'weak', score: 0 };

  let score = 0;
  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(password),
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

export default function MultiStepRegisterForm() {
  const { register } = useAuth();
  const toast = useToast();

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // VALIDATION
  // ============================================

  const validateEmail = (email) => {
    if (!email) return 'E-Mail ist erforderlich';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Ungültige E-Mail-Adresse';
    return '';
  };

  const validateName = (name) => {
    if (!name) return 'Name ist erforderlich';
    if (name.length < 2) return 'Name muss mindestens 2 Zeichen haben';
    if (name.length > 50) return 'Name darf maximal 50 Zeichen haben';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Passwort ist erforderlich';
    if (password.length < 8) return 'Passwort muss mindestens 8 Zeichen haben';
    const strength = calculatePasswordStrength(password);
    if (strength.level === 'weak') return 'Passwort zu schwach';
    return '';
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) return 'Passwort-Bestätigung ist erforderlich';
    if (confirmPassword !== formData.password) return 'Passwörter stimmen nicht überein';
    return '';
  };

  const validateTerms = (agreed) => {
    if (!agreed) return 'Sie müssen den Bedingungen zustimmen';
    return '';
  };

  // Step validation
  const validateStep = async (step) => {
    const errors = {};

    if (step === 0) {
      // Step 1: Name & Email
      const nameError = validateName(formData.name);
      const emailError = validateEmail(formData.email);
      if (nameError) errors.name = nameError;
      if (emailError) errors.email = emailError;
    } else if (step === 1) {
      // Step 2: Passwords
      const passwordError = validatePassword(formData.password);
      const confirmError = validateConfirmPassword(formData.confirmPassword);
      if (passwordError) errors.password = passwordError;
      if (confirmError) errors.confirmPassword = confirmError;
    } else if (step === 2) {
      // Step 3: Terms
      const termsError = validateTerms(formData.agreeToTerms);
      if (termsError) errors.agreeToTerms = termsError;
    }

    return errors;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = useCallback((e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
      );

      toast.success('Registrierung erfolgreich!');
    } catch (error) {
      toast.error(error.message || 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  }, [formData, register, toast]);

  // ============================================
  // PASSWORD STRENGTH
  // ============================================

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthPercentage = passwordStrength.score;
  const strengthColor = {
    weak: '#ef4444',
    medium: '#f59e0b',
    strong: '#10b981',
  }[passwordStrength.level];

  // ============================================
  // STEP CONTENT
  // ============================================

  const steps = [
    {
      title: 'Persönliche Daten',
      content: (
        <div className={styles.stepContent}>
          <h3>Willkommen!</h3>
          <p>Bitte geben Sie Ihre persönlichen Daten ein.</p>

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="name"
              label="Name"
              type="text"
              placeholder="Ihr Name"
              value={formData.name}
              onChange={handleChange}
              name="name"
              disabled={isLoading}
              autoComplete="name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="email"
              label="E-Mail"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              name="email"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Passwort',
      content: (
        <div className={styles.stepContent}>
          <h3>Passwort-Sicherheit</h3>
          <p>Wählen Sie ein sicheres Passwort.</p>

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="password"
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              name="password"
              disabled={isLoading}
              autoComplete="new-password"
              required
              hint={formData.password ? `Stärke: ${passwordStrength.level === 'weak' ? 'Schwach' : passwordStrength.level === 'medium' ? 'Mittel' : 'Stark'}` : ''}
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

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="confirmPassword"
              label="Passwort bestätigen"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              name="confirmPassword"
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
      ),
    },
    {
      title: 'Bedingungen',
      content: (
        <div className={styles.stepContent}>
          <h3>Bitte akzeptieren Sie</h3>
          <p>Lesen und akzeptieren Sie unsere Bedingungen.</p>

          <div className={styles.termsContainer}>
            <div className={styles.termsBox}>
              <h4>Nutzungsbedingungen</h4>
              <p>
                Mit der Registrierung akzeptieren Sie unsere Allgemeinen Geschäftsbedingungen.
                Sie verpflichten sich, die Plattform nur für legale Zwecke zu nutzen.
                Sie sind verantwortlich für alle Aktivitäten unter Ihrem Account.
              </p>
            </div>

            <div className={styles.checkboxContainer}>
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={styles.checkbox}
                disabled={isLoading}
              />
              <label htmlFor="agreeToTerms" className={styles.checkboxLabel}>
                Ich akzeptiere die{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Nutzungsbedingungen
                </a>
              </label>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <MultiStepForm
      steps={steps}
      onComplete={handleComplete}
      validateStep={validateStep}
      nextLabel="Weiter"
      prevLabel="Zurück"
      completeLabel="Registrieren"
      className={styles.form}
      isLoading={isLoading}
    />
  );
}
