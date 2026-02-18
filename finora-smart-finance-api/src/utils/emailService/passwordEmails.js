const logger = require('../logger');
const { sendEmail, buildLink, frontendBaseUrl } = require('./emailTransport');
const templates = require('../emailTemplates');

/**
 * Password-Reset-Email senden
 * @param {Object} user - Der User
 * @param {string} token - Reset-Token
 * @returns {Promise<Object>}
 */
async function sendPasswordResetEmail(user, token) {
  const link = buildLink(frontendBaseUrl, '/forgot-password', token);
  const name = user.name || 'Nutzer';

  logger.info(`Password Reset: ${user.email} -> ${link}`);

  try {
    await sendEmail(user.email, 'Passwort zurücksetzen - Finora', templates.passwordReset(name, link));
  } catch (error) {
    logger.error(`Password reset email failed: ${error.message}`);
  }

  return { link };
}

/**
 * Email-Änderungs-Verifizierung senden
 * @param {Object} user - Der User
 * @param {string} token - Verifizierungs-Token
 * @param {string} newEmail - Die neue Email
 * @returns {Promise<Object>}
 */
async function sendEmailChangeVerification(user, token, newEmail) {
  const link = buildLink(frontendBaseUrl, '/verify-email-change', token);
  const name = user.name || 'Nutzer';

  logger.info(`Email Change: ${newEmail} -> ${link}`);

  try {
    await sendEmail(newEmail, 'Neue Email-Adresse bestätigen - Finora', templates.emailChange(name, link, newEmail));
  } catch (error) {
    logger.error(`Email change verification failed: ${error.message}`);
  }

  return { link };
}

module.exports = {
  sendPasswordResetEmail,
  sendEmailChangeVerification,
};
