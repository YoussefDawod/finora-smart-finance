/**
 * Admin Notification Emails
 * Sendet Benachrichtigungen an Admins
 */

const User = require('../../models/User');
const logger = require('../logger');
const { sendEmail, buildLink, backendBaseUrl } = require('./emailTransport');
const templates = require('../emailTemplates');
const config = require('../../config/env');

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

    const sendPromises = admins.map(async admin => {
      const html = templates.newUserRegistration({
        adminName: admin.name,
        userName: newUser.name,
        userEmail: newUser.email || null,
        registeredAt,
      });

      await sendEmail(admin.email, `👤 Neuer Benutzer registriert: ${newUser.name} - Finora`, html);
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    // Nicht-kritisch — Registrierung soll nicht fehlschlagen
    logger.error(`Admin notification failed: ${error.message}`);
  }
}

/**
 * Zugangsdaten-Email an einen vom Admin erstellten User senden
 * @param {Object} user            - Der neue User (muss user.email gesetzt haben)
 * @param {string} plainPassword   - Klartextpasswort (nur einmalig verfügbar, vor dem Hashing)
 * @param {string|null} activationToken - Rohes Token für Aktivierungslink (null wenn isVerified=true)
 * @param {string} [language='de'] - Sprache der Email (de, en, ar, ka)
 * @returns {Promise<Object>}
 */
async function sendAdminCreatedCredentialsEmail(
  user,
  plainPassword,
  activationToken,
  language = 'de'
) {
  if (!user?.email) {
    return { sent: false, reason: 'NO_EMAIL' };
  }

  let activationLink = null;
  if (activationToken) {
    activationLink = buildLink(backendBaseUrl, '/api/v1/auth/verify-email', activationToken);
  }

  const html = templates.adminCreatedCredentials({
    name: user.name,
    username: user.name,
    password: plainPassword,
    activationLink,
    loginLink: activationLink ? null : `${config.frontendUrl}/login`,
    language,
  });

  try {
    const subjects = {
      de: 'Deine Zugangsdaten – Finora',
      en: 'Your Login Credentials – Finora',
      ar: 'بيانات تسجيل الدخول الخاصة بك – Finora',
      ka: 'თქვენი შესვლის მონაცემები – Finora',
    };

    await sendEmail(user.email, subjects[language] || subjects.de, html);
    logger.info(`Admin-Credentials Email gesendet an: ${user.email}`);
    return { sent: true, activationLink };
  } catch (error) {
    logger.error(`Admin-Credentials Email fehlgeschlagen: ${error.message}`);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  notifyAdminsNewUser,
  sendAdminCreatedCredentialsEmail,
};
