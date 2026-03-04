/**
 * Email Base Layout & Shared Styling
 * Gemeinsames Layout für alle Email-Templates
 * 
 * Verwendet zentralisierte Farben aus colors.js
 */

const config = require('../../config/env');
const colors = require('./colors');
const { getEmailLogoImg } = require('./logoSvg');

const frontendBaseUrl = config.frontendUrl || 'http://localhost:3000';

/**
 * Basis-Layout für alle Emails
 * @param {string} content - Der Email-Inhalt
 * @returns {string} Vollständiges HTML
 */
function baseLayout(content) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finora</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: ${colors.text};
      background-color: ${colors.background};
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: ${colors.surface};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px ${colors.shadow};
    }
    .header {
      background: ${colors.GRADIENTS.headerBrand};
      color: ${colors.white};
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header img {
      display: block;
      margin: 0 auto 8px;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: ${colors.textSecondary};
      margin-top: 0;
    }
    .button {
      display: inline-block;
      background: ${colors.GRADIENTS.brand};
      color: ${colors.white} !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background: ${colors.surfaceAlt};
      padding: 20px 30px;
      text-align: center;
      color: ${colors.textMuted};
      font-size: 14px;
      border-top: 1px solid ${colors.border};
    }
    .warning {
      background: ${colors.warningLight};
      border: 1px solid ${colors.warningDark};
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      color: ${colors.warningText};
    }
    .info {
      background: ${colors.infoLight};
      border: 1px solid ${colors.infoDark};
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      color: ${colors.infoText};
    }
    .link-fallback {
      word-break: break-all;
      color: ${colors.primary};
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${getEmailLogoImg({ size: 40 })}
      <h1>Finora</h1>
    </div>
    ${content}
  </div>
</body>
</html>
  `;
}

module.exports = {
  baseLayout,
  frontendBaseUrl,
};
