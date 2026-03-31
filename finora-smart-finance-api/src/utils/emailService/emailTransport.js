/**
 * Email Service - Transporter & Core Configuration
 * Nodemailer Setup für Production/Development
 */

const nodemailer = require('nodemailer');
const config = require('../../config/env');
const logger = require('../logger');

const backendBaseUrl =
  (config.apiUrl && config.apiUrl.replace(/\/api$/, '')) || 'http://localhost:5000';
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3000';

let transporter = null;

/**
 * Initialisiert den Nodemailer Transporter basierend auf Environment
 * @returns {Promise<Object|null>} Der Transporter oder null
 */
async function initTransporter() {
  if (transporter) return transporter;

  if (config.nodeEnv === 'production') {
    if (!config.smtp?.host || !config.smtp?.user || !config.smtp?.pass) {
      logger.error('SMTP configuration missing in production!', {
        hasHost: !!config.smtp?.host,
        hasUser: !!config.smtp?.user,
        hasPass: !!config.smtp?.pass,
      });
      return null;
    }

    const smtpPort = config.smtp.port || 465;
    const smtpSecure = config.smtp.secure !== false;

    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    logger.info('Email transporter initialized (Production SMTP)', {
      host: config.smtp.host,
      port: smtpPort,
      secure: smtpSecure,
      user: config.smtp.user,
    });

    // SMTP-Verbindung + Auth beim Start verifizieren
    try {
      await transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (verifyError) {
      logger.error(`SMTP verification FAILED: ${verifyError.message}`, {
        code: verifyError.code,
        host: config.smtp.host,
        port: smtpPort,
      });
      // Transporter bleibt erstellt — Emails werden bei jedem Versuch fehlschlagen
      // und der Fehler wird in den Fire-and-forget .catch()-Handlern geloggt
    }
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
        logger.info('Ethereal Test-Account erstellt (Credentials werden nicht geloggt)');
        logger.info(`   User: ${testAccount.user}`);
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
      from: config.smtp?.from || '"Finora" <finora@yellowdeveloper.de>',
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

/**
 * Prüft SMTP-Verbindung und Auth (für Admin-Diagnose)
 * @returns {Promise<Object>} Diagnose-Ergebnis
 */
async function verifySmtp() {
  const transport = await initTransporter();

  if (!transport) {
    return {
      ok: false,
      error: 'No transporter configured',
      config: {
        host: config.smtp?.host || '(not set)',
        port: config.smtp?.port || '(not set)',
        secure: config.smtp?.secure,
        user: config.smtp?.user || '(not set)',
        hasPass: !!config.smtp?.pass,
      },
    };
  }

  try {
    await transport.verify();
    return {
      ok: true,
      config: {
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        user: config.smtp.user,
        from: config.smtp.from,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      config: {
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        user: config.smtp.user,
        hasPass: !!config.smtp.pass,
      },
    };
  }
}

module.exports = {
  initTransporter,
  buildLink,
  sendEmail,
  verifySmtp,
  backendBaseUrl,
  frontendBaseUrl,
};
