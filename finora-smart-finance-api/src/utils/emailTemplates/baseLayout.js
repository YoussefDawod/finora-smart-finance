/**
 * Email Base Layout & Shared Styling
 * Gemeinsames Layout für alle Email-Templates
 *
 * Logo-Header: Reines HTML/CSS — kein Bild, keine externen Abhängigkeiten.
 * Funktioniert in 100% aller Email-Clients:
 * Gmail, Outlook, Roundcube (All-Inkl), Apple Mail, Yahoo, Thunderbird.
 */

const config = require('../../config/env');
const colors = require('./colors');

const frontendBaseUrl = config.frontendUrl || 'http://localhost:3000';

/**
 * Minimiert HTML-Output — reduziert Whitespace zwischen Tags um Gmail-Clipping
 * (>102KB) zu verhindern. Bewahrt Whitespace innerhalb von Attribut-Werten.
 * @param {string} html
 * @returns {string}
 */
function minifyHtml(html) {
  return html
    .replace(/\n\s*/g, ' ') // Zeilenumbrüche + führende Spaces → einzelnes Space
    .replace(/>\s+</g, '><') // Whitespace zwischen Tags entfernen
    .replace(/\s{2,}/g, ' ') // Mehrfache Spaces → einzelnes Space
    .trim();
}

/**
 * Header-Slogan Übersetzungen
 */
const HEADER_SLOGANS = {
  de: 'Intelligente Finanzverwaltung f&#252;r dein smartes Leben',
  en: 'Smart finance management for your smart life',
  ar: '&#x625;&#x62F;&#x627;&#x631;&#x629; &#x645;&#x627;&#x644;&#x64A;&#x629; &#x630;&#x643;&#x64A;&#x629; &#x644;&#x62D;&#x64A;&#x627;&#x62A;&#x643; &#x627;&#x644;&#x630;&#x643;&#x64A;&#x629;',
  ka: '&#x10ED;&#x10D9;&#x10D5;&#x10D8;&#x10D0;&#x10DC;&#x10D8; &#x10E4;&#x10D8;&#x10DC;&#x10D0;&#x10DC;&#x10E1;&#x10E3;&#x10E0;&#x10D8; &#x10DB;&#x10D0;&#x10E0;&#x10D7;&#x10D5;&#x10D0; &#x10D7;&#x10E5;&#x10D5;&#x10D4;&#x10DC;&#x10D8; &#x10ED;&#x10D9;&#x10D5;&#x10D8;&#x10D0;&#x10DC;&#x10D8; &#x10EA;&#x10EE;&#x10DD;&#x10D5;&#x10E0;&#x10D4;&#x10D1;&#x10D8;&#x10E1;&#x10D7;&#x10D5;&#x10D8;&#x10E1;',
};

/**
 * HTML lang-Attribut Mapping
 */
const HTML_LANG_MAP = { de: 'de', en: 'en', ar: 'ar', ka: 'ka' };

/**
 * Basis-Layout für alle Emails
 * @param {string} content - Der Email-Inhalt
 * @param {Object} [options] - Optionale Konfiguration
 * @param {string} [options.lang='de'] - Sprache für HTML-lang und Header-Slogan
 * @param {string} [options.headerSlogan] - Überschreibt den Header-Slogan komplett
 * @returns {string} Vollständiges HTML
 */
function baseLayout(content, options = {}) {
  const lang = options.lang || 'de';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const htmlLang = HTML_LANG_MAP[lang] || 'de';
  const slogan = options.headerSlogan || HEADER_SLOGANS[lang] || HEADER_SLOGANS.de;

  const html = `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Finora</title>
<style>
body{font-family:'Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;line-height:1.6;color:${colors.text};background-color:${colors.background};margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:${colors.surface};border-radius:12px;overflow:hidden;box-shadow:0 4px 12px ${colors.shadow}}
.content{padding:30px}
.content h2{color:${colors.textSecondary};margin-top:0}
.button{display:inline-block;background:${colors.GRADIENTS.brand};color:${colors.white}!important;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;margin:20px 0}
.button:hover{opacity:.9}
.footer{background:${colors.surfaceAlt};padding:20px 30px;text-align:center;color:${colors.textMuted};font-size:14px;border-top:1px solid ${colors.border}}
.warning{background:${colors.warningLight};border:1px solid ${colors.warningDark};border-radius:8px;padding:15px;margin:20px 0;color:${colors.warningText}}
.info{background:${colors.infoLight};border:1px solid ${colors.infoDark};border-radius:8px;padding:15px;margin:20px 0;color:${colors.infoText}}
.link-fallback{word-break:break-all;color:${colors.primary};font-size:14px}
</style>
</head>
<body>
<div class="container">
<div style="background:linear-gradient(160deg,#2dd4ff 0%,#3fb9f7 50%,#5b6cff 100%);padding:28px 30px 22px;text-align:center;">
<div style="display:inline-block;text-align:left;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:900;color:#5b6cff;letter-spacing:7px;padding-left:7px;line-height:1;margin:0 0 5px;white-space:nowrap;">FINORA</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#f472d0;letter-spacing:7.5px;padding-left:7.5px;line-height:1;margin:0;white-space:nowrap;">SMART FINANCE</div>
</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:400;color:#0b1220;letter-spacing:.3px;line-height:1.5;margin:14px 0 0;">${slogan}</div>
</div>
${content}
</div>
</body>
</html>`;
  return html;
}

module.exports = {
  baseLayout,
  minifyHtml,
  frontendBaseUrl,
};
