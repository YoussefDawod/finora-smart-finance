/**
 * @fileoverview Password Validation Tests
 * @description Tests für Passwort-Stärke-Berechnung und Validierung
 */

import { describe, it, expect } from 'vitest';
import {
  PASSWORD_MIN_LENGTH,
  calculatePasswordStrength,
  validatePassword,
  validatePasswordMatch,
} from '@/validators/passwordValidation';

describe('passwordValidation', () => {
  // ──────────────────────────────────────────────────────────
  // PASSWORD_MIN_LENGTH
  // ──────────────────────────────────────────────────────────
  describe('PASSWORD_MIN_LENGTH', () => {
    it('should be 8', () => {
      expect(PASSWORD_MIN_LENGTH).toBe(8);
    });
  });

  // ──────────────────────────────────────────────────────────
  // calculatePasswordStrength
  // ──────────────────────────────────────────────────────────
  describe('calculatePasswordStrength', () => {
    it('returns none for empty/falsy password', () => {
      expect(calculatePasswordStrength('')).toEqual({
        level: 'none',
        score: 0,
        checks: {},
      });
      expect(calculatePasswordStrength(null).level).toBe('none');
      expect(calculatePasswordStrength(undefined).level).toBe('none');
    });

    it('returns weak for only lowercase', () => {
      const result = calculatePasswordStrength('abc');
      expect(result.level).toBe('weak');
      expect(result.score).toBe(20);
      expect(result.checks.hasLower).toBe(true);
      expect(result.checks.hasUpper).toBe(false);
      expect(result.checks.hasNumber).toBe(false);
      expect(result.checks.hasSpecial).toBe(false);
      expect(result.checks.isLongEnough).toBe(false);
    });

    it('returns weak for lowercase + uppercase (2 checks)', () => {
      const result = calculatePasswordStrength('abcDef');
      expect(result.level).toBe('weak');
      expect(result.score).toBe(40);
    });

    it('returns medium for 3 checks', () => {
      const result = calculatePasswordStrength('abcDef1');
      expect(result.level).toBe('medium');
      expect(result.score).toBe(60);
    });

    it('returns strong for 4 checks', () => {
      const result = calculatePasswordStrength('abcDe1!');
      expect(result.level).toBe('strong');
      expect(result.score).toBe(80);
    });

    it('returns excellent for all 5 checks', () => {
      const result = calculatePasswordStrength('abcDef12!@');
      expect(result.level).toBe('excellent');
      expect(result.score).toBe(100);
      expect(result.checks).toEqual({
        hasLower: true,
        hasUpper: true,
        hasNumber: true,
        hasSpecial: true,
        isLongEnough: true,
      });
    });

    it('detects various special characters', () => {
      const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];
      for (const char of specials) {
        const result = calculatePasswordStrength(char);
        expect(result.checks.hasSpecial).toBe(true);
      }
    });

    it('isLongEnough requires exactly PASSWORD_MIN_LENGTH chars', () => {
      const short = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
      const exact = 'a'.repeat(PASSWORD_MIN_LENGTH);
      expect(calculatePasswordStrength(short).checks.isLongEnough).toBe(false);
      expect(calculatePasswordStrength(exact).checks.isLongEnough).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // validatePassword
  // ──────────────────────────────────────────────────────────
  describe('validatePassword', () => {
    it('returns "required" for empty', () => {
      expect(validatePassword('')).toBe('required');
    });

    it('returns "required" for falsy', () => {
      expect(validatePassword(null)).toBe('required');
      expect(validatePassword(undefined)).toBe('required');
    });

    it('returns "tooShort" for short password', () => {
      expect(validatePassword('Ab1!')).toBe('tooShort');
    });

    it('returns "tooLong" for password exceeding 128 characters', () => {
      const longPassword = 'A' + 'a'.repeat(120) + '1234567!';
      expect(longPassword.length).toBeGreaterThan(128);
      expect(validatePassword(longPassword)).toBe('tooLong');
    });

    it('returns "noUppercase" when missing uppercase', () => {
      expect(validatePassword('abcdefg1!')).toBe('noUppercase');
    });

    it('returns "noLowercase" when missing lowercase', () => {
      expect(validatePassword('ABCDEFG1!')).toBe('noLowercase');
    });

    it('returns "noNumber" when missing digit', () => {
      expect(validatePassword('Abcdefgh!')).toBe('noNumber');
    });

    it('returns "noSpecial" when missing special char', () => {
      expect(validatePassword('Abcdefg1')).toBe('noSpecial');
    });

    it('returns empty string for valid password', () => {
      expect(validatePassword('Abcdefg1!')).toBe('');
    });

    it('validates in priority order: required → tooShort → tooLong → noUppercase → noLowercase → noNumber → noSpecial', () => {
      // Each validation rule has priority
      expect(validatePassword('')).toBe('required');
      expect(validatePassword('a')).toBe('tooShort');
      const tooLong = 'a'.repeat(129);
      expect(validatePassword(tooLong)).toBe('tooLong');
      expect(validatePassword('abcdefgh')).toBe('noUppercase');
      expect(validatePassword('ABCDEFGH')).toBe('noLowercase');
      expect(validatePassword('Abcdefgh')).toBe('noNumber');
      expect(validatePassword('Abcdefg1')).toBe('noSpecial');
      expect(validatePassword('Abcdefg1!')).toBe('');
    });
  });

  // ──────────────────────────────────────────────────────────
  // validatePasswordMatch
  // ──────────────────────────────────────────────────────────
  describe('validatePasswordMatch', () => {
    it('returns "confirmRequired" when confirm is empty', () => {
      expect(validatePasswordMatch('Password1!', '')).toBe('confirmRequired');
    });

    it('returns "confirmRequired" for falsy confirm', () => {
      expect(validatePasswordMatch('Password1!', null)).toBe('confirmRequired');
      expect(validatePasswordMatch('Password1!', undefined)).toBe('confirmRequired');
    });

    it('returns "mismatch" when passwords differ', () => {
      expect(validatePasswordMatch('Password1!', 'Password2!')).toBe('mismatch');
    });

    it('returns empty string when passwords match', () => {
      expect(validatePasswordMatch('Password1!', 'Password1!')).toBe('');
    });
  });
});
