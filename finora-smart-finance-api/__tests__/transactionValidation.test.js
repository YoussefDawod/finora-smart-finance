/**
 * @fileoverview Transaction Validation Tests
 * @description Unit-Tests für die Transaction-Validierungsfunktionen
 */

const {
  validateObjectId,
  validateAmount,
  validateCategory,
  validateDescription,
  validateType,
  validateDate,
  validateTags,
  validateNotes,
  ALLOWED_CATEGORIES,
} = require('../src/validators/transactionValidation');

describe('Transaction Validation', () => {
  describe('validateObjectId', () => {
    it('should accept valid MongoDB ObjectIds', () => {
      expect(validateObjectId('507f1f77bcf86cd799439011')).toEqual({ valid: true });
      expect(validateObjectId('5f8d0d55b54764421b7156d8')).toEqual({ valid: true });
    });

    it('should reject invalid ObjectIds', () => {
      expect(validateObjectId('invalid').valid).toBe(false);
      expect(validateObjectId('12345').valid).toBe(false);
      expect(validateObjectId('').valid).toBe(false);
      expect(validateObjectId(null).valid).toBe(false);
    });

    it('should reject ObjectIds with wrong length', () => {
      expect(validateObjectId('507f1f77bcf86cd79943901').valid).toBe(false);  // 23 chars
      expect(validateObjectId('507f1f77bcf86cd7994390111').valid).toBe(false); // 25 chars
    });
  });

  describe('validateAmount', () => {
    it('should accept valid positive amounts', () => {
      expect(validateAmount(100)).toEqual({ valid: true, amount: 100 });
      expect(validateAmount(50.99)).toEqual({ valid: true, amount: 50.99 });
      expect(validateAmount('25.50')).toEqual({ valid: true, amount: 25.50 });
    });

    it('should reject zero or negative amounts', () => {
      expect(validateAmount(0).valid).toBe(false);
      expect(validateAmount(-10).valid).toBe(false);
      expect(validateAmount('-5').valid).toBe(false);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount('invalid').valid).toBe(false);
      expect(validateAmount(NaN).valid).toBe(false);
    });

    it('should require amount by default', () => {
      expect(validateAmount(undefined).valid).toBe(false);
      expect(validateAmount(null).valid).toBe(false);
    });

    it('should accept undefined when not required', () => {
      expect(validateAmount(undefined, false)).toEqual({ valid: true });
      expect(validateAmount(null, false)).toEqual({ valid: true });
    });
  });

  describe('validateCategory', () => {
    it('should accept valid expense categories', () => {
      expect(validateCategory('Lebensmittel')).toEqual({ valid: true, category: 'Lebensmittel' });
      expect(validateCategory('Transport')).toEqual({ valid: true, category: 'Transport' });
      expect(validateCategory('Miete')).toEqual({ valid: true, category: 'Miete' });
    });

    it('should accept valid income categories', () => {
      expect(validateCategory('Gehalt')).toEqual({ valid: true, category: 'Gehalt' });
      expect(validateCategory('Freelance')).toEqual({ valid: true, category: 'Freelance' });
      expect(validateCategory('Investitionen')).toEqual({ valid: true, category: 'Investitionen' });
    });

    it('should reject invalid categories', () => {
      expect(validateCategory('InvalidCategory').valid).toBe(false);
      expect(validateCategory('RandomStuff').valid).toBe(false);
    });

    it('should require category by default', () => {
      expect(validateCategory('').valid).toBe(false);
      expect(validateCategory(null).valid).toBe(false);
      expect(validateCategory(undefined).valid).toBe(false);
    });

    it('should accept undefined when not required', () => {
      expect(validateCategory('', false)).toEqual({ valid: true });
      expect(validateCategory(null, false)).toEqual({ valid: true });
    });

    it('should export all allowed categories', () => {
      expect(ALLOWED_CATEGORIES).toBeDefined();
      expect(ALLOWED_CATEGORIES.length).toBeGreaterThan(10);
      expect(ALLOWED_CATEGORIES).toContain('Lebensmittel');
      expect(ALLOWED_CATEGORIES).toContain('Gehalt');
    });
  });

  describe('validateDescription', () => {
    it('should accept valid descriptions', () => {
      const result = validateDescription('Weekly groceries');
      expect(result.valid).toBe(true);
      expect(result.description).toBe('Weekly groceries');
    });

    it('should trim descriptions', () => {
      const result = validateDescription('  Trimmed  ');
      expect(result.description).toBe('Trimmed');
    });

    it('should require description by default', () => {
      expect(validateDescription('').valid).toBe(false);
      expect(validateDescription('   ').valid).toBe(false);
      expect(validateDescription(null).valid).toBe(false);
    });

    it('should accept undefined when not required', () => {
      expect(validateDescription('', false)).toEqual({ valid: true });
    });
  });

  describe('validateType', () => {
    it('should accept valid types', () => {
      expect(validateType('income')).toEqual({ valid: true, type: 'income' });
      expect(validateType('expense')).toEqual({ valid: true, type: 'expense' });
    });

    it('should reject invalid type values (case-sensitive)', () => {
      // validateType is case-sensitive per implementation
      expect(validateType('INCOME').valid).toBe(false);
      expect(validateType('EXPENSE').valid).toBe(false);
      expect(validateType('Income').valid).toBe(false);
    });

    it('should reject invalid types', () => {
      expect(validateType('invalid').valid).toBe(false);
      expect(validateType('transfer').valid).toBe(false);
    });

    it('should require type by default', () => {
      expect(validateType('').valid).toBe(false);
      expect(validateType(null).valid).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept valid ISO date strings', () => {
      const result = validateDate('2026-01-25');
      expect(result.valid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should accept valid Date objects', () => {
      const result = validateDate(new Date());
      expect(result.valid).toBe(true);
    });

    it('should accept future dates (no future check in implementation)', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = validateDate(futureDate.toISOString());
      expect(result.valid).toBe(true); // No future date restriction in implementation
    });

    it('should reject invalid date formats', () => {
      expect(validateDate('invalid').valid).toBe(false);
    });

    it('should accept undefined when not required', () => {
      expect(validateDate(undefined, false)).toEqual({ valid: true });
    });
  });

  // ============================================
  // validateTags Tests (M-9)
  // ============================================
  describe('validateTags', () => {
    it('should accept valid string tags', () => {
      expect(validateTags(['food', 'rent'])).toEqual(['food', 'rent']);
    });

    it('should return empty array for non-array input', () => {
      expect(validateTags(null)).toEqual([]);
      expect(validateTags(undefined)).toEqual([]);
      expect(validateTags('tag')).toEqual([]);
      expect(validateTags(123)).toEqual([]);
    });

    it('should filter out non-string tags', () => {
      expect(validateTags(['valid', 123, null, 'ok'])).toEqual(['valid', 'ok']);
    });

    it('should filter out empty/whitespace-only tags', () => {
      expect(validateTags(['valid', '', '  ', 'ok'])).toEqual(['valid', 'ok']);
    });

    it('should trim tags', () => {
      expect(validateTags(['  food  ', ' rent '])).toEqual(['food', 'rent']);
    });

    it('should truncate tags to 30 characters', () => {
      const longTag = 'A'.repeat(50);
      const result = validateTags([longTag]);
      expect(result[0]).toHaveLength(30);
    });

    it('should limit to 10 tags maximum', () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      const result = validateTags(manyTags);
      expect(result).toHaveLength(10);
    });
  });

  // ============================================
  // validateNotes Tests (M-9)
  // ============================================
  describe('validateNotes', () => {
    it('should accept valid string notes', () => {
      const errors = [];
      expect(validateNotes('Some note', errors)).toBe('Some note');
      expect(errors).toHaveLength(0);
    });

    it('should return null for empty/null/undefined', () => {
      const errors = [];
      expect(validateNotes(null, errors)).toBeNull();
      expect(validateNotes(undefined, errors)).toBeNull();
      expect(validateNotes('', errors)).toBeNull();
      expect(errors).toHaveLength(0);
    });

    it('should reject non-string notes', () => {
      const errors = [];
      validateNotes(123, errors);
      expect(errors).toContain('Notes muss ein String sein');
    });

    it('should truncate notes to 500 characters', () => {
      const errors = [];
      const longNote = 'X'.repeat(600);
      const result = validateNotes(longNote, errors);
      expect(result).toHaveLength(500);
      expect(errors).toHaveLength(0);
    });

    it('should trim notes', () => {
      const errors = [];
      expect(validateNotes('  hello  ', errors)).toBe('hello');
    });
  });
});
