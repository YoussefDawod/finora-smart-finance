/**
 * Contact Form Email Template
 * HTML-Template für Kontaktanfragen
 */

const { baseLayout } = require('./baseLayout');
const colors = require('./colors');
const { escapeHtml } = require('../escapeHtml');

/**
 * Kontaktformular Email-Template
 * @param {Object} data - Kontaktdaten
 * @param {string} data.name - Name des Absenders
 * @param {string} data.email - Email des Absenders
 * @param {string} data.category - Kategorie
 * @param {string} data.message - Nachricht
 * @returns {string} HTML-String
 */
function contactForm({ name, email, category, message }) {
  const categoryLabels = {
    feedback: 'Feedback',
    bug: 'Fehlermeldung',
    feature: 'Feature-Wunsch',
    other: 'Sonstiges',
  };

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCategory = escapeHtml(categoryLabels[category] || category || 'Allgemein');
  const safeMessage = escapeHtml(message);

  return baseLayout(`
    <div class="content">
      <h2>Neue Kontaktanfrage</h2>
      <p style="color: ${colors.textMuted}; margin-bottom: 20px;">
        Eine neue Nachricht wurde über das Kontaktformular gesendet.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid ${colors.border}; font-weight: 600; width: 120px; color: ${colors.textLight}; vertical-align: top;">Name</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid ${colors.border}; color: ${colors.textSecondary};">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid ${colors.border}; font-weight: 600; color: ${colors.textLight}; vertical-align: top;">E-Mail</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid ${colors.border};">
            <a href="mailto:${safeEmail}" style="color: ${colors.primary}; text-decoration: none;">${safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid ${colors.border}; font-weight: 600; color: ${colors.textLight}; vertical-align: top;">Kategorie</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid ${colors.border}; color: ${colors.textSecondary};">${safeCategory}</td>
        </tr>
      </table>
      <div style="background: ${colors.surfaceAlt}; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <h3 style="margin: 0 0 12px 0; color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Nachricht</h3>
        <p style="white-space: pre-wrap; color: ${colors.textLight}; line-height: 1.8; margin: 0;">${safeMessage}</p>
      </div>
    </div>
    <div class="footer">
      <p>Diese Nachricht wurde über das Kontaktformular auf <strong>Finora</strong> gesendet.</p>
      <p style="margin-top: 8px;">Direkt antworten an: <a href="mailto:${safeEmail}" style="color: ${colors.primary}; text-decoration: none;">${safeEmail}</a></p>
    </div>
  `);
}

module.exports = { contactForm };
