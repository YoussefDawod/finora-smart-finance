/**
 * @fileoverview adminTemplates Unit Tests
 * @description Tests für newUserRegistration E-Mail-Template
 */

jest.mock('../../src/utils/emailTemplates/baseLayout', () => ({
  baseLayout: (content) => `<html><body>${content}</body></html>`,
}));

jest.mock('../../src/utils/escapeHtml', () => ({
  escapeHtml: (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
}));

const { newUserRegistration } = require('../../src/utils/emailTemplates/adminTemplates');

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
    expect(html).toContain('<html>');
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
