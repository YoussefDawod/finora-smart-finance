/**
 * Admin Notification Emails
 * Sendet Benachrichtigungen an Admins
 */

const User = require('../../models/User');
const logger = require('../logger');
const { sendEmail } = require('./emailTransport');
const templates = require('../emailTemplates');

/**
 * Benachrichtigt alle Admins (mit E-Mail) über eine neue Registrierung
 * @param {Object} newUser - Der neu registrierte User
 * @param {string} newUser.name
 * @param {string} [newUser.email]
 * @param {Date}   newUser.createdAt
 */
async function notifyAdminsNewUser(newUser) {
  try {
    const admins = await User.find({
      role: 'admin',
      email: { $exists: true, $nin: [null, ''] },
    }).select('name email');

    if (admins.length === 0) return;

    const registeredAt = new Date(newUser.createdAt || Date.now()).toLocaleString('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const sendPromises = admins.map(async (admin) => {
      const html = templates.newUserRegistration({
        adminName: admin.name,
        userName: newUser.name,
        userEmail: newUser.email || null,
        registeredAt,
      });

      await sendEmail(
        admin.email,
        `👤 Neuer Benutzer registriert: ${newUser.name} - Finora`,
        html,
      );
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    // Nicht-kritisch — Registrierung soll nicht fehlschlagen
    logger.error(`Admin notification failed: ${error.message}`);
  }
}

module.exports = {
  notifyAdminsNewUser,
};
