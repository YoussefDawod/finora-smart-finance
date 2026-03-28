/**
 * @fileoverview Transaction Form Schema Tests
 * @description Tests für Zod-Validierungsschema und Initialwerte
 */

import { describe, it, expect } from 'vitest';
import { createTransactionSchema, getInitialFormValues } from '@/validators/transactionFormSchema';

// ============================================================================
// MOCK Translation
// ============================================================================
const t = key => key;

describe('transactionFormSchema', () => {
  const schema = createTransactionSchema(t);

  // ──────────────────────────────────────────────────────────
  // Erfolgreiche Validierung
  // ──────────────────────────────────────────────────────────
  describe('valid data', () => {
    it('accepts valid income transaction', () => {
      const result = schema.safeParse({
        type: 'income',
        amount: '1500',
        category: 'Gehalt',
        description: 'Monatsgehalt',
        date: '2025-06-15',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid expense transaction', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '50.99',
        category: 'Food',
        description: 'Supermarkt Einkauf',
        date: '2025-06-10',
      });
      expect(result.success).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Type Validation
  // ──────────────────────────────────────────────────────────
  describe('type validation', () => {
    it('rejects invalid type', () => {
      const result = schema.safeParse({
        type: 'transfer',
        amount: '100',
        category: 'Test',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty type', () => {
      const result = schema.safeParse({
        type: '',
        amount: '100',
        category: 'Test',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Amount Validation
  // ──────────────────────────────────────────────────────────
  describe('amount validation', () => {
    it('rejects empty amount', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '',
        category: 'Food',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero amount', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '0',
        category: 'Food',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '-10',
        category: 'Food',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric amount', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: 'abc',
        category: 'Food',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Category Validation
  // ──────────────────────────────────────────────────────────
  describe('category validation', () => {
    it('rejects empty category', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: '',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects single-char category', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: 'A',
        description: 'Test desc',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Description Validation
  // ──────────────────────────────────────────────────────────
  describe('description validation', () => {
    it('rejects empty description', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: 'Food',
        description: '',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects description shorter than 3 chars', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: 'Food',
        description: 'ab',
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects description longer than 100 chars', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: 'Food',
        description: 'a'.repeat(101),
        date: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('accepts description at 100 chars', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: 'Food',
        description: 'a'.repeat(100),
        date: '2025-06-01',
      });
      expect(result.success).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Date Validation
  // ──────────────────────────────────────────────────────────
  describe('date validation', () => {
    it('rejects empty date', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: 'Food',
        description: 'Test desc',
        date: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date string', () => {
      const result = schema.safeParse({
        type: 'expense',
        amount: '100',
        category: 'Food',
        description: 'Test desc',
        date: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────────────────
// getInitialFormValues
// ──────────────────────────────────────────────────────────
describe('getInitialFormValues', () => {
  it('returns defaults for new transaction (no initialData)', () => {
    const values = getInitialFormValues();
    expect(values.type).toBe('expense');
    expect(values.amount).toBe('');
    expect(values.category).toBe('');
    expect(values.description).toBe('');
    expect(values.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns defaults for null initialData', () => {
    const values = getInitialFormValues(null);
    expect(values.type).toBe('expense');
  });

  it('populates from initialData for edit mode', () => {
    const initialData = {
      type: 'income',
      amount: 1500,
      category: 'Gehalt',
      description: 'Monatsgehalt',
      date: '2025-06-15T12:00:00Z',
    };
    const values = getInitialFormValues(initialData);
    expect(values.type).toBe('income');
    expect(values.amount).toBe('1500');
    expect(values.category).toBe('Gehalt');
    expect(values.description).toBe('Monatsgehalt');
    expect(values.date).toBe('2025-06-15');
  });

  it('converts amount to string', () => {
    const values = getInitialFormValues({ amount: 42.5 });
    expect(values.amount).toBe('42.5');
  });

  it('formats date to YYYY-MM-DD', () => {
    const values = getInitialFormValues({
      date: '2025-12-31T23:59:59Z',
    });
    expect(values.date).toBe('2025-12-31');
  });
});
