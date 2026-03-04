/**
 * @fileoverview Profile Update Validation Tests (M-10)
 * @description Tests für Längenlimits bei Profil-Updates
 */

const { validateProfileUpdate } = require('../../src/validators/userValidation');

describe('validateProfileUpdate', () => {
  it('should accept valid profile data', () => {
    const { errors, updates } = validateProfileUpdate({
      name: 'Max Mustermann',
      lastName: 'Mustermann',
      phone: '+49 123 456',
      avatar: 'https://example.com/avatar.png',
    });

    expect(errors).toHaveLength(0);
    expect(updates.name).toBe('Max Mustermann');
    expect(updates.lastName).toBe('Mustermann');
    expect(updates.phone).toBe('+49 123 456');
    expect(updates.avatar).toBe('https://example.com/avatar.png');
  });

  // ── Name Limits ─────────────────────────────
  it('should reject name shorter than 3 characters', () => {
    const { errors } = validateProfileUpdate({ name: 'Ab' });
    expect(errors).toContain('Name muss mind. 3 Zeichen haben');
  });

  it('should reject name longer than 50 characters', () => {
    const { errors } = validateProfileUpdate({ name: 'A'.repeat(51) });
    expect(errors).toContain('Name darf max. 50 Zeichen haben');
  });

  it('should accept name with exactly 50 characters', () => {
    const { errors, updates } = validateProfileUpdate({ name: 'A'.repeat(50) });
    expect(errors).toHaveLength(0);
    expect(updates.name).toHaveLength(50);
  });

  // ── LastName Limits ─────────────────────────
  it('should reject lastName longer than 50 characters', () => {
    const { errors } = validateProfileUpdate({ lastName: 'L'.repeat(51) });
    expect(errors).toContain('LastName darf max. 50 Zeichen haben');
  });

  it('should accept empty lastName (sets trimmed)', () => {
    const { errors, updates } = validateProfileUpdate({ lastName: '' });
    expect(errors).toHaveLength(0);
    expect(updates.lastName).toBe('');
  });

  // ── Phone Limits ────────────────────────────
  it('should reject phone longer than 20 characters', () => {
    const { errors } = validateProfileUpdate({ phone: '1'.repeat(21) });
    expect(errors).toContain('Phone darf max. 20 Zeichen haben');
  });

  it('should set phone to null when empty string', () => {
    const { errors, updates } = validateProfileUpdate({ phone: '' });
    expect(errors).toHaveLength(0);
    expect(updates.phone).toBeNull();
  });

  // ── Avatar Limits ───────────────────────────
  it('should reject avatar longer than 2048 characters', () => {
    const { errors } = validateProfileUpdate({ avatar: 'https://x.com/' + 'a'.repeat(2040) });
    expect(errors).toContain('Avatar-URL darf max. 2048 Zeichen haben');
  });

  it('should accept avatar with exactly 2048 characters', () => {
    const url = 'https://example.com/' + 'a'.repeat(2028);
    const { errors, updates } = validateProfileUpdate({ avatar: url });
    expect(errors).toHaveLength(0);
    expect(updates.avatar).toBe(url);
  });

  it('should set avatar to null when null is passed', () => {
    const { errors, updates } = validateProfileUpdate({ avatar: null });
    expect(errors).toHaveLength(0);
    expect(updates.avatar).toBeNull();
  });

  // ── Type Checks ─────────────────────────────
  it('should reject non-string name', () => {
    const { errors } = validateProfileUpdate({ name: 123 });
    expect(errors).toContain('Name muss ein String sein');
  });

  it('should reject non-string avatar', () => {
    const { errors } = validateProfileUpdate({ avatar: 123 });
    expect(errors).toContain('Avatar muss ein String sein');
  });

  // ── No fields ───────────────────────────────
  it('should return empty updates when no fields provided', () => {
    const { errors, updates } = validateProfileUpdate({});
    expect(errors).toHaveLength(0);
    expect(Object.keys(updates)).toHaveLength(0);
  });
});
