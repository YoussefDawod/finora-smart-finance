/**
 * Email Service mit Nodemailer
 * Refactored: Templates ausgelagert in emailTemplates.js
 */

const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('./logger');
const templates = require('./emailTemplates');

// ============================================
// KONFIGURATION
// ============================================

const backendBaseUrl = (config.apiUrl && config.apiUrl.replace(/\/api$/, '')) || 'http://localhost:5000';
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3001';

// Nodemailer Transporter (singleton)
let transporter = null;

// ============================================
// TRANSPORTER INITIALISIERUNG
// ============================================

/**
 * Initialisiert den Nodemailer Transporter basierend auf Environment
 * @returns {Promise<Object|null>} Der Transporter oder null
 */
async function initTransporter() {
  if (transporter) return transporter;

  // Production: Echte SMTP-Konfiguration erforderlich
  if (config.nodeEnv === 'production') {
    if (!config.smtp?.host || !config.smtp?.user || !config.smtp?.pass) {
      logger.error('SMTP configuration missing in production!');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port || 587,
      secure: config.smtp.secure || false,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    logger.info('✅ Email transporter initialized (Production SMTP)');
    logger.info('💡 Hinweis: Stelle sicher, dass SPF/DKIM/DMARC konfiguriert sind!');
  }
  // Development: Nutze konfigurierte SMTP oder erstelle Ethereal Test-Account
  else if (config.nodeEnv === 'development') {
    if (config.smtp?.host && config.smtp?.user && config.smtp?.pass) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port || 587,
        secure: false,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      logger.info('✅ Email transporter initialized (Development SMTP)');
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        logger.info('📧 Ethereal Test-Account erstellt:');
        logger.info(`   User: ${testAccount.user}`);
        logger.info(`   Pass: ${testAccount.pass}`);
        logger.info('   Emails werden an Ethereal gesendet - Preview-Links im Log!');
      } catch (error) {
        logger.warn(`Ethereal account creation failed: ${error.message}`);
        logger.warn('No SMTP configured - emails will only be logged');
        transporter = null;
      }
    }
  } else {
    logger.warn('No SMTP configured - emails will only be logged');
    transporter = null;
  }

  return transporter;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Baut einen Link mit Token-Parameter
 * @param {string} base - Basis-URL
 * @param {string} path - Pfad
 * @param {string} token - Token
 * @returns {string} Vollständiger Link
 */
function buildLink(base, path, token) {
  const cleanBase = base.replace(/\/$/, '');
  const separator = path.includes('?') ? '&' : '?';
  return `${cleanBase}${path}${separator}token=${encodeURIComponent(token)}`;
}

// ============================================
// EMAIL SENDEN (Core)
// ============================================

/**
 * Sendet eine Email
 * @param {string} to - Empfänger-Email
 * @param {string} subject - Betreff
 * @param {string} html - HTML-Inhalt
 * @param {string|null} textContent - Plain-Text (optional)
 * @returns {Promise<Object>} Ergebnis mit sent-Status
 */
async function sendEmail(to, subject, html, textContent = null) {
  const transport = await initTransporter();

  logger.info(`📧 Email wird gesendet an: ${to}`);
  logger.info(`📧 Betreff: ${subject}`);

  if (!transport) {
    logger.info(`📧 [DEV-MODE] Email nicht gesendet (kein SMTP konfiguriert)`);
    return { sent: false, mode: 'log-only' };
  }

  try {
    const mailOptions = {
      from: config.smtp?.from || '"Finora" <noreply@finora.app>',
      to,
      subject,
      html,
      text: textContent || subject,
    };

    const info = await transport.sendMail(mailOptions);
    logger.info(`📧 Email gesendet: ${info.messageId}`);

    // Ethereal Preview URL (nur Development)
    if (info.messageId && config.nodeEnv === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`📧 Preview URL: ${previewUrl}`);
        return { sent: true, messageId: info.messageId, previewUrl };
      }
    }

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`📧 Email-Fehler: ${error.message}`);
    throw error;
  }
}

// ============================================
// PUBLIC API
// ============================================

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

/**
 * Password-Reset-Email senden
 * @param {Object} user - Der User
 * @param {string} token - Reset-Token
 * @returns {Promise<Object>}
 */
async function sendPasswordResetEmail(user, token) {
  const link = buildLink(frontendBaseUrl, '/reset-password', token);
  const name = user.name || 'Nutzer';

  logger.info(`📧 Password Reset: ${user.email} -> ${link}`);

  try {
    await sendEmail(user.email, '🔐 Passwort zurücksetzen - Finora', templates.passwordReset(name, link));
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

  logger.info(`📧 Email Change: ${newEmail} -> ${link}`);

  try {
    await sendEmail(newEmail, '✉️ Neue Email-Adresse bestätigen - Finora', templates.emailChange(name, link, newEmail));
  } catch (error) {
    logger.error(`Email change verification failed: ${error.message}`);
  }

  return { link };
}

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

module.exports = {
  sendVerificationEmail,
  sendAddEmailVerification,
  sendPasswordResetEmail,
  sendEmailChangeVerification,
  sendWelcomeEmail,
};
