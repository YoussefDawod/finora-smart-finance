/**
 * @fileoverview User preferences persistence helpers
 * @description Stores and retrieves user display preferences (currency, language, dateFormat)
 */

const STORAGE_KEY = 'et-user-preferences';

export const DEFAULT_USER_PREFERENCES = {
  theme: 'system',
  currency: 'EUR',
  language: 'de',
  dateFormat: 'iso',
  emailNotifications: true,
};

export function persistUserPreferences(preferences = {}) {
  try {
    const safePreferences = {
      ...DEFAULT_USER_PREFERENCES,
      ...preferences,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safePreferences));
  } catch (error) {
    globalThis.console?.error('Failed to persist user preferences:', error);
  }
}

export function getUserPreferences() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_USER_PREFERENCES };

    const parsed = JSON.parse(raw);
    return { ...DEFAULT_USER_PREFERENCES, ...(parsed || {}) };
  } catch (error) {
    globalThis.console?.error('Failed to read user preferences:', error);
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export function getLocaleForLanguage(language = 'de') {
  switch (language) {
    case 'en':
      return 'en-US';
    case 'ar':
      return 'ar';
    case 'ka':
      return 'ka-GE';
    case 'de':
    default:
      return 'de-DE';
  }
}

export default {
  persistUserPreferences,
  getUserPreferences,
  getLocaleForLanguage,
  DEFAULT_USER_PREFERENCES,
};
