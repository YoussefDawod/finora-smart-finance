const { baseLayout } = require('./baseLayout');

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

module.exports = {
  passwordReset,
};
