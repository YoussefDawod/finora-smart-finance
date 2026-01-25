/**
 * @fileoverview Auth Validation Tests
 * @description Unit-Tests für die Auth-Validierungsfunktionen
 */

const {
  validateName,
  validatePassword,
  validateEmail,
  validateOptionalEmail,
} = require('../src/validators/authValidation');

describe('Auth Validation', () => {
  describe('validateName', () => {
    it('should accept valid names', () => {
      expect(validateName('Max Mustermann')).toEqual({ valid: true, name: 'Max Mustermann' });
      expect(validateName('Hans-Peter')).toEqual({ valid: true, name: 'Hans-Peter' });
      expect(validateName('Müller')).toEqual({ valid: true, name: 'Müller' });
      expect(validateName('Test123')).toEqual({ valid: true, name: 'Test123' });
    });

    it('should trim whitespace', () => {
      const result = validateName('  Max  ');
      expect(result.valid).toBe(true);
      expect(result.name).toBe('Max');
    });

    it('should reject names shorter than 3 characters', () => {
      const result = validateName('Ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mindestens 3 Zeichen');
    });

    it('should reject names longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      const result = validateName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximal 50 Zeichen');
    });

    it('should reject names with special characters', () => {
      const result = validateName('Test@User!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('nur Buchstaben');
    });

    it('should reject null/undefined/empty', () => {
      expect(validateName(null).valid).toBe(false);
      expect(validateName(undefined).valid).toBe(false);
      expect(validateName('').valid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      expect(validatePassword('SecurePass1!')).toEqual({ valid: true });
      expect(validatePassword('MyP@ssw0rd')).toEqual({ valid: true });
      expect(validatePassword('Test1234!')).toEqual({ valid: true });
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mindestens 8 Zeichen');
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('password1!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Großbuchstaben');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Zahl');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('Password1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Sonderzeichen');
    });

    it('should reject null/undefined/empty', () => {
      expect(validatePassword(null).valid).toBe(false);
      expect(validatePassword(undefined).valid).toBe(false);
      expect(validatePassword('').valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('test@example.com')).toEqual({ valid: true, email: 'test@example.com' });
      expect(validateEmail('user.name@domain.org')).toEqual({ valid: true, email: 'user.name@domain.org' });
    });

    it('should convert to lowercase', () => {
      const result = validateEmail('Test@EXAMPLE.COM');
      expect(result.email).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = validateEmail('  test@example.com  ');
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid').valid).toBe(false);
      expect(validateEmail('missing@tld').valid).toBe(false);
      expect(validateEmail('@nodomain.com').valid).toBe(false);
    });

    it('should reject null/undefined/empty', () => {
      expect(validateEmail(null).valid).toBe(false);
      expect(validateEmail(undefined).valid).toBe(false);
      expect(validateEmail('').valid).toBe(false);
    });
  });

  describe('validateOptionalEmail', () => {
    it('should accept valid emails', () => {
      const result = validateOptionalEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('test@example.com');
    });

    it('should accept null/undefined/empty as valid', () => {
      expect(validateOptionalEmail(null)).toEqual({ valid: true, email: null });
      expect(validateOptionalEmail(undefined)).toEqual({ valid: true, email: null });
      expect(validateOptionalEmail('')).toEqual({ valid: true, email: null });
      expect(validateOptionalEmail('   ')).toEqual({ valid: true, email: null });
    });

    it('should reject invalid emails when provided', () => {
      const result = validateOptionalEmail('invalid-email');
      expect(result.valid).toBe(false);
    });
  });
});
