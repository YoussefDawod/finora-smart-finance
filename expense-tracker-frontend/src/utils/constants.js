export const CATEGORIES = [
  'Lebensmittel',
  'Transport',
  'Unterhaltung',
  'Miete',
  'Versicherung',
  'Gesundheit',
  'Bildung',
  'Sonstiges',
  'Gehalt',
  'Freelance',
  'Investitionen',
  'Geschenk',
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'EUR', symbol: '€', locale: 'de-DE' },
  { code: 'CHF', symbol: 'CHF', locale: 'de-CH' },
  { code: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

export const APP_NAME = 'Expense Tracker';
export const APP_VERSION = '2.0.0';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
};
