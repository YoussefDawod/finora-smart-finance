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

/**
 * Benachrichtigung über neue Transaktion
 * @param {string} name - Benutzername
 * @param {Object} transaction - Transaktionsdaten
 * @returns {string} HTML-Template
 */
function transactionNotification(name, transaction) {
  const sign = transaction.type === 'income' ? '+' : '-';
  const amount = `${sign}${transaction.amount.toFixed(2)} €`;
  const date = new Date(transaction.date).toLocaleDateString('de-DE');

  return baseLayout(`
    <div class="content">
      <h2>Neue Transaktion erfasst</h2>
      <p>Hallo ${name},</p>
      <p>es wurde eine neue ${transaction.type === 'income' ? 'Einnahme' : 'Ausgabe'} gespeichert:</p>
      <div class="info">
        <strong>Betrag:</strong> ${amount}<br>
        <strong>Kategorie:</strong> ${transaction.category}<br>
        <strong>Datum:</strong> ${date}<br>
        <strong>Beschreibung:</strong> ${transaction.description}
      </div>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/transactions" class="button">📊 Zu meinen Transaktionen</a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">
        Wenn diese Buchung nicht von dir stammt, melde dich bitte sofort an und prüfe dein Konto.
      </p>
    </div>
    <div class="footer">
      <p>Du kannst Benachrichtigungen jederzeit in den Einstellungen deaktivieren.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Sicherheitsbenachrichtigung (Login, Passwortänderung)
 * @param {string} name - Benutzername
 * @param {string} eventType - Art des Events ('login', 'password_change', 'suspicious')
 * @param {Object} details - Zusätzliche Details
 * @returns {string} HTML-Template
 */
function securityAlert(name, eventType, details = {}) {
  const titles = {
    login: 'Neue Anmeldung erkannt 🔐',
    password_change: 'Passwort wurde geändert 🔒',
    suspicious: 'Verdächtige Aktivität erkannt ⚠️',
  };

  const messages = {
    login: 'Es wurde eine neue Anmeldung in deinem Konto registriert.',
    password_change: 'Dein Passwort wurde erfolgreich geändert.',
    suspicious: 'Wir haben ungewöhnliche Aktivität in deinem Konto festgestellt.',
  };

  const timestamp = new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return baseLayout(`
    <div class="content">
      <h2>${titles[eventType] || 'Sicherheitshinweis'}</h2>
      <p>Hallo ${name},</p>
      <p>${messages[eventType] || 'Es gab eine sicherheitsrelevante Aktion in deinem Konto.'}</p>
      <div class="${eventType === 'suspicious' ? 'warning' : 'info'}">
        <strong>Zeitpunkt:</strong> ${timestamp}<br>
        ${details.ip ? `<strong>IP-Adresse:</strong> ${details.ip}<br>` : ''}
        ${details.userAgent ? `<strong>Gerät:</strong> ${details.userAgent}<br>` : ''}
        ${details.location ? `<strong>Standort:</strong> ${details.location}<br>` : ''}
      </div>
      ${eventType === 'suspicious' ? `
      <div class="warning">
        <strong>⚠️ Warst das nicht du?</strong> Ändere sofort dein Passwort und überprüfe deine letzten Aktivitäten.
      </div>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/settings" class="button">🔐 Passwort ändern</a>
      </p>
      ` : ''}
      <p style="font-size: 14px; color: #6b7280;">
        Falls du diese Aktion nicht durchgeführt hast, kontaktiere uns bitte umgehend.
      </p>
    </div>
    <div class="footer">
      <p>Diese Benachrichtigung dient deiner Sicherheit.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Budget-Warnung Template
 * @param {string} name - Benutzername
 * @param {Object} alertData - Warnungsdaten
 * @returns {string} HTML-Template
 */
function budgetAlert(name, alertData) {
  const { alertType } = alertData;

  // Negative Balance Alert
  if (alertType === 'negative_balance') {
    const { totalIncome, totalExpenses, balance, deficit, currency, latestTransaction } = alertData;
    const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', JPY: '¥' }[currency] || '€';

    return baseLayout(`
      <div class="content">
        <h2>⚠️ Achtung: Negativer Kontostand</h2>
        <p>Hallo ${name},</p>
        <p>Dein Gesamtsaldo ist ins Minus gerutscht. Hier die Details:</p>
        <div class="warning">
          <strong>Gesamteinnahmen:</strong> ${totalIncome.toFixed(2)} ${currencySymbol}<br>
          <strong>Gesamtausgaben:</strong> ${totalExpenses.toFixed(2)} ${currencySymbol}<br>
          <strong>Aktueller Saldo:</strong> <span style="color: #ef4444; font-weight: bold;">${balance.toFixed(2)} ${currencySymbol}</span><br>
          <strong>Defizit:</strong> ${deficit.toFixed(2)} ${currencySymbol}
        </div>
        ${latestTransaction ? `
        <div class="info">
          <strong>Letzte Transaktion:</strong><br>
          ${latestTransaction.description || latestTransaction.category}: -${latestTransaction.amount.toFixed(2)} ${currencySymbol}
        </div>
        ` : ''}
        <p>Überlege, wie du deine Finanzen wieder ausgleichen kannst. Vielleicht gibt es Ausgaben, die du reduzieren könntest?</p>
        <p style="text-align: center;">
          <a href="${frontendBaseUrl}/transactions" class="button">📊 Finanzen prüfen</a>
        </p>
      </div>
      <div class="footer">
        <p>Diese Benachrichtigung wird maximal einmal pro Woche gesendet.</p>
        <p>Du kannst diese Warnungen in den Einstellungen anpassen.</p>
        <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
      </div>
    `);
  }

  // Monthly Budget Limit Alert (original functionality)
  const { totalSpent, limit, percentUsed, threshold, currency, remainingBudget, exceededBy, latestTransaction } = alertData;
  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', JPY: '¥' }[currency] || '€';
  const isExceeded = percentUsed > 100;

  return baseLayout(`
    <div class="content">
      <h2>${isExceeded ? '🚨 Budget überschritten!' : '⚠️ Budget-Warnung'}</h2>
      <p>Hallo ${name},</p>
      <p>${isExceeded 
        ? 'Du hast dein monatliches Budget überschritten!' 
        : `Du hast ${percentUsed}% deines monatlichen Budgets erreicht.`}</p>
      <div class="${isExceeded ? 'warning' : 'info'}">
        <strong>Monatliches Budget:</strong> ${limit.toFixed(2)} ${currencySymbol}<br>
        <strong>Bereits ausgegeben:</strong> ${totalSpent.toFixed(2)} ${currencySymbol}<br>
        <strong>Verbraucht:</strong> ${percentUsed}%<br>
        ${isExceeded 
          ? `<strong>Überschritten um:</strong> <span style="color: #ef4444;">${exceededBy.toFixed(2)} ${currencySymbol}</span>` 
          : `<strong>Verbleibend:</strong> ${remainingBudget.toFixed(2)} ${currencySymbol}`}
      </div>
      ${latestTransaction ? `
      <div class="info">
        <strong>Letzte Transaktion:</strong><br>
        ${latestTransaction.description || latestTransaction.category}: -${latestTransaction.amount.toFixed(2)} ${currencySymbol}
      </div>
      ` : ''}
      <p>Überlege, ob du in den verbleibenden Tagen des Monats noch Einsparungspotenzial hast.</p>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/transactions" class="button">📊 Ausgaben prüfen</a>
      </p>
    </div>
    <div class="footer">
      <p>Du kannst Budget-Warnungen in den Einstellungen anpassen.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Wöchentlicher/Monatlicher Bericht Template
 * @param {string} name - Benutzername
 * @param {Object} reportData - Berichtsdaten
 * @param {string} period - 'weekly' oder 'monthly'
 * @returns {string} HTML-Template
 */
function financialReport(name, reportData, period = 'weekly') {
  const { income, expenses, balance, topCategories, startDate, endDate } = reportData;
  const periodLabel = period === 'weekly' ? 'Wochenbericht' : 'Monatsbericht';

  const categoryList = topCategories
    .slice(0, 5)
    .map((cat) => `<li>${cat.category}: ${cat.amount.toFixed(2)} €</li>`)
    .join('');

  return baseLayout(`
    <div class="content">
      <h2>Dein ${periodLabel} 📊</h2>
      <p>Hallo ${name},</p>
      <p>hier ist deine Finanzübersicht für den Zeitraum ${startDate} - ${endDate}:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Einnahmen</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; color: #10b981;">+${income.toFixed(2)} €</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Ausgaben</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; color: #ef4444;">-${expenses.toFixed(2)} €</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Saldo</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 700; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">
            ${balance >= 0 ? '+' : ''}${balance.toFixed(2)} €
          </td>
        </tr>
      </table>

      ${topCategories.length > 0 ? `
      <div class="info">
        <strong>Top Ausgaben-Kategorien:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          ${categoryList}
        </ul>
      </div>
      ` : ''}

      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/dashboard" class="button">📈 Zum Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>Du kannst Berichte in den Einstellungen deaktivieren.</p>
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
  transactionNotification,
  securityAlert,
  budgetAlert,
  financialReport,
};
