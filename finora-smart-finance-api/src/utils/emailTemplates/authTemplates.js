const { baseLayout } = require('./baseLayout');

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
      <h2>Hallo ${name}!</h2>
      <p>Willkommen bei Finora! Bitte bestätige deine Email-Adresse, um alle Funktionen nutzen zu können.</p>
      <p style="text-align: center;">
        <a href="${link}" class="button">Email bestätigen</a>
      </p>
      <div class="info">
        <strong>Hinweis:</strong> Dieser Link ist ${expiresIn} gültig und kann nur einmal verwendet werden.
      </div>
      <div class="warning">
        <strong>E-Mail nicht erhalten?</strong> Prüfe deinen Spam- oder Junk-Ordner. Markiere uns als vertrauenswürdig, damit zukünftige Emails in deinen Posteingang kommen.
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
 * Email-Änderung Template
 * @param {string} name - Benutzername
 * @param {string} link - Bestätigungslink
 * @param {string} newEmail - Neue Email-Adresse
 * @returns {string} HTML-Template
 */
function emailChange(name, link, newEmail) {
  return baseLayout(`
    <div class="content">
      <h2>Email-Adresse bestätigen</h2>
      <p>Hallo ${name},</p>
      <p>bitte bestätige, dass <strong>${newEmail}</strong> deine neue Email-Adresse ist.</p>
      <p style="text-align: center;">
        <a href="${link}" class="button">Email bestätigen</a>
      </p>
      <div class="info">
        <strong>Hinweis:</strong> Dieser Link ist 24 Stunden gültig. Nach der Bestätigung kannst du diese Email für Password-Resets verwenden.
      </div>
      <div class="warning">
        <strong>E-Mail nicht erhalten?</strong> Prüfe deinen Spam- oder Junk-Ordner. Markiere uns als vertrauenswürdig, damit zukünftige Emails in deinen Posteingang kommen.
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

module.exports = {
  verification,
  emailChange,
};
