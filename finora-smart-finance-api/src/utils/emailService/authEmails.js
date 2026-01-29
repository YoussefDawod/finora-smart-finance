const logger = require('../logger');
const { sendEmail, buildLink, backendBaseUrl } = require('./emailTransport');
const templates = require('../emailTemplates');

/**
 * Verifizierungs-Email senden (Registration)
 * @param {Object} user - Der User
 * @param {string} token - Verifizierungs-Token
 * @returns {Promise<Object>}
 */
async function sendVerificationEmail(user, token) {
  const link = buildLink(backendBaseUrl, '/api/auth/verify-email', token);
  const emailAddress = user.email;
  const name = user.name || 'Nutzer';

  logger.info(`📧 Verification: ${emailAddress} -> ${link}`);

  try {
    const result = await sendEmail(emailAddress, '📧 Bestätige deine Email-Adresse - Finora', templates.verification(name, link));
    return { link, ...result };
  } catch (error) {
    logger.error(`Verification email failed: ${error.message}`);
    return { link, sent: false, error: error.message };
  }
}

/**
 * Email-Hinzufügen-Verifizierung senden
 * @param {Object} user - Der User
 * @param {string} token - Verifizierungs-Token
 * @param {string} newEmail - Die neue Email
 * @returns {Promise<Object>}
 */
async function sendAddEmailVerification(user, token, newEmail) {
  const link = buildLink(backendBaseUrl, '/api/auth/verify-add-email', token);
  const name = user.name || 'Nutzer';

  logger.info(`📧 Add-Email Verification: ${newEmail} -> ${link}`);

  try {
    const result = await sendEmail(newEmail, '📧 Bestätige deine Email-Adresse - Finora', templates.verification(name, link));
    return { link, ...result };
  } catch (error) {
    logger.error(`Add-email verification failed: ${error.message}`);
    return { link, sent: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendAddEmailVerification,
};
