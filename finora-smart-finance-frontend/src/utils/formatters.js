/**
 * @fileoverview Formatter Utilities
 * @description Format values for display (currency, dates, etc.)
 * 
 * @module utils/formatters
 */

import { getLocaleForLanguage, getUserPreferences } from './userPreferences';

/**
 * Format number as currency using Intl
 * @param {number} amount
 * @param {string} [currency] - Optional currency override
 * @returns {string}
 */
export function formatCurrency(amount, currency) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '';

  try {
    const preferences = getUserPreferences();
    const effectiveCurrency = currency || preferences.currency || 'EUR';
    const locale = getLocaleForLanguage(preferences.language);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: effectiveCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    const fallbackCurrency = currency || 'EUR';
    return `${amount.toFixed(2)} ${fallbackCurrency}`;
  }
}

/**
 * Format date with short/long styles
 * @param {Date|string} date
 * @param {'short'|'long'} [format='short']
 * @returns {string}
 */
export function formatDate(date, format = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';

  const preferences = getUserPreferences();
  const locale = getLocaleForLanguage(preferences.language);
  const dateFormat = preferences.dateFormat || 'iso';

  if (format === 'short') {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return dateFormat === 'dmy' ? `${day}.${month}.${year}` : `${year}-${month}-${day}`;
  }

  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format time (24h) with optional locale
 * @param {Date|string} date
 * @param {string} [locale='de-DE']
 * @returns {string}
 */
export function formatTime(date, locale = null) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';

  const preferences = getUserPreferences();
  const effectiveLocale = locale || getLocaleForLanguage(preferences.language);

  return new Intl.DateTimeFormat(effectiveLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Format amount with thousands separator
 * @param {number} amount
 * @param {string} [locale='de-DE']
 * @returns {string}
 */
export function formatAmount(amount, locale = null) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '';
  const preferences = getUserPreferences();
  const effectiveLocale = locale || getLocaleForLanguage(preferences.language);
  return new Intl.NumberFormat(effectiveLocale, { maximumFractionDigits: 2 }).format(amount);
}

/**
 * Truncate text with optional ellipsis
 * @param {string} text
 * @param {number} [maxLength=50]
 * @param {boolean} [ellipsis=true]
 * @returns {string}
 */
export function truncateText(text, maxLength = 50, ellipsis = true) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  const suffix = ellipsis ? '...' : '';
  return `${text.slice(0, maxLength)}${suffix}`;
}

export default {
  formatCurrency,
  formatDate,
  formatTime,
  formatAmount,
  truncateText,
};
