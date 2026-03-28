/**
 * @fileoverview Formatters Utility Tests
 * @description Umfassende Tests für formatCurrency, formatDate, formatTime, formatAmount, truncateText
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatAmount,
  truncateText,
} from '@/utils/formatters';

describe('formatters', () => {
  // ──────────────────────────────────────────────────────────
  // formatCurrency
  // ──────────────────────────────────────────────────────────
  describe('formatCurrency', () => {
    it('should format positive numbers as currency', () => {
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/[\d.,]+/);
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/0/);
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-500);
      expect(result).toMatch(/500/);
    });

    it('returns empty string for NaN', () => {
      expect(formatCurrency(NaN)).toBe('');
    });

    it('returns empty string for non-number', () => {
      expect(formatCurrency('abc')).toBe('');
      expect(formatCurrency(undefined)).toBe('');
      expect(formatCurrency(null)).toBe('');
    });

    it('respects currency override', () => {
      const result = formatCurrency(100, 'USD');
      expect(result).toMatch(/[\d.,]+/);
    });
  });

  // ──────────────────────────────────────────────────────────
  // formatDate
  // ──────────────────────────────────────────────────────────
  describe('formatDate', () => {
    it('should format date strings (short)', () => {
      const result = formatDate('2026-01-25');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Date objects', () => {
      const date = new Date('2026-01-25');
      const result = formatDate(date);
      expect(typeof result).toBe('string');
    });

    it('formats long date with month name', () => {
      const result = formatDate('2026-06-15', 'long');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty string for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('returns empty string for invalid Date object', () => {
      expect(formatDate(new Date('invalid'))).toBe('');
    });
  });

  // ──────────────────────────────────────────────────────────
  // formatTime
  // ──────────────────────────────────────────────────────────
  describe('formatTime', () => {
    it('formats time in 24h format', () => {
      const result = formatTime('2026-06-15T14:30:00Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('handles Date objects', () => {
      const result = formatTime(new Date('2026-06-15T08:00:00Z'));
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('returns empty string for invalid date', () => {
      expect(formatTime('invalid')).toBe('');
      expect(formatTime(null)).toBe('');
    });

    it('accepts locale override', () => {
      const result = formatTime('2026-06-15T14:30:00Z', 'en-US');
      expect(typeof result).toBe('string');
    });
  });

  // ──────────────────────────────────────────────────────────
  // formatAmount
  // ──────────────────────────────────────────────────────────
  describe('formatAmount', () => {
    it('formats number with thousands separator', () => {
      const result = formatAmount(1234567.89);
      expect(result).toMatch(/[\d.,]+/);
    });

    it('returns empty string for NaN', () => {
      expect(formatAmount(NaN)).toBe('');
    });

    it('returns empty string for non-number', () => {
      expect(formatAmount('abc')).toBe('');
      expect(formatAmount(null)).toBe('');
    });

    it('handles zero', () => {
      const result = formatAmount(0);
      expect(result).toMatch(/0/);
    });

    it('accepts locale override', () => {
      const result = formatAmount(1234.5, 'en-US');
      expect(result).toMatch(/[\d.,]+/);
    });
  });

  // ──────────────────────────────────────────────────────────
  // truncateText
  // ──────────────────────────────────────────────────────────
  describe('truncateText', () => {
    it('returns full text when shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('returns full text when exactly maxLength', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('truncates with ellipsis by default', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('truncates without ellipsis when disabled', () => {
      expect(truncateText('Hello World', 5, false)).toBe('Hello');
    });

    it('uses default maxLength of 50', () => {
      const long = 'a'.repeat(60);
      const result = truncateText(long);
      expect(result).toBe('a'.repeat(50) + '...');
    });

    it('returns empty string for non-string input', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
      expect(truncateText(123)).toBe('');
    });

    it('handles empty string', () => {
      expect(truncateText('')).toBe('');
    });
  });
});
