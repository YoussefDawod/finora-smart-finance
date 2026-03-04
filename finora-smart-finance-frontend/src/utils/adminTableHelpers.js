/**
 * @fileoverview Admin Table Helpers
 * @description Gemeinsame Hilfsfunktionen für Admin-Tabellen:
 *              Sort-Richtung, Pagination und Währungs-Formatierung.
 *
 * @module utils/adminTableHelpers
 */

/**
 * Bestimmt aria-sort-Richtung für ein Tabellen-Feld.
 * @param {string} field - Spaltenname
 * @param {string} sort - Aktueller Sort-String (z.B. '-date')
 * @returns {'ascending'|'descending'|'none'}
 */
export function getSortDirection(field, sort) {
  const currentField = sort.replace(/^-/, '');
  if (currentField !== field) return 'none';
  return sort.startsWith('-') ? 'descending' : 'ascending';
}

/**
 * Erzeugt ein Array von Seitenzahlen mit '...' für Pagination.
 * @param {number} current - Aktuelle Seite
 * @param {number} total - Gesamtzahl der Seiten
 * @returns {Array<number|string>}
 */
export function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  if (total > 1) pages.push(total);

  return pages;
}

/**
 * Formatiert einen Betrag als Währung mit Intl.NumberFormat.
 * @param {number} amount - Betrag
 * @param {string} [locale='de'] - BCP-47 Locale
 * @param {string} [currency='EUR'] - ISO 4217 Währungscode
 * @returns {string}
 */
export function formatAdminCurrency(amount, locale = 'de', currency = 'EUR') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
