/**
 * @fileoverview Preferences Validation Tests (L-2, L-4)
 * @description Tests für Timezone-Validierung und Budget-CategoryLimits
 */

const { validatePreferencesInput } = require('../../src/validators/userValidation');

// ============================================
// L-2: Timezone IANA-Validierung
// ============================================
describe('validatePreferencesInput — timezone (L-2)', () => {
  it('should accept valid IANA timezone', () => {
    const { errors, updates } = validatePreferencesInput({ timezone: 'Europe/Berlin' });
    expect(errors).toHaveLength(0);
    expect(updates.timezone).toBe('Europe/Berlin');
  });

  it('should accept UTC timezone', () => {
    const { errors, updates } = validatePreferencesInput({ timezone: 'UTC' });
    expect(errors).toHaveLength(0);
    expect(updates.timezone).toBe('UTC');
  });

  it('should accept America/New_York', () => {
    const { errors, updates } = validatePreferencesInput({ timezone: 'America/New_York' });
    expect(errors).toHaveLength(0);
    expect(updates.timezone).toBe('America/New_York');
  });

  it('should accept Asia/Tokyo', () => {
    const { errors, updates } = validatePreferencesInput({ timezone: 'Asia/Tokyo' });
    expect(errors).toHaveLength(0);
    expect(updates.timezone).toBe('Asia/Tokyo');
  });

  it('should reject arbitrary string as timezone', () => {
    const { errors } = validatePreferencesInput({ timezone: 'foobar123' });
    expect(errors).toContain('Ungültige Timezone. Bitte eine gültige IANA-Timezone verwenden (z.B. Europe/Berlin)');
  });

  it('should reject empty string as timezone', () => {
    const { errors } = validatePreferencesInput({ timezone: '' });
    expect(errors).toContain('Ungültige Timezone. Bitte eine gültige IANA-Timezone verwenden (z.B. Europe/Berlin)');
  });

  it('should reject XSS payload in timezone', () => {
    const { errors } = validatePreferencesInput({ timezone: '<script>alert(1)</script>' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-string timezone', () => {
    const { errors } = validatePreferencesInput({ timezone: 123 });
    expect(errors).toContain('Timezone muss ein String sein');
  });

  it('should not set timezone when invalid', () => {
    const { updates } = validatePreferencesInput({ timezone: 'Not/A/Zone' });
    expect(updates.timezone).toBeUndefined();
  });

  it('should ignore undefined timezone', () => {
    const { errors, updates } = validatePreferencesInput({});
    expect(errors).toHaveLength(0);
    expect(updates.timezone).toBeUndefined();
  });
});

// ============================================
// L-4: Budget CategoryLimits Validierung
// ============================================
describe('validatePreferencesInput — budget.categoryLimits (L-4)', () => {
  it('should accept valid categoryLimits with positive numbers', () => {
    const { errors, updates } = validatePreferencesInput({
      budget: { categoryLimits: { Lebensmittel: 500, Transport: 200 } },
    });
    expect(errors).toHaveLength(0);
    expect(updates.budget.categoryLimits).toEqual({ Lebensmittel: 500, Transport: 200 });
  });

  it('should reject negative values', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: { Lebensmittel: -100 } },
    });
    expect(errors).toContain('budget.categoryLimits.Lebensmittel muss eine positive Zahl sein');
  });

  it('should reject zero values', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: { Transport: 0 } },
    });
    expect(errors).toContain('budget.categoryLimits.Transport muss eine positive Zahl sein');
  });

  it('should reject string values', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: { Miete: 'viel' } },
    });
    expect(errors).toContain('budget.categoryLimits.Miete muss eine positive Zahl sein');
  });

  it('should reject NaN values', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: { Miete: NaN } },
    });
    expect(errors).toContain('budget.categoryLimits.Miete muss eine positive Zahl sein');
  });

  it('should reject Infinity values', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: { Miete: Infinity } },
    });
    expect(errors).toContain('budget.categoryLimits.Miete muss eine positive Zahl sein');
  });

  it('should reject values exceeding 1.000.000', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: { Gehalt: 1000001 } },
    });
    expect(errors).toContain('budget.categoryLimits.Gehalt darf maximal 1.000.000 betragen');
  });

  it('should accept value at exactly 1.000.000', () => {
    const { errors, updates } = validatePreferencesInput({
      budget: { categoryLimits: { Gehalt: 1000000 } },
    });
    expect(errors).toHaveLength(0);
    expect(updates.budget.categoryLimits.Gehalt).toBe(1000000);
  });

  it('should reject more than 30 entries', () => {
    const limits = {};
    for (let i = 0; i < 31; i++) {
      limits[`Kategorie${i}`] = 100;
    }
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: limits },
    });
    expect(errors).toContain('budget.categoryLimits darf maximal 30 Einträge haben');
  });

  it('should accept exactly 30 entries', () => {
    const limits = {};
    for (let i = 0; i < 30; i++) {
      limits[`Kategorie${i}`] = 100;
    }
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: limits },
    });
    expect(errors).toHaveLength(0);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should reject null as categoryLimits', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: null },
    });
    expect(errors).toContain('budget.categoryLimits muss ein Objekt sein');
  });

  it('should reject array as categoryLimits', () => {
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: [100, 200] },
    });
    expect(errors).toContain('budget.categoryLimits muss ein Objekt sein');
  });

  it('should reject keys longer than 50 characters', () => {
    const longKey = 'K'.repeat(51);
    const { errors } = validatePreferencesInput({
      budget: { categoryLimits: { [longKey]: 100 } },
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/Ungültiger Schlüssel/);
  });

  it('should accept empty categoryLimits object', () => {
    const { errors, updates } = validatePreferencesInput({
      budget: { categoryLimits: {} },
    });
    expect(errors).toHaveLength(0);
    expect(updates.budget.categoryLimits).toEqual({});
  });

  it('should skip invalid entries but keep valid ones', () => {
    const { errors, updates } = validatePreferencesInput({
      budget: { categoryLimits: { Lebensmittel: 500, Transport: -10 } },
    });
    expect(errors).toHaveLength(1);
    expect(updates.budget.categoryLimits).toEqual({ Lebensmittel: 500 });
  });
});
