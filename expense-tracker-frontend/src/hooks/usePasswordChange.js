import { useState, useCallback } from 'react';
import { authService } from '../api/authService';
import useToast from './useToast';

/**
 * Password Strength Levels
 */
const PasswordStrengthLevels = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
};

/**
 * Password Requirements
 */
const PASSWORD_REQUIREMENTS = {
  LENGTH: 8,
  HAS_UPPERCASE: /[A-Z]/,
  HAS_LOWERCASE: /[a-z]/,
  HAS_NUMBER: /\d/,
  HAS_SPECIAL: /[!@#$%^&*()_\-+=[\]{};:'",.?\\|`~]/,
};

/**
 * usePasswordChange - Hook for password change functionality
 * 
 * @returns {Object} Password change state and handlers
 * @returns {Object} form - Form state with currentPassword, newPassword, confirmPassword
 * @returns {boolean} loading - Loading state during API request
 * @returns {string|null} error - Error message
 * @returns {boolean} success - Success state
 * @returns {string} passwordStrength - Password strength level
 * @returns {Function} handlePasswordChange - Form input handler
 * @returns {Function} handleChangePassword - Submit handler
 * @returns {Function} resetForm - Reset form to initial state
 * @returns {Function} clearError - Clear error message
 * @returns {Object} requirements - Password requirements status
 */
const usePasswordChange = () => {
  const { success: showSuccess, error: showError } = useToast();

  // Form State
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(PasswordStrengthLevels.WEAK);

  // Password Visibility State
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /**
   * Validate current password format
   * @param {string} password
   * @returns {boolean}
   */
  const validateCurrentPassword = useCallback((password) => {
    return password.length > 0;
  }, []);

  /**
   * Check password requirements
   * @param {string} password
   * @returns {Object} { isValid: boolean, requirements: { ... }, failedRequirements: string[] }
   */
  const validateNewPassword = useCallback((password) => {
    const requirements = {
      length: password.length >= PASSWORD_REQUIREMENTS.LENGTH,
      uppercase: PASSWORD_REQUIREMENTS.HAS_UPPERCASE.test(password),
      lowercase: PASSWORD_REQUIREMENTS.HAS_LOWERCASE.test(password),
      number: PASSWORD_REQUIREMENTS.HAS_NUMBER.test(password),
      special: PASSWORD_REQUIREMENTS.HAS_SPECIAL.test(password),
    };

    const isValid = Object.values(requirements).every((req) => req === true);

    const failedRequirements = [];
    if (!requirements.length) failedRequirements.push('Mindestens 8 Zeichen');
    if (!requirements.uppercase) failedRequirements.push('Großbuchstabe');
    if (!requirements.lowercase) failedRequirements.push('Kleinbuchstabe');
    if (!requirements.number) failedRequirements.push('Ziffer');
    if (!requirements.special) failedRequirements.push('Sonderzeichen');

    return { isValid, requirements, failedRequirements };
  }, []);

  /**
   * Validate that new and confirm passwords match
   * @param {string} newPassword
   * @param {string} confirmPassword
   * @returns {boolean}
   */
  const validatePasswordMatch = useCallback((newPassword, confirmPassword) => {
    if (!newPassword || !confirmPassword) return false;
    return newPassword === confirmPassword;
  }, []);

  /**
   * Calculate password strength score (0-5)
   * @param {string} password
   * @returns {string} strength level
   */
  const calculatePasswordStrength = useCallback((password) => {
    if (!password) return PasswordStrengthLevels.WEAK;

    const { requirements } = validateNewPassword(password);
    const score = Object.values(requirements).filter(Boolean).length;

    if (score <= 2) return PasswordStrengthLevels.WEAK;
    if (score <= 3) return PasswordStrengthLevels.MEDIUM;
    return PasswordStrengthLevels.STRONG;
  }, [validateNewPassword]);

  /**
   * Handle form input changes
   * @param {Event} e
   */
  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);

    // Update password strength in real-time
    if (name === 'newPassword') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  }, [calculatePasswordStrength]);

  /**
   * Toggle password visibility
   * @param {string} field - 'current', 'new', or 'confirm'
   */
  const togglePasswordVisibility = useCallback((field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordStrength(PasswordStrengthLevels.WEAK);
    setError(null);
    setSuccess(false);
    setShowPassword({
      current: false,
      new: false,
      confirm: false,
    });
  }, []);

  /**
   * Handle password change submission
   * @param {Event} e
   */
  const handleChangePassword = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      // Validate current password
      if (!validateCurrentPassword(form.currentPassword)) {
        setError('Aktuelles Passwort erforderlich');
        return;
      }

      // Validate new password
      const newPasswordValidation = validateNewPassword(form.newPassword);
      if (!newPasswordValidation.isValid) {
        setError(
          `Neues Passwort erfüllt nicht die Anforderungen: ${newPasswordValidation.failedRequirements.join(', ')}`
        );
        return;
      }

      // Validate password match
      if (!validatePasswordMatch(form.newPassword, form.confirmPassword)) {
        setError('Passwörter stimmen nicht überein');
        return;
      }

      // API Call
      setLoading(true);
      try {
        const response = await authService.changePassword(
          form.currentPassword,
          form.newPassword
        );

        if (response.success) {
          setSuccess(true);
          showSuccess('Passwort erfolgreich geändert!');
          resetForm();
          
          // Auto-clear success after 5 seconds
          setTimeout(() => setSuccess(false), 5000);
        } else {
          const errorMsg = response.message || 'Passwortänderung fehlgeschlagen';
          setError(errorMsg);
          showError(errorMsg);
        }
      } catch (err) {
        let errorMsg = 'Fehler beim Ändern des Passworts';

        if (err.response?.status === 400) {
          errorMsg = err.response.data?.message || 'Aktuelles Passwort ist falsch';
        } else if (err.response?.status === 401) {
          errorMsg = 'Authentifizierung erforderlich. Bitte melden Sie sich erneut an.';
        } else if (err.message) {
          errorMsg = err.message;
        }

        setError(errorMsg);
        showError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [form, validateCurrentPassword, validateNewPassword, validatePasswordMatch, showSuccess, showError, resetForm]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get password requirements status
  const { requirements, failedRequirements } = validateNewPassword(form.newPassword);

  return {
    // State
    form,
    loading,
    error,
    success,
    passwordStrength,
    showPassword,
    requirements,
    failedRequirements,

    // Handlers
    handlePasswordChange,
    handleChangePassword,
    togglePasswordVisibility,
    resetForm,
    clearError,

    // Validation functions
    validateCurrentPassword,
    validateNewPassword,
    validatePasswordMatch,
    calculatePasswordStrength,

    // Constants
    PasswordStrengthLevels,
    PASSWORD_REQUIREMENTS,
  };
};

export default usePasswordChange;
