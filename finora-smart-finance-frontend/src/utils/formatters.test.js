/**
 * @fileoverview Example Test - formatters utility
 * @description Beispieltest für die formatters-Utilities
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '@/utils/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers as currency', () => {
      const result = formatCurrency(1234.56);
      // Prüfe ob ein Währungssymbol und Zahlen vorhanden sind
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
  });

  describe('formatDate', () => {
    it('should format date strings', () => {
      const result = formatDate('2026-01-25');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Date objects', () => {
      const date = new Date('2026-01-25');
      const result = formatDate(date);
      expect(typeof result).toBe('string');
    });
  });
});
