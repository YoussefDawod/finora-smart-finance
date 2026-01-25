/**
 * Email Templates Module
 * HTML-Templates für alle Email-Typen
 */

const config = require('../config/env');
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3001';

// ============================================
// BASE LAYOUT
// ============================================

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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #1f2937;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white !important;
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
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      color: #92400e;
    }
    .info {
      background: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      color: #1e40af;
    }
    .link-fallback {
      word-break: break-all;
      color: #6366f1;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Finora</h1>
    </div>
    ${content}
  </div>
</body>
</html>
  `;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Email-Verifizierung Template
 * @param {string} name - Benutzername
 * @param {string} link - Verifizierungslink
 * @param {string} expiresIn - Gültigkeitsdauer
 * @returns {string} HTML-Template
 */
function verification(name, link, expiresIn = '24 Stunden') {
  return baseLayout(`
    <div class="content">
      <h2>Hallo ${name}! 👋</h2>
      <p>Willkommen bei Finora! Bitte bestätige deine Email-Adresse, um alle Funktionen nutzen zu können.</p>
      <p style="text-align: center;">
        <a href="${link}" class="button">📧 Email bestätigen</a>
      </p>
      <div class="info">
        <strong>ℹ️ Hinweis:</strong> Dieser Link ist ${expiresIn} gültig und kann nur einmal verwendet werden.
      </div>
      <div class="warning">
        <strong>⚠️ E-Mail nicht erhalten?</strong> Prüfe deinen Spam- oder Junk-Ordner. Markiere uns als vertrauenswürdig, damit zukünftige Emails in deinen Posteingang kommen.
      </div>
      <p style="font-size: 14px; color: #6b7280;">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
        <span class="link-fallback">${link}</span>
      </p>
    </div>
    <div class="footer">
      <p>Du hast dich nicht registriert? Ignoriere diese Email einfach.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Password Reset Template
 * @param {string} name - Benutzername
 * @param {string} link - Reset-Link
 * @returns {string} HTML-Template
 */
function passwordReset(name, link) {
  return baseLayout(`
    <div class="content">
      <h2>Passwort zurücksetzen 🔐</h2>
      <p>Hallo ${name},</p>
      <p>du hast einen Antrag zum Zurücksetzen deines Passworts gestellt.</p>
      <p style="text-align: center;">
        <a href="${link}" class="button">🔑 Neues Passwort setzen</a>
      </p>
      <div class="warning">
        <strong>⚠️ Wichtig:</strong> Dieser Link ist nur <strong>1 Stunde</strong> gültig. Wenn du keinen Reset angefordert hast, ignoriere diese Email.
      </div>
      <p style="font-size: 14px; color: #6b7280;">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
        <span class="link-fallback">${link}</span>
      </p>
    </div>
    <div class="footer">
      <p>Dein Passwort bleibt sicher, solange du diesen Link nicht verwendest.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Email-Änderung Template
 * @param {string} name - Benutzername
 * @param {string} link - Bestätigungslink
 * @param {string} newEmail - Neue Email-Adresse
 * @returns {string} HTML-Template
 */
function emailChange(name, link, newEmail) {
  return baseLayout(`
    <div class="content">
      <h2>Email-Adresse bestätigen ✉️</h2>
      <p>Hallo ${name},</p>
      <p>bitte bestätige, dass <strong>${newEmail}</strong> deine neue Email-Adresse ist.</p>
      <p style="text-align: center;">
        <a href="${link}" class="button">✅ Email bestätigen</a>
      </p>
      <div class="info">
        <strong>ℹ️ Hinweis:</strong> Dieser Link ist 24 Stunden gültig. Nach der Bestätigung kannst du diese Email für Password-Resets verwenden.
      </div>
      <div class="warning">
        <strong>⚠️ E-Mail nicht erhalten?</strong> Prüfe deinen Spam- oder Junk-Ordner. Markiere uns als vertrauenswürdig, damit zukünftige Emails in deinen Posteingang kommen.
      </div>
      <p style="font-size: 14px; color: #6b7280;">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
        <span class="link-fallback">${link}</span>
      </p>
    </div>
    <div class="footer">
      <p>Du hast diese Änderung nicht angefordert? Ignoriere diese Email.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Willkommens-Email Template
 * @param {string} name - Benutzername
 * @returns {string} HTML-Template
 */
function welcome(name) {
  return baseLayout(`
    <div class="content">
      <h2>Willkommen bei Finora! 🎉</h2>
      <p>Hallo ${name},</p>
      <p>deine Email-Adresse wurde erfolgreich bestätigt. Du kannst jetzt alle Funktionen von Finora nutzen:</p>
      <ul>
        <li>📊 Einnahmen und Ausgaben tracken</li>
        <li>📈 Finanzübersichten und Charts</li>
        <li>🔐 Passwort zurücksetzen (falls nötig)</li>
        <li>⚙️ Profil-Einstellungen anpassen</li>
      </ul>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/dashboard" class="button">🚀 Zum Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>Viel Erfolg beim Sparen!</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

module.exports = {
  baseLayout,
  verification,
  passwordReset,
  emailChange,
  welcome,
};
