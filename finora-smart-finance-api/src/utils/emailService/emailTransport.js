/**
 * Email Service - Transporter & Core Configuration
 * Nodemailer SMTP für Production & Development
 */

const nodemailer = require('nodemailer');
const net = require('net');
const dns = require('dns');
const config = require('../../config/env');
const logger = require('../logger');

const backendBaseUrl =
  (config.apiUrl && config.apiUrl.replace(/\/api$/, '')) || 'http://localhost:5000';
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3000';

let transporter = null;

/**
 * Testet TCP-Erreichbarkeit eines Host:Port — gibt ms oder Fehler zurück
 */
function testTcp(host, port, timeoutMs = 8000) {
  return new Promise(resolve => {
    const start = Date.now();
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, error: `timeout ${timeoutMs}ms`, ms: timeoutMs });
    }, timeoutMs);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ ok: true, ms: Date.now() - start });
    });
    socket.on('error', err => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.message, ms: Date.now() - start });
    });
  });
}

/**
 * Führt eine umfassende SMTP-Netzwerk-Diagnose durch (beim Start + Admin-Endpoint)
 */
async function runSmtpDiagnostics() {
  const targets = [
    // Aktueller SMTP (Netcup)
    { label: 'Netcup-465', host: 'mxf90a.netcup.net', port: 465 },
    { label: 'Netcup-587', host: 'mxf90a.netcup.net', port: 587 },
    // Alter SMTP (All-Inkl) — Referenztest: hat von Render funktioniert
    { label: 'AllInkl-465', host: 'w02133ad.kasserver.com', port: 465 },
    // Gmail — Canary: wenn das klappt, blockiert Render SMTP nicht
    { label: 'Gmail-465', host: 'smtp.gmail.com', port: 465 },
    // Netcup über aufgelöste IPv4 direkt
    { label: 'Netcup-IPv4-465', host: '46.38.249.10', port: 465 },
    { label: 'Netcup-IPv4-587', host: '46.38.249.10', port: 587 },
  ];

  const results = {};
  for (const t of targets) {
    const r = await testTcp(t.host, t.port, 8000);
    results[t.label] = `${r.ok ? 'OK' : 'FAIL'} (${r.ok ? r.ms + 'ms' : r.error})`;
    logger.info(`[SMTP-DIAG] ${t.label} ${t.host}:${t.port} → ${results[t.label]}`);
  }

  // DNS-Info
  try {
    const ipv4 = await dns.promises.resolve4('mxf90a.netcup.net');
    results['Netcup-DNS-IPv4'] = ipv4.join(', ');
  } catch (e) {
    results['Netcup-DNS-IPv4'] = `FAIL: ${e.code}`;
  }
  try {
    const ipv6 = await dns.promises.resolve6('mxf90a.netcup.net');
    results['Netcup-DNS-IPv6'] = ipv6.join(', ');
  } catch (e) {
    results['Netcup-DNS-IPv6'] = `FAIL: ${e.code}`;
  }

  return results;
}

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

    const smtpPort = config.smtp.port || 465;
    const smtpSecure = config.smtp.secure !== false;

    logger.info(
      `SMTP Config: host=${config.smtp.host} port=${smtpPort} secure=${smtpSecure} user=${config.smtp.user}`
    );

    // Netzwerk-Diagnose — testet Erreichbarkeit verschiedener SMTP-Server
    await runSmtpDiagnostics();

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

    logger.info('Email transporter initialized (Production SMTP)');

    // SMTP-Verbindung + Auth verifizieren
    try {
      await transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (verifyError) {
      logger.error(
        `SMTP verification FAILED: ${verifyError.message} (host=${config.smtp.host} port=${smtpPort} secure=${smtpSecure})`
      );
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
 * Prüft SMTP-Verbindung (für Admin-Diagnose)
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

  // Netzwerk-Diagnose einschließen
  const diagnostics = await runSmtpDiagnostics();

  try {
    await transport.verify();
    return {
      ok: true,
      diagnostics,
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
      diagnostics,
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
  runSmtpDiagnostics,
  backendBaseUrl,
  frontendBaseUrl,
};
