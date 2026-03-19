/**
 * @fileoverview adminTemplates Unit Tests
 * @description Tests für newUserRegistration E-Mail-Template
 */

jest.mock('../../src/utils/emailTemplates/baseLayout', () => ({
  baseLayout: (content, options = {}) => {
    const lang = options.lang || 'de';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    return `<html lang="${lang}" dir="${dir}"><body>${content}</body></html>`;
  },
}));

jest.mock('../../src/utils/escapeHtml', () => ({
  escapeHtml: str => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
}));

const {
  newUserRegistration,
  adminCreatedCredentials,
} = require('../../src/utils/emailTemplates/adminTemplates');

describe('newUserRegistration Template', () => {
  const defaultOpts = {
    adminName: 'Admin User',
    userName: 'Max Mustermann',
    userEmail: 'max@example.com',
    registeredAt: '15. Jan. 2025, 11:30',
  };

  it('gibt HTML-String zurück', () => {
    const html = newUserRegistration(defaultOpts);
    expect(typeof html).toBe('string');
    expect(html).toContain('<html ');
  });

  it('enthält den Admin-Namen', () => {
    const html = newUserRegistration(defaultOpts);
    expect(html).toContain('Admin User');
  });

  it('enthält den User-Namen', () => {
    const html = newUserRegistration(defaultOpts);
    expect(html).toContain('Max Mustermann');
  });

  it('enthält die User-Email', () => {
    const html = newUserRegistration(defaultOpts);
    expect(html).toContain('max@example.com');
  });

  it('enthält den Registrierungszeitpunkt', () => {
    const html = newUserRegistration(defaultOpts);
    expect(html).toContain('15. Jan. 2025, 11:30');
  });

  it('zeigt "Nicht angegeben" wenn keine Email vorhanden', () => {
    const html = newUserRegistration({ ...defaultOpts, userEmail: null });
    expect(html).toContain('Nicht angegeben');
    expect(html).not.toContain('max@example.com');
  });

  it('zeigt "Nicht angegeben" wenn Email undefined', () => {
    const html = newUserRegistration({ ...defaultOpts, userEmail: undefined });
    expect(html).toContain('Nicht angegeben');
  });

  it('escaped HTML in Admin-Namen', () => {
    const html = newUserRegistration({
      ...defaultOpts,
      adminName: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escaped HTML in User-Namen', () => {
    const html = newUserRegistration({
      ...defaultOpts,
      userName: 'Max <b>bold</b>',
    });
    expect(html).not.toContain('<b>bold</b>');
    expect(html).toContain('&lt;b&gt;');
  });

  it('escaped HTML in User-Email', () => {
    const html = newUserRegistration({
      ...defaultOpts,
      userEmail: '"><img src=x onerror=alert(1)>',
    });
    // < und > escaped — kein echtes img-Tag möglich
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&quot;');
  });

  it('enthält "Finora" Branding', () => {
    const html = newUserRegistration(defaultOpts);
    expect(html).toContain('Finora');
  });

  it('enthält Admin-Panel Hinweis', () => {
    const html = newUserRegistration(defaultOpts);
    expect(html).toContain('Admin-Panel');
  });

  it('enthält "Registriert am" Label', () => {
    const html = newUserRegistration(defaultOpts);
    expect(html).toContain('Registriert am');
  });
});

// ============================================
// adminCreatedCredentials Template — Multilingual
// ============================================
describe('adminCreatedCredentials Template', () => {
  const defaultOpts = {
    name: 'Max Mustermann',
    username: 'Max Mustermann',
    password: 'SecurePass123!',
    activationLink: 'https://api.finora.com/api/v1/auth/verify-email?token=abc123',
    loginLink: null,
  };

  // ── Grundfunktionalität ─────────────────────
  it('gibt HTML-String zurück', () => {
    const html = adminCreatedCredentials(defaultOpts);
    expect(typeof html).toBe('string');
    expect(html).toContain('<html ');
  });

  it('enthält den User-Namen', () => {
    const html = adminCreatedCredentials(defaultOpts);
    expect(html).toContain('Max Mustermann');
  });

  it('enthält das Passwort', () => {
    const html = adminCreatedCredentials(defaultOpts);
    expect(html).toContain('SecurePass123!');
  });

  it('enthält Aktivierungslink wenn vorhanden', () => {
    const html = adminCreatedCredentials(defaultOpts);
    expect(html).toContain('https://api.finora.com/api/v1/auth/verify-email?token=abc123');
  });

  it('zeigt Login-Link wenn bereits aktiviert', () => {
    const html = adminCreatedCredentials({
      ...defaultOpts,
      activationLink: null,
      loginLink: 'https://app.finora.com/login',
    });
    expect(html).toContain('https://app.finora.com/login');
  });

  it('escaped HTML in Name (XSS-Schutz)', () => {
    const html = adminCreatedCredentials({
      ...defaultOpts,
      name: '<script>alert("xss")</script>',
      username: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escaped HTML in Passwort (XSS-Schutz)', () => {
    const html = adminCreatedCredentials({
      ...defaultOpts,
      password: '<img src=x onerror=alert(1)>',
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  // ── Default-Sprache (de) ────────────────────
  it('verwendet Deutsch als Default-Sprache', () => {
    const html = adminCreatedCredentials(defaultOpts);
    expect(html).toContain('Willkommen bei Finora');
    expect(html).toContain('Benutzername');
    expect(html).toContain('Passwort');
    expect(html).toContain('Sicherheitshinweis');
  });

  it('enthält "ltr" direction als Default', () => {
    const html = adminCreatedCredentials(defaultOpts);
    expect(html).toContain('dir="ltr"');
  });

  // ── Deutsch (de) ───────────────────────────
  describe('language: de', () => {
    it('zeigt deutsche Texte', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'de' });
      expect(html).toContain('Willkommen bei Finora');
      expect(html).toContain('Benutzername');
      expect(html).toContain('Sicherheitshinweis');
      expect(html).toContain('Zum Kopieren markieren');
    });

    it('zeigt Aktivierungstext auf Deutsch', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'de' });
      expect(html).toContain('Konto aktivieren');
      expect(html).toContain('24 Stunden');
    });

    it('zeigt Login-Button auf Deutsch bei voraktiviertem Konto', () => {
      const html = adminCreatedCredentials({
        ...defaultOpts,
        activationLink: null,
        loginLink: 'https://app.finora.com/login',
        language: 'de',
      });
      expect(html).toContain('Jetzt einloggen');
    });
  });

  // ── Englisch (en) ──────────────────────────
  describe('language: en', () => {
    it('zeigt englische Texte', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'en' });
      expect(html).toContain('Welcome to Finora');
      expect(html).toContain('Username');
      expect(html).toContain('Password');
      expect(html).toContain('Security notice');
    });

    it('zeigt Aktivierungstext auf Englisch', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'en' });
      expect(html).toContain('Activate Account');
      expect(html).toContain('24 hours');
    });

    it('zeigt Login-Button auf Englisch', () => {
      const html = adminCreatedCredentials({
        ...defaultOpts,
        activationLink: null,
        loginLink: 'https://app.finora.com/login',
        language: 'en',
      });
      expect(html).toContain('Log in now');
    });

    it('hat LTR-Direction', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'en' });
      expect(html).toContain('dir="ltr"');
    });
  });

  // ── Arabisch (ar) ─────────────────────────
  describe('language: ar', () => {
    it('zeigt arabische Texte', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ar' });
      expect(html).toContain('مرحبًا بك في Finora');
      expect(html).toContain('اسم المستخدم');
      expect(html).toContain('كلمة المرور');
    });

    it('hat RTL-Direction', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ar' });
      expect(html).toContain('dir="rtl"');
    });

    it('verwendet border-right statt border-left für Sicherheitshinweis', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ar' });
      expect(html).toContain('border-right:4px solid');
    });

    it('verwendet margin-right statt margin-left für Copy-Hint', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ar' });
      expect(html).toContain('margin-right:10px');
    });

    it('behält LTR für Credential-Werte (Benutzername/Passwort)', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ar' });
      expect(html).toContain('direction:ltr;unicode-bidi:bidi-override');
    });
  });

  // ── Georgisch (ka) ────────────────────────
  describe('language: ka', () => {
    it('zeigt georgische Texte', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ka' });
      expect(html).toContain('კეთილი იყოს თქვენი მობრძანება Finora');
      expect(html).toContain('მომხმარებლის სახელი');
      expect(html).toContain('პაროლი');
    });

    it('hat LTR-Direction', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ka' });
      expect(html).toContain('dir="ltr"');
    });

    it('zeigt Aktivierungstext auf Georgisch', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ka' });
      expect(html).toContain('ანგარიშის გააქტიურება');
    });
  });

  // ── Fallback ──────────────────────────────
  it('fällt auf Deutsch zurück bei unbekannter Sprache', () => {
    const html = adminCreatedCredentials({ ...defaultOpts, language: 'fr' });
    expect(html).toContain('Willkommen bei Finora');
    expect(html).toContain('Benutzername');
  });

  // ── baseLayout-Integration (lang-Attribut) ─
  describe('baseLayout language option', () => {
    it('setzt html lang="de" als Default', () => {
      const html = adminCreatedCredentials(defaultOpts);
      expect(html).toContain('lang="de"');
    });

    it('setzt html lang="en" für Englisch', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'en' });
      expect(html).toContain('lang="en"');
    });

    it('setzt html lang="ar" und dir="rtl" für Arabisch', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ar' });
      expect(html).toContain('lang="ar"');
      expect(html).toContain('dir="rtl"');
    });

    it('setzt html lang="ka" für Georgisch', () => {
      const html = adminCreatedCredentials({ ...defaultOpts, language: 'ka' });
      expect(html).toContain('lang="ka"');
    });
  });

  // ── actionBlock ohne Link ─────────────────
  it('zeigt Text ohne Buttons wenn weder Activation noch Login-Link', () => {
    const html = adminCreatedCredentials({
      ...defaultOpts,
      activationLink: null,
      loginLink: null,
      language: 'en',
    });
    expect(html).toContain('You can log in right away');
    expect(html).not.toContain('Activate Account');
    expect(html).not.toContain('Log in now');
  });

  // ── Footer ─────────────────────────────────
  it('enthält Finora Branding im Footer', () => {
    const html = adminCreatedCredentials(defaultOpts);
    expect(html).toContain('Finora');
    expect(html).toContain(new Date().getFullYear().toString());
  });

  it('zeigt lokalisierten Footer-Slogan', () => {
    const htmlEn = adminCreatedCredentials({ ...defaultOpts, language: 'en' });
    expect(htmlEn).toContain('Smart finance management');

    const htmlDe = adminCreatedCredentials({ ...defaultOpts, language: 'de' });
    expect(htmlDe).toContain('Intelligente Finanzverwaltung');
  });
});
