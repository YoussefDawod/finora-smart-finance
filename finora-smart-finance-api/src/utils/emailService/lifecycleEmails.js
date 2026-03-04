/**
 * Lifecycle Email Service
 * Sendet Lifecycle-bezogene Emails (Retention-Erinnerungen, Warnungen, Löschbestätigungen)
 *
 * Wird vom transactionLifecycleService über require('../utils/emailService/lifecycleEmails') aufgerufen.
 */

const logger = require('../logger');
const { sendEmail } = require('./emailTransport');
const {
  retentionReminder,
  retentionFinalWarning,
  retentionDeletionExported,
  retentionDeletionNotExported,
} = require('../emailTemplates/lifecycleTemplates');

/**
 * Gibt die Template-Funktion für den Typ zurück (safe, keine Bracket-Notation)
 * @param {string} type - Template-Typ
 * @returns {Function|null}
 */
function getTemplateFn(type) {
  switch (type) {
    case 'reminder':
      return retentionReminder;
    case 'finalWarning':
      return retentionFinalWarning;
    case 'deletionExported':
      return retentionDeletionExported;
    case 'deletionNotExported':
      return retentionDeletionNotExported;
    default:
      return null;
  }
}

/**
 * Sendet eine Lifecycle-Email an den User.
 *
 * @param {Object} user - Mongoose User-Dokument (mit name, email, isVerified, preferences)
 * @param {string} type - 'reminder' | 'finalWarning' | 'deletionExported' | 'deletionNotExported'
 * @param {Object} data - Zusätzliche Daten für das Template
 * @returns {Promise<{sent: boolean, reason?: string, messageId?: string}>}
 */
async function sendLifecycleEmail(user, type, data) {
  // Validierung
  if (!user?.email || !user.isVerified) {
    return { sent: false, reason: 'NO_VERIFIED_EMAIL' };
  }

  if (!user.preferences?.emailNotifications) {
    return { sent: false, reason: 'NOTIFICATIONS_DISABLED' };
  }

  const templateFn = getTemplateFn(type);
  if (!templateFn) {
    logger.error(`[Lifecycle Email] Unknown template type: ${type}`);
    return { sent: false, reason: 'UNKNOWN_TEMPLATE' };
  }

  try {
    const { subject, html } = templateFn(user, data);
    const result = await sendEmail(user.email, subject, html);

    if (result.sent) {
      logger.info(`[Lifecycle Email] ${type} email sent to ${user.email}`);
    } else {
      logger.debug(
        `[Lifecycle Email] ${type} email not sent to ${user.email}: ${result.mode || 'unknown'}`
      );
    }

    return result;
  } catch (error) {
    logger.error(`[Lifecycle Email] Failed to send ${type} to ${user.email}: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

module.exports = {
  sendLifecycleEmail,
};
