const { baseLayout, frontendBaseUrl } = require('./baseLayout');

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

module.exports = {
  welcome,
  securityAlert,
};
