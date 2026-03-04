/**
 * Finora Email Color System
 * ============================================
 * Zentralisierte Farbdefinitionen für alle E-Mail-Templates
 * Synchronisiert mit dem Frontend Design System (Light Theme)
 * 
 * @see finora-smart-finance-frontend/src/styles/COLOR_SYSTEM.md
 * 
 * WICHTIG: Bei Farbänderungen im Frontend müssen diese hier
 * entsprechend aktualisiert werden!
 */

const EMAIL_COLORS = {
  // ==========================================
  // 🎨 BRAND COLORS (Light Theme)
  // ==========================================
  primary: '#5b6cff',      // Neon Indigo/Violet - Hauptfarbe
  primaryDark: '#4f5fe6',  // Hover/Darker variant
  secondary: '#2dd4ff',    // Soft Cyan - Akzente, Glows
  accent: '#f472d0',       // Neon Pink - nur dekorativ!

  // ==========================================
  // ✅ STATUS COLORS
  // ==========================================
  success: '#22c55e',      // Grün - Einnahmen, Bestätigungen
  successDark: '#16a34a',  // Dunkleres Grün
  successLight: '#dcfce7', // Helles Grün (Background)
  successText: '#166534',  // Text auf hellem Grün

  warning: '#fbbf24',      // Amber - Warnungen
  warningDark: '#f59e0b',  // Dunkleres Amber
  warningLight: '#fef3c7', // Helles Amber (Background)
  warningText: '#92400e',  // Text auf hellem Amber

  error: '#f43f5e',        // Rose - Fehler, Ausgaben
  errorDark: '#dc2626',    // Dunkleres Rot
  errorLight: '#fef2f2',   // Helles Rot (Background)
  errorText: '#991b1b',    // Text auf hellem Rot

  info: '#38bdf8',         // Sky Blue - Informationen
  infoDark: '#3b82f6',     // Dunkleres Blau
  infoLight: '#eff6ff',    // Helles Blau (Background)
  infoText: '#1e40af',     // Text auf hellem Blau

  // ==========================================
  // 📝 TEXT COLORS
  // ==========================================
  text: '#0b1220',         // Deep Navy - Primärtext
  textSecondary: '#1f2937', // Grau 800 - Überschriften
  textMuted: '#6b7280',    // Grau 500 - Sekundärtext
  textDisabled: '#9ca3af', // Grau 400 - Deaktiviert
  textLight: '#4b5563',    // Grau 600 - Beschreibungen

  // ==========================================
  // 🎭 SURFACE & BACKGROUND COLORS
  // ==========================================
  background: '#f5f7fb',   // Kühles Off-White - E-Mail Body
  surface: '#ffffff',      // Weiß - Container, Cards
  surfaceAlt: '#f9fafb',   // Grau 50 - Footer, alternierend
  surfaceHover: '#f3f4f6', // Grau 100 - Hover-States

  // ==========================================
  // 🔲 BORDER COLORS
  // ==========================================
  border: '#e5e7eb',       // Grau 200 - Standard Borders
  borderLight: '#f3f4f6',  // Grau 100 - Subtile Borders
  borderStrong: '#d1d5db', // Grau 300 - Stärkere Borders

  // ==========================================
  // 🎨 SPECIAL COLORS
  // ==========================================
  white: '#ffffff',
  black: '#000000',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};

// ==========================================
// 🎨 GRADIENT PRESETS
// ==========================================
const GRADIENTS = {
  /**
   * Brand Gradient - für Buttons, CTAs
   * Verwendet: primary → secondary
   */
  brand: `linear-gradient(135deg, ${EMAIL_COLORS.primary}, ${EMAIL_COLORS.secondary})`,

  /**
   * Header Brand Gradient - für E-Mail-Header und Branding-Panels
   * Verwendet: secondary → accent (kühleres Cyan zu Neon-Pink)
   * Entspricht dem Design-System-Gradient für Hero/Header-Flächen
   */
  headerBrand: `linear-gradient(135deg, ${EMAIL_COLORS.secondary}, ${EMAIL_COLORS.accent})`,
  
  /**
   * Primary Gradient - klassischer Brand-Look
   * Zurückhaltender als brand
   */
  primary: `linear-gradient(135deg, ${EMAIL_COLORS.primary}, ${EMAIL_COLORS.primaryDark})`,
  
  /**
   * Danger Gradient - für kritische Aktionen
   */
  danger: `linear-gradient(135deg, ${EMAIL_COLORS.errorDark}, ${EMAIL_COLORS.error})`,
  
  /**
   * Success Gradient - für positive Bestätigungen
   */
  success: `linear-gradient(135deg, ${EMAIL_COLORS.success}, ${EMAIL_COLORS.successDark})`,

  /**
   * Page Background - für standalone HTML Seiten (nicht E-Mails)
   */
  pageBackground: `linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 50%, #faf5ff 100%)`,

  /**
   * Card Shadow - für Card-Elemente auf Standalone-Seiten
   * Verwendet primary (#5b6cff) mit Alpha statt Tailwind-Indigo
   */
  cardShadow: `0 8px 30px rgba(91, 108, 255, 0.12), 0 2px 8px ${EMAIL_COLORS.shadow}`,
};

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

/**
 * Gibt die Farbe für einen Geldbetrag zurück
 * @param {number} amount - Der Betrag
 * @returns {string} success für positiv, error für negativ
 */
function getAmountColor(amount) {
  return amount >= 0 ? EMAIL_COLORS.success : EMAIL_COLORS.error;
}

/**
 * Gibt die Farbe für einen Status zurück
 * @param {'success'|'warning'|'error'|'info'} status
 * @returns {string} Die entsprechende Farbe
 */
function getStatusColor(status) {
  switch (status) {
    case 'success': return EMAIL_COLORS.success;
    case 'warning': return EMAIL_COLORS.warning;
    case 'error': return EMAIL_COLORS.error;
    case 'info': return EMAIL_COLORS.info;
    default: return EMAIL_COLORS.primary;
  }
}

/**
 * Gibt die Background-Farbe für einen Status zurück
 * @param {'success'|'warning'|'error'|'info'} status
 * @returns {string} Die entsprechende helle Background-Farbe
 */
function getStatusBackgroundColor(status) {
  switch (status) {
    case 'success': return EMAIL_COLORS.successLight;
    case 'warning': return EMAIL_COLORS.warningLight;
    case 'error': return EMAIL_COLORS.errorLight;
    case 'info': return EMAIL_COLORS.infoLight;
    default: return EMAIL_COLORS.surface;
  }
}

/**
 * Gibt die Text-Farbe für einen Status-Hintergrund zurück
 * @param {'success'|'warning'|'error'|'info'} status
 * @returns {string} Die entsprechende Text-Farbe
 */
function getStatusTextColor(status) {
  switch (status) {
    case 'success': return EMAIL_COLORS.successText;
    case 'warning': return EMAIL_COLORS.warningText;
    case 'error': return EMAIL_COLORS.errorText;
    case 'info': return EMAIL_COLORS.infoText;
    default: return EMAIL_COLORS.text;
  }
}

module.exports = {
  ...EMAIL_COLORS,
  // Aliases für kürzeren Zugriff auf Status-Hintergründe
  successBg: EMAIL_COLORS.successLight,
  warningBg: EMAIL_COLORS.warningLight,
  errorBg: EMAIL_COLORS.errorLight,
  infoBg: EMAIL_COLORS.infoLight,
  // Alias für Surface colors
  surfaceLight: EMAIL_COLORS.surfaceAlt,
  textSubtle: EMAIL_COLORS.textDisabled,
  GRADIENTS,
  getAmountColor,
  getStatusColor,
  getStatusBackgroundColor,
  getStatusTextColor,
  // Logo-spezifische Farben (synchron mit Frontend logoSvgStrings.js)
  LOGO_COLORS: {
    primary: EMAIL_COLORS.primary,     // #5b6cff
    secondary: EMAIL_COLORS.secondary, // #2dd4ff
    accent: EMAIL_COLORS.accent,       // #f472d0
    success: EMAIL_COLORS.success,     // #22c55e
    info: EMAIL_COLORS.info,           // #38bdf8
  },
};
