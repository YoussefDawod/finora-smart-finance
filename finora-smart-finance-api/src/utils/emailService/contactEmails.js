/**
 * Contact Email Service
 * Sendet Kontaktformular-Anfragen an die info@-Adresse
 */

const logger = require('../logger');
const { sendEmail } = require('./emailTransport');
const config = require('../../config/env');
const templates = require('../emailTemplates');

/**
 * Sendet eine Kontaktanfrage per Email
 * @param {Object} data - Kontaktdaten
 * @param {string} data.name - Name des Absenders
 * @param {string} data.email - Email des Absenders
 * @param {string} data.category - Kategorie (feedback, bug, feature, other)
 * @param {string} data.message - Nachricht
 * @returns {Promise<Object>} Ergebnis mit sent-Status
 */
async function sendContactEmail({ name, email, category, message }) {
  const contactRecipient = config.contactEmail || 'info@finora.dawoddev.com';

  const categoryLabels = {
    feedback: 'Feedback',
    bug: 'Fehlermeldung',
    feature: 'Feature-Wunsch',
    other: 'Sonstiges',
  };

  const categoryLabel = categoryLabels[category] || category || 'Allgemein';
  const subject = `[Finora Kontakt] ${categoryLabel} — ${name}`;

  try {
    const result = await sendEmail(
      contactRecipient,
      subject,
      templates.contactForm({ name, email, category, message }),
      `Kontaktanfrage von ${name} (${email})\n\nKategorie: ${categoryLabel}\n\n${message}`,
      { replyTo: email }
    );
    logger.info(`Contact email sent from ${email} (${categoryLabel})`);
    return result;
  } catch (error) {
    logger.error(`Contact email failed: ${error.message}`);
    throw error;
  }
}

module.exports = { sendContactEmail };
