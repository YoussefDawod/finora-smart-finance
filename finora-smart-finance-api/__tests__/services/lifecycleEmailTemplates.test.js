/**
 * @fileoverview Lifecycle Email Templates Tests
 * Tests für alle 4 Template-Typen in 4 Sprachen (de, en, ar, ka)
 */

const {
  retentionReminder,
  retentionFinalWarning,
  retentionDeletionExported,
  retentionDeletionNotExported,
  translations,
  getUserLanguage,
  formatDate,
  formatAmount,
  getDir,
} = require('../../src/utils/emailTemplates/lifecycleTemplates');
const colors = require('../../src/utils/emailTemplates/colors');

describe('Lifecycle Email Templates', () => {
  // ============================================
  // Hilfsfunktionen
  // ============================================
  describe('getUserLanguage', () => {
    it('should return user language when available', () => {
      expect(getUserLanguage({ preferences: { language: 'en' } })).toBe('en');
      expect(getUserLanguage({ preferences: { language: 'ar' } })).toBe('ar');
      expect(getUserLanguage({ preferences: { language: 'ka' } })).toBe('ka');
    });

    it('should fallback to "de" for unknown language', () => {
      expect(getUserLanguage({ preferences: { language: 'fr' } })).toBe('de');
      expect(getUserLanguage({ preferences: { language: 'xx' } })).toBe('de');
    });

    it('should fallback to "de" when no preferences', () => {
      expect(getUserLanguage({})).toBe('de');
      expect(getUserLanguage(null)).toBe('de');
      expect(getUserLanguage(undefined)).toBe('de');
    });
  });

  describe('formatDate', () => {
    it('should format date for different locales', () => {
      const date = new Date('2025-06-15');
      expect(formatDate(date, 'de')).toMatch(/15/);
      expect(formatDate(date, 'en')).toMatch(/15/);
    });

    it('should return dash for null/undefined', () => {
      expect(formatDate(null, 'de')).toBe('—');
      expect(formatDate(undefined, 'de')).toBe('—');
    });
  });

  describe('formatAmount', () => {
    it('should format amounts with 2 decimals', () => {
      expect(formatAmount(123.456)).toBe('123.46 €');
      expect(formatAmount(0)).toBe('0.00 €');
      expect(formatAmount(1000)).toBe('1000.00 €');
    });

    it('should handle null/undefined', () => {
      expect(formatAmount(null)).toBe('0.00 €');
      expect(formatAmount(undefined)).toBe('0.00 €');
    });
  });

  describe('getDir', () => {
    it('should return dir="rtl" for Arabic', () => {
      expect(getDir('ar')).toBe(' dir="rtl"');
    });

    it('should return empty string for other languages', () => {
      expect(getDir('de')).toBe('');
      expect(getDir('en')).toBe('');
      expect(getDir('ka')).toBe('');
    });
  });

  // ============================================
  // Translations completeness
  // ============================================
  describe('translations', () => {
    const allLangs = [translations.de, translations.en, translations.ar, translations.ka];

    it('should have all 4 languages', () => {
      expect(translations.de).toBeDefined();
      expect(translations.en).toBeDefined();
      expect(translations.ar).toBeDefined();
      expect(translations.ka).toBeDefined();
    });

    it('should have all template types in each language', () => {
      const checkTemplateType = (t) => {
        expect(t).toBeDefined();
        expect(t.subject).toBeDefined();
        expect(t.title).toBeDefined();
        expect(typeof t.greeting).toBe('function');
        expect(typeof t.body).toBe('function');
        expect(t.button).toBeDefined();
        expect(t.footer).toBeDefined();
      };

      allLangs.forEach((langObj) => {
        checkTemplateType(langObj.reminder);
        checkTemplateType(langObj.finalWarning);
        checkTemplateType(langObj.deletionExported);
        checkTemplateType(langObj.deletionNotExported);
      });
    });

    it('should have copyright in each language', () => {
      allLangs.forEach((langObj) => {
        expect(langObj.copyright).toMatch(/Finora/);
      });
    });
  });

  // ============================================
  // retentionReminder
  // ============================================
  describe('retentionReminder', () => {
    const baseUser = { name: 'Max', preferences: { language: 'de' } };
    const baseData = { oldestDate: new Date('2024-01-15'), count: 25, reminderNumber: 3 };

    it('should generate German reminder', () => {
      const { subject, html } = retentionReminder(baseUser, baseData);

      expect(subject).toContain('Erinnerung');
      expect(html).toContain('Max');
      expect(html).toContain('25 Transaktionen');
      expect(html).toContain('Nr. 3');
      expect(html).toContain('Finora');
      expect(html).toContain('Daten exportieren');
    });

    it('should generate English reminder', () => {
      const user = { name: 'John', preferences: { language: 'en' } };
      const { subject, html } = retentionReminder(user, baseData);

      expect(subject).toContain('Reminder');
      expect(html).toContain('John');
      expect(html).toContain('25 transactions');
      expect(html).toContain('Export Data');
    });

    it('should generate Arabic reminder with RTL', () => {
      const user = { name: 'أحمد', preferences: { language: 'ar' } };
      const { subject, html } = retentionReminder(user, baseData);

      expect(subject).toContain('تذكير');
      expect(html).toContain('dir="rtl"');
      expect(html).toContain('أحمد');
      expect(html).toContain('تصدير البيانات');
    });

    it('should generate Georgian reminder', () => {
      const user = { name: 'გიორგი', preferences: { language: 'ka' } };
      const { subject, html } = retentionReminder(user, baseData);

      expect(subject).toBe(translations.ka.reminder.subject);
      expect(html).toContain(translations.ka.reminder.button);
      expect(html).toContain('Finora');
    });

    it('should fallback to "Nutzer" when no name', () => {
      const user = { preferences: { language: 'de' } };
      const { html } = retentionReminder(user, baseData);

      expect(html).toContain('Nutzer');
    });

    it('should contain link to settings', () => {
      const { html } = retentionReminder(baseUser, baseData);
      expect(html).toContain('/settings');
    });
  });

  // ============================================
  // retentionFinalWarning
  // ============================================
  describe('retentionFinalWarning', () => {
    const baseUser = { name: 'Max', preferences: { language: 'de' } };
    const baseData = { count: 30, daysRemaining: 7 };

    it('should generate German final warning', () => {
      const { subject, html } = retentionFinalWarning(baseUser, baseData);

      expect(subject).toContain('Letzte Warnung');
      expect(html).toContain('Max');
      expect(html).toContain('30 deiner alten Transaktionen');
      expect(html).toContain('7 Tagen');
      expect(html).toContain(colors.error); // Red styling
    });

    it('should generate English final warning', () => {
      const user = { name: 'John', preferences: { language: 'en' } };
      const { subject, html } = retentionFinalWarning(user, baseData);

      expect(subject).toContain('Final Warning');
      expect(html).toContain('7 days');
      expect(html).toContain('Export Now');
    });

    it('should generate Arabic final warning with RTL', () => {
      const user = { name: 'أحمد', preferences: { language: 'ar' } };
      const { html } = retentionFinalWarning(user, baseData);

      expect(html).toContain('dir="rtl"');
      expect(html).toContain('تحذير أخير');
    });

    it('should generate Georgian final warning', () => {
      const user = { name: 'გიორგი', preferences: { language: 'ka' } };
      const { subject, html } = retentionFinalWarning(user, baseData);

      expect(subject).toBe(translations.ka.finalWarning.subject);
      expect(html).toContain(translations.ka.finalWarning.button);
    });

    it('should use red button styling', () => {
      const { html } = retentionFinalWarning(baseUser, baseData);
      expect(html).toContain(colors.error);
      expect(html).toContain(colors.GRADIENTS.danger);
    });
  });

  // ============================================
  // retentionDeletionExported
  // ============================================
  describe('retentionDeletionExported', () => {
    const baseUser = { name: 'Max', preferences: { language: 'de' } };
    const baseData = { count: 45, totalIncome: 5000, totalExpense: 3200, oldestDate: new Date('2023-06'), newestDate: new Date('2024-06') };

    it('should generate German deletion-exported email', () => {
      const { subject, html } = retentionDeletionExported(baseUser, baseData);

      expect(subject).toContain('Export vorhanden');
      expect(html).toContain('45 alte Transaktionen');
      expect(html).toContain('5000.00 €');
      expect(html).toContain('3200.00 €');
      expect(html).toContain('Zum Dashboard');
    });

    it('should generate English deletion-exported email', () => {
      const user = { name: 'John', preferences: { language: 'en' } };
      const { subject, html } = retentionDeletionExported(user, baseData);

      expect(subject).toContain('export available');
      expect(html).toContain('Go to Dashboard');
    });

    it('should use info styling (not warning) for exported', () => {
      const { html } = retentionDeletionExported(baseUser, baseData);
      expect(html).toContain('class="info"');
    });

    it('should contain link to dashboard', () => {
      const { html } = retentionDeletionExported(baseUser, baseData);
      expect(html).toContain('/dashboard');
    });
  });

  // ============================================
  // retentionDeletionNotExported
  // ============================================
  describe('retentionDeletionNotExported', () => {
    const baseUser = { name: 'Max', preferences: { language: 'de' } };
    const baseData = { count: 45, totalIncome: 5000, totalExpense: 3200 };

    it('should generate German deletion-not-exported email', () => {
      const { subject, html } = retentionDeletionNotExported(baseUser, baseData);

      expect(subject).toContain('kein Export');
      expect(html).toContain('kein Export durchgeführt');
      expect(html).toContain('unwiderruflich');
      expect(html).toContain('5000.00 €');
    });

    it('should generate English deletion-not-exported email', () => {
      const user = { name: 'John', preferences: { language: 'en' } };
      const { subject, html } = retentionDeletionNotExported(user, baseData);

      expect(subject).toContain('no export');
      expect(html).toContain('irrecoverably lost');
    });

    it('should use warning styling for not exported', () => {
      const { html } = retentionDeletionNotExported(baseUser, baseData);
      expect(html).toContain('class="warning"');
    });

    it('should use red heading for not exported', () => {
      const { html } = retentionDeletionNotExported(baseUser, baseData);
      expect(html).toContain(colors.error);
    });

    it('should generate Arabic deletion-not-exported with RTL', () => {
      const user = { name: 'أحمد', preferences: { language: 'ar' } };
      const { subject, html } = retentionDeletionNotExported(user, baseData);

      expect(html).toContain('dir="rtl"');
      expect(subject).toBe(translations.ar.deletionNotExported.subject);
      expect(html).toContain(translations.ar.deletionNotExported.button);
    });

    it('should generate Georgian deletion-not-exported', () => {
      const user = { name: 'გიორგი', preferences: { language: 'ka' } };
      const { subject, html } = retentionDeletionNotExported(user, baseData);

      expect(subject).toBe(translations.ka.deletionNotExported.subject);
      expect(html).toContain(translations.ka.deletionNotExported.button);
    });
  });
});
