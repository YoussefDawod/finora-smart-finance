/**
 * Newsletter Controller
 * Request/Response-Handling für Newsletter-Endpoints
 */

const newsletterService = require('../services/newsletterService');
const { sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const config = require('../config/env');
const { newsletterStatusPage } = require('../utils/emailTemplates/newsletterStatusPage');

/**
 * Leitet die Frontend-URL aus dem eingehenden Request ab.
 * In Production wird die konfigurierte FRONTEND_URL verwendet.
 * In Development wird der Host des Requests mit dem Frontend-Port kombiniert,
 * damit Links auch von anderen Geräten im Netzwerk funktionieren.
 */
function getFrontendUrl(req) {
  // Explizit gesetzte FRONTEND_URL hat Vorrang (Production)
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;

  // In Development: immer http (Vite Dev-Server läuft ohne SSL)
  const host = req.hostname || 'localhost';
  const frontendPort = config.frontendUrl?.match(/:(\d+)\/?$/)?.[1] || '3000';
  return `http://${host}:${frontendPort}`;
}

// Erlaubte Sprachen (konsistent mit Subscriber-Schema)
const ALLOWED_LANGUAGES = ['de', 'en', 'ar', 'ka'];

// ============================================
// POST /api/newsletter/subscribe
// ============================================
async function subscribe(req, res) {
  try {
    const { email, language } = req.body;

    if (!email) {
      return sendError(res, req, { error: 'E-Mail ist erforderlich', code: 'VALIDATION_ERROR', status: 400 });
    }

    if (typeof email !== 'string' || email.length > 254) {
      return sendError(res, req, { error: 'E-Mail darf maximal 254 Zeichen lang sein', code: 'VALIDATION_ERROR', status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, req, { error: 'Ungültiges E-Mail-Format', code: 'INVALID_EMAIL', status: 400 });
    }

    // Language validieren — nur erlaubte Werte, sonst Default 'de'
    const safeLang = (language && ALLOWED_LANGUAGES.includes(language)) ? language : 'de';

    const result = await newsletterService.subscribe(email, safeLang, req.headers.authorization);

    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    // Duplicate Key (Race Condition)
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: 'Bestätigungsmail wurde gesendet' });
    }
    logger.error(`Newsletter subscribe error: ${err.message}`);
    return sendError(res, req, { error: 'Fehler beim Abonnieren', code: 'SERVER_ERROR', status: 500 });
  }
}

// ============================================
// GET /api/newsletter/confirm?token=xxx
// ============================================
async function confirm(req, res) {
  try {
    const { token } = req.query;
    const feUrl = getFrontendUrl(req);
    if (!token) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de', feUrl));
    }

    const result = await newsletterService.confirmSubscription(token);
    if (!result) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de', feUrl));
    }

    return res.status(200).type('html').send(newsletterStatusPage('confirmed', result.lang, feUrl));
  } catch (err) {
    logger.error(`Newsletter confirm error: ${err.message}`);
    return res.status(500).type('html').send(newsletterStatusPage('error', req.query.lang || 'de', getFrontendUrl(req)));
  }
}

// ============================================
// GET /api/newsletter/unsubscribe?token=xxx
// ============================================
async function unsubscribe(req, res) {
  try {
    const { token } = req.query;
    const feUrl = getFrontendUrl(req);
    if (!token) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de', feUrl));
    }

    const result = await newsletterService.unsubscribeByToken(token);
    if (!result) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de', feUrl));
    }

    return res.status(200).type('html').send(newsletterStatusPage('unsubscribed', result.lang, feUrl));
  } catch (err) {
    logger.error(`Newsletter unsubscribe error: ${err.message}`);
    return res.status(500).type('html').send(newsletterStatusPage('error', req.query.lang || 'de', getFrontendUrl(req)));
  }
}

// ============================================
// GET /api/newsletter/status (authentifiziert)
// ============================================
async function getStatus(req, res) {
  try {
    const result = await newsletterService.getStatus(req.user.email);
    return res.json({ success: true, subscribed: result.subscribed });
  } catch (err) {
    logger.error(`Newsletter status error: ${err.message}`);
    return sendError(res, req, {
      error: 'Fehler beim Abrufen des Newsletter-Status',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

// ============================================
// POST /api/newsletter/toggle (authentifiziert)
// ============================================
async function toggle(req, res) {
  try {
    const userEmail = req.user.email;
    if (!userEmail) {
      return sendError(res, req, { error: 'Keine E-Mail-Adresse vorhanden', code: 'NO_EMAIL', status: 400 });
    }

    const result = await newsletterService.toggle(
      userEmail,
      req.user._id,
      req.body?.language || req.user.preferences?.language
    );

    return res.json({ success: true, subscribed: result.subscribed, message: result.message });
  } catch (err) {
    // Duplicate Key (Race Condition)
    if (err.code === 11000) {
      return res.json({ success: true, subscribed: true });
    }
    logger.error(`Newsletter toggle error: ${err.message}`);
    return sendError(res, req, {
      error: 'Fehler beim Ändern des Newsletter-Status',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

module.exports = {
  subscribe,
  confirm,
  unsubscribe,
  getStatus,
  toggle,
};
