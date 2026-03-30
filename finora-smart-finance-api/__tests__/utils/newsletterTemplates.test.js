/**
 * @fileoverview Newsletter Templates Tests
 * @description Unit-Tests für E-Mail-Templates (campaignTemplate, newsletterWelcome, etc.)
 */

const {
  campaignTemplate,
  newsletterConfirmation,
  newsletterWelcome,
  newsletterGoodbye,
} = require('../../src/utils/emailTemplates/newsletterTemplates');

describe('NewsletterTemplates', () => {
  // ============================================
  // campaignTemplate Tests
  // ============================================
  describe('campaignTemplate', () => {
    const defaultUrl = 'https://finora.yellowdeveloper.de/newsletter/unsubscribe/tok123';

    it('should return HTML string with subject and content', () => {
      const html = campaignTemplate('Test-Betreff', 'Hallo Welt', defaultUrl, 'de');

      expect(html).toContain('Hallo Welt');
      expect(html).toContain(defaultUrl);
    });

    it('should convert \\n to <br> for plain-text content', () => {
      const content = 'Zeile 1\nZeile 2\nZeile 3';
      const html = campaignTemplate('Test', content, defaultUrl, 'de');

      expect(html).toContain('Zeile 1<br>');
      expect(html).toContain('Zeile 2<br>');
      expect(html).toContain('Zeile 3');
    });

    it('should NOT convert \\n to <br> when content contains HTML tags', () => {
      const content = '<p>Absatz 1</p>\n<p>Absatz 2</p>';
      const html = campaignTemplate('Test', content, defaultUrl, 'de');

      expect(html).toContain('<p>Absatz 1</p>');
      expect(html).not.toContain('<p>Absatz 1</p><br>');
    });

    it('should include unsubscribe link for each language', () => {
      const languages = ['de', 'en', 'ar', 'ka'];
      languages.forEach(lang => {
        const html = campaignTemplate('Test', 'Content', defaultUrl, lang);
        expect(html).toContain(`href="${defaultUrl}"`);
      });
    });

    it('should set RTL direction for Arabic', () => {
      const html = campaignTemplate('Test', 'محتوى', defaultUrl, 'ar');

      expect(html).toContain('direction: rtl');
      expect(html).toContain('text-align: right');
    });

    it('should set LTR direction for German', () => {
      const html = campaignTemplate('Test', 'Inhalt', defaultUrl, 'de');

      expect(html).toContain('direction: ltr');
      expect(html).toContain('text-align: left');
    });

    it('should include German footer text by default', () => {
      const html = campaignTemplate('Test', 'Inhalt', defaultUrl);

      expect(html).toContain('Finora-Newsletter abonniert');
      expect(html).toContain('Newsletter abbestellen');
    });

    it('should include English footer text for en', () => {
      const html = campaignTemplate('Test', 'Content', defaultUrl, 'en');

      expect(html).toContain('subscribed to the Finora newsletter');
      expect(html).toContain('Unsubscribe from newsletter');
    });

    it('should include copyright with current year', () => {
      const html = campaignTemplate('Test', 'Inhalt', defaultUrl, 'de');
      const year = new Date().getFullYear();

      expect(html).toContain(`${year} Finora`);
    });

    it('should fallback to de footer text for unknown language', () => {
      const html = campaignTemplate('Test', 'Inhalt', defaultUrl, 'xx');

      expect(html).toContain('Finora-Newsletter abonniert');
    });
  });

  // ============================================
  // newsletterConfirmation Tests
  // ============================================
  describe('newsletterConfirmation', () => {
    it('should return HTML with confirmation link', () => {
      const html = newsletterConfirmation('https://confirm.link', 'https://unsub.link', 'de');

      expect(html).toContain('https://confirm.link');
    });

    it('should support all 4 languages', () => {
      ['de', 'en', 'ar', 'ka'].forEach(lang => {
        const html = newsletterConfirmation('https://confirm.link', 'https://unsub.link', lang);
        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(100);
      });
    });
  });

  // ============================================
  // newsletterWelcome Tests
  // ============================================
  describe('newsletterWelcome', () => {
    it('should return HTML with unsubscribe link', () => {
      const html = newsletterWelcome('https://unsub.link', 'de');

      expect(html).toContain('https://unsub.link');
    });

    it('should support all 4 languages', () => {
      ['de', 'en', 'ar', 'ka'].forEach(lang => {
        const html = newsletterWelcome('https://unsub.link', lang);
        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(100);
      });
    });
  });

  // ============================================
  // newsletterGoodbye Tests
  // ============================================
  describe('newsletterGoodbye', () => {
    it('should return HTML goodbye message', () => {
      const html = newsletterGoodbye('de');

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(100);
    });

    it('should support all 4 languages', () => {
      ['de', 'en', 'ar', 'ka'].forEach(lang => {
        const html = newsletterGoodbye(lang);
        expect(html).toBeTruthy();
      });
    });
  });
});
