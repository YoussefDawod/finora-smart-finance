const logger = require('../logger');
const { sendEmail } = require('./emailTransport');
const templates = require('../emailTemplates');

/**
 * Willkommens-Email senden
 * @param {Object} user - Der User
 * @returns {Promise<Object>}
 */
async function sendWelcomeEmail(user) {
  const name = user.name || 'Nutzer';

  try {
    await sendEmail(user.email, '🎉 Willkommen bei Finora!', templates.welcome(name));
  } catch (error) {
    logger.error(`Welcome email failed: ${error.message}`);
  }

  return { sent: true };
}

/**
 * Sicherheits-Benachrichtigung senden
 * @param {Object} user - Der User
 * @param {string} eventType - 'login', 'password_change', 'suspicious'
 * @param {Object} details - Zusätzliche Details (IP, UserAgent, etc.)
 * @returns {Promise<Object>}
 */
async function sendSecurityAlert(user, eventType, details = {}) {
  if (!user?.email) {
    return { sent: false, reason: 'NO_EMAIL' };
  }

  if (!user.preferences?.emailNotifications) {
    return { sent: false, reason: 'NOTIFICATIONS_DISABLED' };
  }

  if (user.preferences?.notificationCategories?.security === false) {
    return { sent: false, reason: 'CATEGORY_DISABLED' };
  }

  const name = user.name || 'Nutzer';
  const subjects = {
    login: '🔐 Neue Anmeldung in deinem Konto - Finora',
    password_change: '🔒 Passwort geändert - Finora',
    suspicious: '⚠️ Sicherheitswarnung - Finora',
  };
  const subject = subjects[eventType] || '🔐 Sicherheitshinweis - Finora';

  try {
    await sendEmail(user.email, subject, templates.securityAlert(name, eventType, details));
    return { sent: true };
  } catch (error) {
    logger.error(`Security alert failed: ${error.message}`);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendSecurityAlert,
};
