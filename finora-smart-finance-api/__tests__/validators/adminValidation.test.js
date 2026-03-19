/**
 * @fileoverview adminValidation Unit Tests
 * @description Tests für validateCreateUser – emailLanguage Validierung
 */

const { validateCreateUser } = require('../../src/validators/adminValidation');

describe('validateCreateUser', () => {
  const validBase = {
    name: 'Test User',
    password: 'SecurePass123!',
  };

  // ── emailLanguage Validierung ───────────────
  describe('emailLanguage', () => {
    it('setzt Default "de" wenn emailLanguage nicht angegeben', () => {
      const { errors, data } = validateCreateUser(validBase);
      expect(errors).toHaveLength(0);
      expect(data.emailLanguage).toBe('de');
    });

    it('akzeptiert "de"', () => {
      const { errors, data } = validateCreateUser({ ...validBase, emailLanguage: 'de' });
      expect(errors).toHaveLength(0);
      expect(data.emailLanguage).toBe('de');
    });

    it('akzeptiert "en"', () => {
      const { errors, data } = validateCreateUser({ ...validBase, emailLanguage: 'en' });
      expect(errors).toHaveLength(0);
      expect(data.emailLanguage).toBe('en');
    });

    it('akzeptiert "ar"', () => {
      const { errors, data } = validateCreateUser({ ...validBase, emailLanguage: 'ar' });
      expect(errors).toHaveLength(0);
      expect(data.emailLanguage).toBe('ar');
    });

    it('akzeptiert "ka"', () => {
      const { errors, data } = validateCreateUser({ ...validBase, emailLanguage: 'ka' });
      expect(errors).toHaveLength(0);
      expect(data.emailLanguage).toBe('ka');
    });

    it('lehnt ungültige Sprache ab', () => {
      const { errors } = validateCreateUser({ ...validBase, emailLanguage: 'fr' });
      expect(errors).toContain('emailLanguage muss "de", "en", "ar" oder "ka" sein');
    });

    it('lehnt leeren String ab', () => {
      const { errors } = validateCreateUser({ ...validBase, emailLanguage: '' });
      expect(errors).toContain('emailLanguage muss "de", "en", "ar" oder "ka" sein');
    });

    it('lehnt Zahl ab', () => {
      const { errors } = validateCreateUser({ ...validBase, emailLanguage: 42 });
      expect(errors).toContain('emailLanguage muss "de", "en", "ar" oder "ka" sein');
    });

    it('lehnt null ab', () => {
      const { errors } = validateCreateUser({ ...validBase, emailLanguage: null });
      expect(errors).toContain('emailLanguage muss "de", "en", "ar" oder "ka" sein');
    });

    it('setzt emailLanguage nicht in data bei ungültigem Wert', () => {
      const { data } = validateCreateUser({ ...validBase, emailLanguage: 'invalid' });
      expect(data.emailLanguage).toBeUndefined();
    });

    it('funktioniert zusammen mit anderen optionalen Feldern', () => {
      const { errors, data } = validateCreateUser({
        ...validBase,
        email: 'test@example.com',
        role: 'admin',
        isVerified: true,
        emailLanguage: 'en',
      });
      expect(errors).toHaveLength(0);
      expect(data.emailLanguage).toBe('en');
      expect(data.email).toBe('test@example.com');
      expect(data.role).toBe('admin');
    });
  });

  // ── Existierende Felder weiterhin gültig ────
  describe('existing fields still work', () => {
    it('validiert name korrekt', () => {
      const { errors } = validateCreateUser({ password: 'SecurePass123!' });
      expect(errors).toContain('Feld name ist erforderlich');
    });

    it('validiert zu kurzen Namen', () => {
      const { errors } = validateCreateUser({ name: 'AB', password: 'SecurePass123!' });
      expect(errors).toContain('name muss zwischen 3 und 50 Zeichen lang sein');
    });

    it('validiert email Format', () => {
      const { errors } = validateCreateUser({ ...validBase, email: 'invalid-email' });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('akzeptiert gültige Kombination', () => {
      const { errors, data } = validateCreateUser({
        name: 'Max Mustermann',
        password: 'SecurePass123!',
        email: 'max@example.com',
        role: 'user',
        emailLanguage: 'ka',
      });
      expect(errors).toHaveLength(0);
      expect(data.name).toBe('Max Mustermann');
      expect(data.emailLanguage).toBe('ka');
    });
  });
});
