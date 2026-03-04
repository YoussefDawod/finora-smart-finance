/**
 * Admin Email Templates
 * Benachrichtigungen für Admins (z.B. neue Registrierung)
 */

const { baseLayout } = require('./baseLayout');
const { escapeHtml } = require('../escapeHtml');
const colors = require('./colors');

/**
 * Neue Registrierung — Admin-Benachrichtigung
 * @param {Object} opts
 * @param {string} opts.adminName - Name des Admins
 * @param {string} opts.userName  - Name des neuen Users
 * @param {string} [opts.userEmail] - Email des neuen Users (optional)
 * @param {string} opts.registeredAt - Zeitpunkt der Registrierung
 * @returns {string} HTML
 */
function newUserRegistration({ adminName, userName, userEmail, registeredAt }) {
  const safeAdminName = escapeHtml(adminName);
  const safeUserName = escapeHtml(userName);
  const safeUserEmail = escapeHtml(userEmail);
  const emailRow = userEmail
    ? `<tr><td style="padding:8px 12px;color:${colors.textMuted};">E-Mail</td><td style="padding:8px 12px;font-weight:600;">${safeUserEmail}</td></tr>`
    : `<tr><td style="padding:8px 12px;color:${colors.textMuted};">E-Mail</td><td style="padding:8px 12px;color:${colors.textSubtle};font-style:italic;">Nicht angegeben</td></tr>`;

  return baseLayout(`
    <div class="content">
      <h2>👋 Hallo ${safeAdminName},</h2>
      <p>Ein neuer Benutzer hat sich bei <strong>Finora</strong> registriert:</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:${colors.surfaceLight};border-radius:8px;overflow:hidden;">
        <tr><td style="padding:8px 12px;color:${colors.textMuted};">Name</td><td style="padding:8px 12px;font-weight:600;">${safeUserName}</td></tr>
        ${emailRow}
        <tr><td style="padding:8px 12px;color:${colors.textMuted};">Registriert am</td><td style="padding:8px 12px;">${registeredAt}</td></tr>
      </table>

      <p style="color:${colors.textMuted};font-size:14px;">
        Du kannst den Benutzer im <strong>Admin-Panel</strong> verwalten.
      </p>
    </div>
  `);
}

module.exports = {
  newUserRegistration,
};
