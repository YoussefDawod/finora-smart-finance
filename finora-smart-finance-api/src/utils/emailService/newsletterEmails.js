/**
 * Newsletter Email Service
 * Sendet Newsletter-Bestätigungs-, Willkommens- und Abmelde-Emails
 */

const logger = require('../logger');
const { sendEmail, buildLink, backendBaseUrl } = require('./emailTransport');
const templates = require('../emailTemplates');

/**
 * Baut die Backend-Unsubscribe-URL aus einem unhashed Token
 * @param {string} unsubscribeToken - Unhashed Token
 * @returns {string} Vollständige Unsubscribe-URL
 */
function buildUnsubscribeUrl(unsubscribeToken) {
  return buildLink(backendBaseUrl, '/api/v1/newsletter/unsubscribe', unsubscribeToken);
}

/**
 * Sendet eine Newsletter-Bestätigungs-Email (Double Opt-In)
 * @param {string} email - Email des Abonnenten
 * @param {string} confirmToken - Bestätigungs-Token (unhashed)
 * @param {string} unsubscribeToken - Abmelde-Token (unhashed)
 * @param {string} language - Sprache (de, en, ar, ka)
 * @returns {Promise<Object>} Ergebnis mit sent-Status
 */
async function sendNewsletterConfirmation(email, confirmToken, unsubscribeToken, language = 'de') {
  const confirmUrl = buildLink(backendBaseUrl, '/api/v1/newsletter/confirm', confirmToken);
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);

  const subjects = {
    de: 'Finora Newsletter — Bitte bestätige dein Abonnement',
    en: 'Finora Newsletter — Please confirm your subscription',
    ar: 'نشرة Finora الإخبارية — يرجى تأكيد اشتراكك',
    ka: 'Finora ნიუსლეთერი — გთხოვთ დაადასტუროთ გამოწერა',
  };

  try {
    const result = await sendEmail(
      email,
      subjects[language] || subjects.de,
      templates.newsletterConfirmation(confirmUrl, unsubscribeUrl, language),
      `Finora Newsletter\n\nBitte bestätige dein Abonnement: ${confirmUrl}\n\nAbmelden: ${unsubscribeUrl}`
    );
    logger.info(`Newsletter confirmation sent to ${email}`);
    return result;
  } catch (error) {
    logger.error(`Newsletter confirmation email failed: ${error.message}`);
    throw error;
  }
}

/**
 * Sendet eine Newsletter-Willkommens-Email (nach Bestätigung)
 * @param {string} email - Email des Abonnenten
 * @param {string} unsubscribeToken - Abmelde-Token (unhashed)
 * @param {string} language - Sprache (de, en, ar, ka)
 * @returns {Promise<Object>} Ergebnis mit sent-Status
 */
async function sendNewsletterWelcome(email, unsubscribeToken, language = 'de') {
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);

  const subjects = {
    de: 'Willkommen beim Finora Newsletter! 🎉',
    en: 'Welcome to the Finora Newsletter! 🎉',
    ar: '🎉 !Finora مرحبًا في نشرة',
    ka: '🎉 !Finora კეთილი იყოს შენი მობრძანება',
  };

  try {
    const result = await sendEmail(
      email,
      subjects[language] || subjects.de,
      templates.newsletterWelcome(unsubscribeUrl, language),
      `Willkommen beim Finora Newsletter!\n\nAbmelden: ${unsubscribeUrl}`
    );
    logger.info(`Newsletter welcome sent to ${email}`);
    return result;
  } catch (error) {
    logger.error(`Newsletter welcome email failed: ${error.message}`);
    // Don't throw — welcome mail is non-critical
    return { sent: false, error: error.message };
  }
}

/**
 * Sendet eine Newsletter-Abmelde-Bestätigung
 * @param {string} email - Email des Abonnenten
 * @param {string} language - Sprache (de, en, ar, ka)
 * @returns {Promise<Object>} Ergebnis mit sent-Status
 */
async function sendNewsletterGoodbye(email, language = 'de') {
  const subjects = {
    de: 'Finora Newsletter — Abmeldung bestätigt',
    en: 'Finora Newsletter — Unsubscribe confirmed',
    ar: 'نشرة Finora — تم تأكيد إلغاء الاشتراك',
    ka: 'Finora ნიუსლეთერი — გამოწერის გაუქმება დადასტურებულია',
  };

  try {
    const result = await sendEmail(
      email,
      subjects[language] || subjects.de,
      templates.newsletterGoodbye(language),
      'Du wurdest vom Finora-Newsletter abgemeldet.'
    );
    logger.info(`Newsletter goodbye sent to ${email}`);
    return result;
  } catch (error) {
    logger.error(`Newsletter goodbye email failed: ${error.message}`);
    // Don't throw — goodbye mail is non-critical
    return { sent: false, error: error.message };
  }
}

/**
 * Sendet einen Newsletter-Kampagnen-Inhalt an einen Subscriber
 * @param {string} email - Email des Empfängers
 * @param {string} subject - Betreff der Kampagne
 * @param {string} content - HTML-Inhalt der Kampagne
 * @param {string} unsubscribeToken - Hashed Abmelde-Token des Subscribers
 * @param {string} language - Sprache (de, en, ar, ka)
 * @returns {Promise<Object>} Ergebnis mit sent-Status
 */
async function sendNewsletterCampaign(email, subject, content, unsubscribeToken, language = 'de') {
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);

  try {
    const result = await sendEmail(
      email,
      subject,
      templates.campaignTemplate(subject, content, unsubscribeUrl, language),
      `${subject}\n\nNewsletter abbestellen: ${unsubscribeUrl}`
    );
    return result;
  } catch (error) {
    logger.error(`Newsletter campaign email failed for ${email}: ${error.message}`);
    throw error;
  }
}

module.exports = { sendNewsletterConfirmation, sendNewsletterWelcome, sendNewsletterGoodbye, sendNewsletterCampaign };
