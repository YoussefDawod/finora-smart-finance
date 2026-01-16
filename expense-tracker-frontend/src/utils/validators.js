/**
 * Validate email (RFC 5322 simplified)
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
};

/**
 * Validate password strength
 * @param {string} password
 * @returns {{ isValid: boolean, strength: 'weak'|'medium'|'strong' }}
 */
export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return { isValid: false, strength: 'weak' };
  }

  const lengthOk = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [lengthOk, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let strength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score === 3) strength = 'medium';

  return { isValid: score >= 4, strength };
};

/**
 * Validate amount (> 0.01, max 2 decimals)
 * @param {number|string} amount
 * @returns {boolean}
 */
export const validateAmount = (amount) => {
  if (amount === null || amount === undefined || amount === '') return false;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num) || num <= 0.01) return false;
  const decimals = num.toString().split('.')[1];
  if (decimals && decimals.length > 2) return false;
  return true;
};

/**
 * Validate date (Date object or ISO string)
 * @param {Date|string} date
 * @returns {boolean}
 */
export const validateDate = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d instanceof Date && !Number.isNaN(d.getTime());
};

/**
 * Validate required value
 * @param {*} value
 * @returns {boolean}
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

export default {
  validateEmail,
  validatePassword,
  validateAmount,
  validateDate,
  validateRequired,
};
