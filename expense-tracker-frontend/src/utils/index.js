// src/utils/index.js
// Zentrale Export-Datei für Utility-Funktionen

/**
 * Formatiert einen Betrag als Währung
 * @param {number} amount - Der zu formatierende Betrag
 * @param {string} currency - Währungscode (Standard: EUR)
 * @param {string} locale - Locale für die Formatierung (Standard: de-DE)
 * @returns {string} - Formatierter Währungsbetrag
 */
export const formatCurrency = (amount, currency = 'EUR', locale = 'de-DE') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formatiert ein Datum
 * @param {Date|string} date - Das zu formatierende Datum
 * @param {Object} options - Intl.DateTimeFormat Optionen
 * @param {string} locale - Locale für die Formatierung (Standard: de-DE)
 * @returns {string} - Formatiertes Datum
 */
export const formatDate = (date, options = {}, locale = 'de-DE') => {
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
};

/**
 * Formatiert ein relatives Datum (z.B. "vor 2 Stunden")
 * @param {Date|string} date - Das zu formatierende Datum
 * @param {string} locale - Locale für die Formatierung (Standard: de-DE)
 * @returns {string} - Relatives Datum
 */
export const formatRelativeDate = (date, locale = 'de-DE') => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMins > 0) return rtf.format(-diffMins, 'minute');
  return rtf.format(-diffSecs, 'second');
};

/**
 * Generiert eine eindeutige ID
 * @returns {string} - Eindeutige ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce-Funktion
 * @param {Function} func - Die zu debouncende Funktion
 * @param {number} wait - Wartezeit in ms
 * @returns {Function} - Debounced Funktion
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Klassennamen zusammenfügen (ähnlich wie clsx/classnames)
 * @param  {...any} classes - Klassennamen (String, Array, Object)
 * @returns {string} - Zusammengefügte Klassennamen
 */
export const cn = (...classes) => {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === 'string') return c;
      if (Array.isArray(c)) return cn(...c);
      if (typeof c === 'object') {
        return Object.entries(c)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(' ');
      }
      return '';
    })
    .join(' ')
    .trim();
};

/**
 * Kategorie-Konfiguration
 */
export const CATEGORIES = {
  income: [
    { value: 'salary', label: 'Gehalt', icon: '💼' },
    { value: 'freelance', label: 'Freiberuflich', icon: '💻' },
    { value: 'investment', label: 'Investitionen', icon: '📈' },
    { value: 'other', label: 'Sonstiges', icon: '💰' },
  ],
  expense: [
    { value: 'food', label: 'Essen & Trinken', icon: '🍔' },
    { value: 'transport', label: 'Transport', icon: '🚗' },
    { value: 'entertainment', label: 'Unterhaltung', icon: '🎬' },
    { value: 'shopping', label: 'Einkaufen', icon: '🛍️' },
    { value: 'utilities', label: 'Nebenkosten', icon: '💡' },
    { value: 'health', label: 'Gesundheit', icon: '🏥' },
    { value: 'education', label: 'Bildung', icon: '📚' },
    { value: 'travel', label: 'Reisen', icon: '✈️' },
    { value: 'other', label: 'Sonstiges', icon: '📦' },
  ],
};

/**
 * Kategorie-Details abrufen
 * @param {string} category - Kategorie-Wert
 * @param {string} type - Transaktionstyp (income/expense)
 * @returns {Object|null} - Kategorie-Objekt
 */
export const getCategoryDetails = (category, type) => {
  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  return categories.find((c) => c.value === category) || null;
};

export * from './iconMapping';
