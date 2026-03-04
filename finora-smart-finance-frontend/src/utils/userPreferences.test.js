/**
 * @fileoverview User Preferences Tests
 * @description Tests für Preference-Persistierung und Locale-Mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_USER_PREFERENCES,
  persistUserPreferences,
  getUserPreferences,
  getLocaleForLanguage,
} from '@/utils/userPreferences';

describe('userPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // DEFAULT_USER_PREFERENCES
  // ──────────────────────────────────────────────────────────
  describe('DEFAULT_USER_PREFERENCES', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_USER_PREFERENCES).toEqual({
        theme: 'system',
        currency: 'EUR',
        language: 'de',
        dateFormat: 'iso',
        emailNotifications: true,
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  // persistUserPreferences
  // ──────────────────────────────────────────────────────────
  describe('persistUserPreferences', () => {
    it('saves merged preferences to localStorage', () => {
      persistUserPreferences({ currency: 'USD' });
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'et-user-preferences',
        expect.any(String)
      );
      const saved = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
      expect(saved.currency).toBe('USD');
      expect(saved.language).toBe('de'); // default preserved
    });

    it('uses all defaults when called with empty object', () => {
      persistUserPreferences({});
      const saved = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
      expect(saved).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('uses all defaults when called without argument', () => {
      persistUserPreferences();
      const saved = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
      expect(saved).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('does not throw on localStorage error', () => {
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
      expect(() => persistUserPreferences({ theme: 'dark' })).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────
  // getUserPreferences
  // ──────────────────────────────────────────────────────────
  describe('getUserPreferences', () => {
    it('returns defaults when localStorage is empty', () => {
      window.localStorage.getItem.mockReturnValue(null);
      expect(getUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('merges stored preferences with defaults', () => {
      window.localStorage.getItem.mockReturnValue(
        JSON.stringify({ currency: 'USD', language: 'en' })
      );
      const prefs = getUserPreferences();
      expect(prefs.currency).toBe('USD');
      expect(prefs.language).toBe('en');
      expect(prefs.theme).toBe('system'); // default fallback
    });

    it('returns defaults on malformed JSON', () => {
      window.localStorage.getItem.mockReturnValue('NOT_JSON');
      expect(getUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('returns defaults on localStorage error', () => {
      window.localStorage.getItem.mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(getUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('handles null parsed value', () => {
      window.localStorage.getItem.mockReturnValue('null');
      expect(getUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });
  });

  // ──────────────────────────────────────────────────────────
  // getLocaleForLanguage
  // ──────────────────────────────────────────────────────────
  describe('getLocaleForLanguage', () => {
    it.each([
      ['de', 'de-DE'],
      ['en', 'en-US'],
      ['ar', 'ar'],
      ['ka', 'ka-GE'],
    ])('maps "%s" → "%s"', (lang, expected) => {
      expect(getLocaleForLanguage(lang)).toBe(expected);
    });

    it('defaults to de-DE for unknown language', () => {
      expect(getLocaleForLanguage('fr')).toBe('de-DE');
    });

    it('defaults to de-DE with no argument', () => {
      expect(getLocaleForLanguage()).toBe('de-DE');
    });
  });
});
