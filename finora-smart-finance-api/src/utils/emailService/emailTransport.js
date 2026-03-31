/**
 * Email Service - Transporter & Core Configuration
 * Resend HTTP API für Production (Render blockiert SMTP-Ports)
 * Nodemailer SMTP für Development
 */

const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const config = require('../../config/env');
const logger = require('../logger');

const backendBaseUrl =
  (config.apiUrl && config.apiUrl.replace(/\/api$/, '')) || 'http://localhost:5000';
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3000';

let transporter = null;
let resendClient = null;

/**
 * Initialisiert den Email-Transporter basierend auf Environment.
 * Production: Resend HTTP API (Render blockiert alle SMTP-Ports 25/465/587)
 * Development: Nodemailer SMTP oder Ethereal Testaccount
 * @returns {Promise<Object|null>} Der Transporter oder null
 */
async function initTransporter() {
  if (transporter) return transporter;

  if (config.nodeEnv === 'production') {
    const apiKey = config.resendApiKey;

    if (!apiKey) {
      logger.error(
        'RESEND_API_KEY is not set! Emails will not work. ' +
          'Render blocks all outbound SMTP ports — Resend HTTP API is required.'
      );
      return null;
    }

    resendClient = new Resend(apiKey);

    // Wrapper mit sendMail-Interface (kompatibel mit bestehendem Code)
    transporter = {
      sendMail: async ({ from, to, subject, html, text, replyTo, ...rest }) => {
        const payload = {
          from: from || config.smtp?.from || '"Finora" <finora@yellowdeveloper.de>',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        };
        if (text) payload.text = text;
        if (replyTo) payload.reply_to = replyTo;
        if (rest.cc) payload.cc = Array.isArray(rest.cc) ? rest.cc : [rest.cc];
        if (rest.bcc) payload.bcc = Array.isArray(rest.bcc) ? rest.bcc : [rest.bcc];

        const { data, error } = await resendClient.emails.send(payload);

        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }

        return { messageId: data?.id || 'resend-ok' };
      },
      verify: async () => {
        // API-Key testen durch Abruf der Domains
        const { error } = await resendClient.domains.list();
        if (error) throw new Error(`Resend API key invalid: ${error.message}`);
        return true;
      },
    };

    logger.info(
      `Email transporter initialized (Resend HTTP API) — from=${config.smtp?.from || 'finora@yellowdeveloper.de'}`
    );

    // Resend API-Key beim Start verifizieren
    try {
      await transporter.verify();
      logger.info('Resend API connection verified successfully');
    } catch (verifyError) {
      logger.error(`Resend verification FAILED: ${verifyError.message}`);
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
 * Prüft Email-Verbindung (für Admin-Diagnose)
 * @returns {Promise<Object>} Diagnose-Ergebnis
 */
async function verifySmtp() {
  const transport = await initTransporter();

  if (!transport) {
    return {
      ok: false,
      error: 'No transporter configured',
      provider: config.resendApiKey ? 'resend (key set but init failed)' : 'none',
      config: {
        hasResendKey: !!config.resendApiKey,
        smtpHost: config.smtp?.host || '(not set)',
        smtpPort: config.smtp?.port || '(not set)',
      },
    };
  }

  try {
    await transport.verify();
    return {
      ok: true,
      provider: resendClient ? 'resend' : 'smtp',
      config: resendClient
        ? { from: config.smtp?.from || 'finora@yellowdeveloper.de' }
        : {
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
      provider: resendClient ? 'resend' : 'smtp',
      config: resendClient
        ? { from: config.smtp?.from || 'finora@yellowdeveloper.de' }
        : {
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
