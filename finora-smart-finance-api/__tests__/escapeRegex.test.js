/**
 * @fileoverview escapeRegex Utility Tests
 * @description Tests für die ReDoS-sichere Regex-Escape-Funktion
 */

const escapeRegex = require('../src/utils/escapeRegex');

describe('escapeRegex', () => {
  it('should escape all special regex characters', () => {
    const input = '.*+?^${}()|[]\\';
    const result = escapeRegex(input);

    // Jedes Sonderzeichen muss escaped werden
    expect(result).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('should not alter normal strings', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
    expect(escapeRegex('Max Mustermann')).toBe('Max Mustermann');
    expect(escapeRegex('test@example.com')).toBe('test@example\\.com');
  });

  it('should handle empty string', () => {
    expect(escapeRegex('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(escapeRegex(null)).toBe('');
    expect(escapeRegex(undefined)).toBe('');
    expect(escapeRegex(123)).toBe('');
    expect(escapeRegex({})).toBe('');
  });

  it('should neutralize ReDoS patterns', () => {
    const malicious = '(a+)+$';
    const escaped = escapeRegex(malicious);

    // Escaped version should be safe for RegExp
    expect(escaped).toBe('\\(a\\+\\)\\+\\$');

    // Should not throw when used in RegExp
    // eslint-disable-next-line security/detect-non-literal-regexp
    expect(() => new RegExp(escaped)).not.toThrow();
  });

  it('should escape pipe characters (MongoDB $or injection)', () => {
    const input = 'name|admin';
    const escaped = escapeRegex(input);
    expect(escaped).toBe('name\\|admin');
  });
});
