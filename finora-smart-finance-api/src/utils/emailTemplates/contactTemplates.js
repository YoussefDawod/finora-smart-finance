/**
 * Contact Form Email Template
 * HTML-Template für Kontaktanfragen
 */

const { baseLayout } = require('./baseLayout');

/**
 * Escapes HTML-Sonderzeichen (XSS-Schutz)
 * @param {string} str - Unescaped String
 * @returns {string} Escaped String
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
      <p style="color: #6b7280; margin-bottom: 20px;">
        Eine neue Nachricht wurde über das Kontaktformular gesendet.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 120px; color: #374151; vertical-align: top;">Name</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; vertical-align: top;">E-Mail</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
            <a href="mailto:${safeEmail}" style="color: #6366f1; text-decoration: none;">${safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; vertical-align: top;">Kategorie</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${safeCategory}</td>
        </tr>
      </table>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Nachricht</h3>
        <p style="white-space: pre-wrap; color: #4b5563; line-height: 1.8; margin: 0;">${safeMessage}</p>
      </div>
    </div>
    <div class="footer">
      <p>Diese Nachricht wurde über das Kontaktformular auf <strong>Finora</strong> gesendet.</p>
      <p style="margin-top: 8px;">Direkt antworten an: <a href="mailto:${safeEmail}" style="color: #6366f1; text-decoration: none;">${safeEmail}</a></p>
    </div>
  `);
}

module.exports = { contactForm };
