/**
 * @fileoverview Centralized Password Validation
 * @description Single source of truth for password rules and strength calculation.
 *
 * Used by: MultiStepRegisterForm, ResetPasswordForm, useProfile hook
 *
 * @module validators/passwordValidation
 */

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Calculate password strength based on character class checks.
 * @param {string} password
 * @returns {{ level: 'none'|'weak'|'medium'|'strong'|'excellent', score: number, checks: object }}
 */
export function calculatePasswordStrength(password) {
  if (!password) return { level: 'none', score: 0, checks: {} };

  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(password),
    isLongEnough: password.length >= PASSWORD_MIN_LENGTH,
  };

  const score = Object.values(checks).filter(Boolean).length * 20;

  let level = 'weak';
  if (score >= 60) level = 'medium';
  if (score >= 80) level = 'strong';
  if (score === 100) level = 'excellent';

  return { level, score, checks };
}

/**
 * Validate password strength.
 * Returns an error key string (for caller to translate) or '' if valid.
 *
 * Error keys: 'required' | 'tooShort' | 'noUppercase' | 'noNumber' | 'noSpecial' | ''
 *
 * @param {string} password
 * @returns {string} Error key or empty string
 */
export function validatePassword(password) {
  if (!password) return 'required';
  if (password.length < PASSWORD_MIN_LENGTH) return 'tooShort';
  if (!/[A-Z]/.test(password)) return 'noUppercase';
  if (!/\d/.test(password)) return 'noNumber';
  if (!/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(password)) return 'noSpecial';
  return '';
}

/**
 * Validate that password and confirm-password match.
 * Returns an error key string or '' if valid.
 *
 * Error keys: 'confirmRequired' | 'mismatch' | ''
 *
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {string} Error key or empty string
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) return 'confirmRequired';
  if (password !== confirmPassword) return 'mismatch';
  return '';
}
