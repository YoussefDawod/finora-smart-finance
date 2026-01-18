/**
 * @fileoverview Formatter Utilities
 * @description Format values for display (currency, dates, etc.)
 * 
 * @module utils/formatters
 */

/**
 * Format number as currency using Intl
 * @param {number} amount
 * @param {string} [currency='EUR']
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'EUR') {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '';

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${currency}`;
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

  const options =
    format === 'long'
      ? { day: '2-digit', month: 'long', year: 'numeric' }
      : { day: '2-digit', month: 'short', year: 'numeric' };

  return new Intl.DateTimeFormat('de-DE', options).format(d);
}

/**
 * Format time (24h) with optional locale
 * @param {Date|string} date
 * @param {string} [locale='de-DE']
 * @returns {string}
 */
export function formatTime(date, locale = 'de-DE') {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
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
export function formatAmount(amount, locale = 'de-DE') {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount);
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
