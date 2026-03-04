/**
 * @fileoverview Finora Logo SVG-String Utility
 * @description Single Source of Truth für statische Logo-SVGs.
 * 
 * Wird verwendet in Kontexten OHNE CSS-Variablen:
 * - PDF-Export (ExportSection)
 * - Favicon Data-URI
 * - E-Mail-Templates (inline SVG)
 * - OG-Image Generierung
 * 
 * FARBEN: Synchronisiert mit dem Frontend Design System
 * @see finora-smart-finance-frontend/src/styles/themes/light.scss
 * @see finora-smart-finance-frontend/src/styles/themes/dark.scss
 * @see FINORA-LOGO-SPEC.md
 * 
 * @module logoSvgStrings
 */

// ============================================
// 🎨 LOGO-FARBEN (nach Theme)
// ============================================

/**
 * Logo-Farbdefinitionen für alle Themes.
 * Single Source of Truth für statische Kontexte.
 */
export const LOGO_COLORS = {
  light: {
    primary: '#5b6cff',
    secondary: '#2dd4ff',
    accent: '#f472d0',
    success: '#22c55e',
    error: '#f43f5e',
    info: '#38bdf8',
    text: '#0b1220',
    textMuted: '#6b7280',
    background: '#f5f7fb',
    border: '#e5e7eb',
  },
  dark: {
    primary: '#7c83ff',
    secondary: '#32e1ff',
    accent: '#ff6ec7',
    success: '#22c55e',
    error: '#f43f5e',
    info: '#60a5fa',
    text: '#e9edff',
    textMuted: '#9ca3af',
    background: '#070b1a',
    border: '#374151',
  },
};

// ============================================
// 📐 SVG-PFADE (Single Source of Truth)
// ============================================

/** F-Letterform Pfad (ViewBox 0 0 48 48) */
export const F_LETTERFORM_PATH = 'M14 10h20c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v6h12c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v8c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2z';

/** Growth-Line Pfad (ViewBox 0 0 48 48) */
export const GROWTH_LINE_PATH = 'M24 38L30 30L36 33L42 22';

/** Peak-Dot Position */
export const PEAK_DOT = { cx: 42, cy: 22, r: 3.5 };

// ============================================
// 🖼️ SVG-GENERATOR-FUNKTIONEN
// ============================================

/**
 * Gibt die Theme-Farben zurück, mit Fallback auf Light.
 * @param {'light'|'dark'} [theme='light']
 * @returns {object} Farbpalette
 */
function getColors(theme = 'light') {
  return LOGO_COLORS[theme] || LOGO_COLORS.light;
}

/**
 * Generiert ein Icon-only SVG (ohne Hintergrund).
 * Für Kontexte, in denen das Logo auf eigenem Container liegt.
 * 
 * @param {object} options
 * @param {number} [options.size=40] - Breite und Höhe in px
 * @param {'light'|'dark'} [options.theme='light'] - Theme
 * @returns {string} SVG-String
 */
export function getLogoIconSVG({ size = 40, theme = 'light' } = {}) {
  const c = getColors(theme);

  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.primary}"/>
      <stop offset="100%" stop-color="${c.secondary}"/>
    </linearGradient>
    <linearGradient id="logoAccent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c.info}"/>
      <stop offset="100%" stop-color="${c.success}"/>
    </linearGradient>
  </defs>
  <path d="${F_LETTERFORM_PATH}" fill="url(#logoPrimary)"/>
  <path d="${GROWTH_LINE_PATH}" stroke="url(#logoAccent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="${PEAK_DOT.cx}" cy="${PEAK_DOT.cy}" r="${PEAK_DOT.r}" fill="${c.success}"/>
</svg>`;
}

/**
 * Generiert ein Favicon-SVG (mit <rect> Hintergrund).
 * Favicon braucht einen sichtbaren Hintergrund für den Browser-Tab.
 * 
 * @param {object} options
 * @param {'light'|'dark'} [options.theme='light'] - Theme
 * @returns {string} SVG-String
 */
export function getLogoFaviconSVG({ theme = 'light' } = {}) {
  const c = getColors(theme);

  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="finoraFaviconBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c.primary}"/><stop offset="100%" stop-color="${c.secondary}"/></linearGradient><linearGradient id="finoraFaviconAccent" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c.info}"/><stop offset="100%" stop-color="${c.success}"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#finoraFaviconBg)"/><path d="${F_LETTERFORM_PATH}" fill="white"/><path d="${GROWTH_LINE_PATH}" stroke="url(#finoraFaviconAccent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="${PEAK_DOT.cx}" cy="${PEAK_DOT.cy}" r="${PEAK_DOT.r}" fill="${c.success}"/></svg>`;
}

/**
 * Generiert ein vollständiges Logo-SVG mit Icon + Wortmarke.
 * Für PDF-Export, OG-Image-Generierung, etc.
 * 
 * @param {object} options
 * @param {number} [options.size=40] - Icon-Größe in px
 * @param {'light'|'dark'} [options.theme='light'] - Theme
 * @param {string} [options.brandName='Finora'] - Brand-Name Text
 * @param {string} [options.tagline='SMART FINANCE'] - Tagline Text
 * @returns {string} SVG-String
 */
export function getLogoFullSVG({ size = 40, theme = 'light', brandName = 'Finora', tagline = 'SMART FINANCE' } = {}) {
  const c = getColors(theme);
  const textX = size + 12; // Gap zwischen Icon und Text
  const brandFontSize = Math.round(size * 0.5);     // ~20px bei size=40
  const tagFontSize = Math.round(size * 0.26);       // ~10px bei size=40
  const totalWidth = size + 12 + brandFontSize * brandName.length * 0.58; // Schätzung
  const totalHeight = size;

  return `<svg viewBox="0 0 ${Math.ceil(totalWidth)} ${totalHeight}" width="${Math.ceil(totalWidth)}" height="${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.primary}"/>
      <stop offset="100%" stop-color="${c.secondary}"/>
    </linearGradient>
    <linearGradient id="logoAccent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c.info}"/>
      <stop offset="100%" stop-color="${c.success}"/>
    </linearGradient>
    <linearGradient id="logoTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c.text}"/>
      <stop offset="100%" stop-color="${c.primary}"/>
    </linearGradient>
  </defs>
  <g transform="scale(${(size / 48).toFixed(4)})">
    <path d="${F_LETTERFORM_PATH}" fill="url(#logoPrimary)"/>
    <path d="${GROWTH_LINE_PATH}" stroke="url(#logoAccent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="${PEAK_DOT.cx}" cy="${PEAK_DOT.cy}" r="${PEAK_DOT.r}" fill="${c.success}"/>
  </g>
  <text x="${textX}" y="${Math.round(totalHeight * 0.5)}" font-family="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" font-size="${brandFontSize}" font-weight="800" letter-spacing="-0.025em" fill="url(#logoTextGrad)" dominant-baseline="central">${brandName}</text>
  <text x="${textX}" y="${Math.round(totalHeight * 0.82)}" font-family="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" font-size="${tagFontSize}" font-weight="500" letter-spacing="0.1em" fill="${c.textMuted}" dominant-baseline="central">${tagline}</text>
</svg>`;
}

/**
 * Erzeugt eine Data-URI aus einem SVG-String.
 * Für Favicon-Link-Tags, CSS background-image, etc.
 * 
 * @param {string} svgString - Valider SVG-String
 * @returns {string} data:image/svg+xml,... URI
 */
export function svgToDataURI(svgString) {
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
}
