/**
 * @fileoverview Category Translation Tests
 * @description Tests für translateCategory-Funktion
 */

import { describe, it, expect, vi } from 'vitest';
import { translateCategory } from '@/utils/categoryTranslations';

describe('categoryTranslations', () => {
  const mockT = vi.fn((key, opts) => opts?.defaultValue || key);

  // ──────────────────────────────────────────────────────────
  // Bekannte Kategorien
  // ──────────────────────────────────────────────────────────
  describe('known categories', () => {
    it.each([
      ['Gehalt', 'categories.salary'],
      ['Freelance', 'categories.freelance'],
      ['Investitionen', 'categories.investments'],
      ['Geschenk', 'categories.gift'],
      ['Bonus', 'categories.bonus'],
      ['Nebenjob', 'categories.sideJob'],
      ['Cashback', 'categories.cashback'],
      ['Vermietung', 'categories.rental'],
      ['Lebensmittel', 'categories.groceries'],
      ['Transport', 'categories.transport'],
      ['Unterhaltung', 'categories.entertainment'],
      ['Miete', 'categories.rent'],
      ['Versicherung', 'categories.insurance'],
      ['Gesundheit', 'categories.health'],
      ['Bildung', 'categories.education'],
      ['Kleidung', 'categories.clothing'],
      ['Reisen', 'categories.travel'],
      ['Elektronik', 'categories.electronics'],
      ['Restaurant', 'categories.restaurant'],
      ['Sport', 'categories.sports'],
      ['Haushalt', 'categories.household'],
      ['Sonstiges', 'categories.other'],
    ])('translates "%s" using key "%s"', (category, expectedKey) => {
      translateCategory(category, mockT);
      expect(mockT).toHaveBeenCalledWith(expectedKey, { defaultValue: category });
      mockT.mockClear();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Unbekannte Kategorien
  // ──────────────────────────────────────────────────────────
  describe('unknown categories', () => {
    it('returns the category as-is when not in map', () => {
      const result = translateCategory('CustomCategory', mockT);
      expect(result).toBe('CustomCategory');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('returns empty string for empty input', () => {
      const result = translateCategory('', mockT);
      expect(result).toBe('');
    });
  });
});
