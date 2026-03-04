/**
 * @fileoverview Finora Email Logo SVG Utility
 * @description Single Source of Truth für das Logo-SVG in E-Mail-Templates.
 *
 * Synchronisiert mit:
 * @see finora-smart-finance-frontend/src/utils/logoSvgStrings.js
 * @see FINORA-LOGO-SPEC.md §4.3
 *
 * WICHTIG – E-Mail-Client-Kompatibilität:
 * Inline `<svg>` wird von E-Mail-Clients (Gmail, Outlook, Apple Mail) nicht
 * gerendert und stillschweigend ignoriert. Stattdessen muss das SVG als
 * Data-URI in einem `<img>`-Tag eingebettet werden.
 *
 * DESIGN-ENTSCHEIDUNG:
 * Das F bleibt `fill="white"`, weil der E-Mail-Header einen
 * farbigen Gradient-Hintergrund hat (äquivalent zum Favicon-Kontext).
 * Gradient-IDs sind eindeutig namespaced um DOM-Konflikte zu vermeiden.
 *
 * @module utils/emailTemplates/logoSvg
 */

const colors = require('./colors');

// ============================================
// 📐 SVG-PFADE (Single Source of Truth)
// Synchronisiert mit Frontend logoSvgStrings.js
// ============================================

/** F-Letterform Pfad (ViewBox 0 0 48 48) */
const F_LETTERFORM_PATH =
  'M14 10h20c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v6h12c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v8c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2z';

/** Growth-Line Pfad (ViewBox 0 0 48 48) */
const GROWTH_LINE_PATH = 'M24 38L30 30L36 33L42 22';

/** Peak-Dot Position */
const PEAK_DOT = { cx: 42, cy: 22, r: 3.5 };

// ============================================
// 🖼️ SVG-GENERATOR (interner Rohstring)
// ============================================

/**
 * Generiert den rohen SVG-String für das E-Mail-Logo.
 * Intern verwendet — für E-Mail-Rendering `getEmailLogoImg()` nutzen.
 *
 * @param {number} [size=40]
 * @returns {string} SVG-String
 */
function _buildSvgString(size = 40) {
  const c = colors.LOGO_COLORS;
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="emailLogoGrowth" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c.info}"/><stop offset="100%" stop-color="${c.success}"/></linearGradient></defs><path d="${F_LETTERFORM_PATH}" fill="white"/><path d="${GROWTH_LINE_PATH}" stroke="url(#emailLogoGrowth)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="${PEAK_DOT.cx}" cy="${PEAK_DOT.cy}" r="${PEAK_DOT.r}" fill="${c.success}"/></svg>`;
}

// ============================================
// 📧 E-MAIL-KOMPATIBLE FUNKTIONEN
// ============================================

/**
 * Gibt das Logo als `<img>`-Tag mit SVG Data-URI zurück.
 *
 * Email-Clients rendern kein inline `<svg>` — ein `<img src="data:image/svg+xml,...">`
 * funktioniert dagegen in Gmail, Apple Mail, Thunderbird und allen modernen Clients.
 *
 * @param {object} [options]
 * @param {number} [options.size=40] - Breite und Höhe in Pixeln
 * @returns {string} `<img>`-HTML-String
 */
function getEmailLogoImg({ size = 40 } = {}) {
  const svg = _buildSvgString(size);
  // URL-Encode: % → %25, dann < > # { } | \ ^ ~ [ ] ` kodieren
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  const dataUri = `data:image/svg+xml,${encoded}`;
  return `<img src="${dataUri}" width="${size}" height="${size}" alt="Finora Logo" style="display:block;border:0;outline:none;" />`;
}

/**
 * @deprecated Verwende stattdessen `getEmailLogoImg()` — inline SVG wird in
 * E-Mail-Clients nicht gerendert.
 */
function getEmailLogoSVG({ size = 40 } = {}) {
  return _buildSvgString(size);
}

module.exports = {
  getEmailLogoImg,
  getEmailLogoSVG,
  F_LETTERFORM_PATH,
  GROWTH_LINE_PATH,
  PEAK_DOT,
};
