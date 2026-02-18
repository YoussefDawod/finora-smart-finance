/**
 * Email Service - Transporter & Core Configuration
 * Nodemailer Setup für Production/Development
 */

const nodemailer = require('nodemailer');
const config = require('../../config/env');
const logger = require('../logger');

const backendBaseUrl = (config.apiUrl && config.apiUrl.replace(/\/api$/, '')) || 'http://localhost:5000';
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3001';

let transporter = null;

/**
 * Initialisiert den Nodemailer Transporter basierend auf Environment
 * @returns {Promise<Object|null>} Der Transporter oder null
 */
async function initTransporter() {
  if (transporter) return transporter;

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
    logger.info('Email transporter initialized (Production SMTP)');
    logger.info('Hinweis: Stelle sicher, dass SPF/DKIM/DMARC konfiguriert sind!');
  } else if (config.nodeEnv === 'development') {
    if (config.smtp?.host && config.smtp?.user && config.smtp?.pass) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port || 465,
        secure: config.smtp.secure !== false,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      logger.info('Email transporter initialized (Development SMTP)');
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
        logger.info('Ethereal Test-Account erstellt:');
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

/**
 * Sendet eine Email
 * @param {string} to - Empfänger-Email
 * @param {string} subject - Betreff
 * @param {string} html - HTML-Inhalt
 * @param {string|null} textContent - Plain-Text (optional)
 * @param {Object} options - Zusätzliche Optionen (replyTo, cc, bcc, etc.)
 * @returns {Promise<Object>} Ergebnis mit sent-Status
 */
async function sendEmail(to, subject, html, textContent = null, options = {}) {
  const transport = await initTransporter();

  logger.info(`Email wird gesendet an: ${to}`);
  logger.info(`Betreff: ${subject}`);

  if (!transport) {
    logger.info(`[DEV-MODE] Email nicht gesendet (kein SMTP konfiguriert)`);
    return { sent: false, mode: 'log-only' };
  }

  try {
    const mailOptions = {
      from: config.smtp?.from || '"Finora" <noreply@finora.dawoddev.com>',
      to,
      subject,
      html,
      text: textContent || subject,
      ...options,
    };

    const info = await transport.sendMail(mailOptions);
    logger.info(`Email gesendet: ${info.messageId}`);

    if (info.messageId && config.nodeEnv === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`Preview URL: ${previewUrl}`);
        return { sent: true, messageId: info.messageId, previewUrl };
      }
    }

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email-Fehler: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initTransporter,
  buildLink,
  sendEmail,
  backendBaseUrl,
  frontendBaseUrl,
};
