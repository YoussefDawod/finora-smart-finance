/**
 * @deprecated Controller deaktiviert seit Phase 3 (Datenschutz-Hinweis-Umbau).
 * Bleibt als Reserve erhalten.
 *
 * Consent Controller
 * DSGVO Art. 7(1) — Serverseitige Protokollierung von Einwilligungen
 *
 * Express 5 leitet Fehler aus async-Handlern automatisch
 * an die Error-Middleware weiter – kein try/catch nötig.
 */

const ConsentLog = require('../models/ConsentLog');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ============================================
// POST /api/v1/consent
// ============================================
async function logConsent(req, res) {
  const { categories, consentVersion, consentType = 'cookie' } = req.body;

  // Validierung
  if (!consentVersion || typeof consentVersion !== 'string') {
    return sendError(res, req, {
      error: 'consentVersion ist erforderlich',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  }

  if (!categories || typeof categories !== 'object') {
    return sendError(res, req, {
      error: 'categories ist erforderlich',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  }

  // userId aus Auth-Token (optional — auch anonyme Besucher loggen)
  const userId = req.user?._id || null;

  await ConsentLog.create({
    userId,
    consentType,
    categories: {
      essential: categories.essential !== false,
      newsletter: Boolean(categories.newsletter),
    },
    consentVersion,
    ipAddress: req.ip,
    userAgent: (req.headers['user-agent'] || '').slice(0, 500),
  });

  logger.info(`Consent logged: type=${consentType} version=${consentVersion} user=${userId || 'anonymous'}`);

  return sendSuccess(res, {
    message: 'Consent logged',
    status: 201,
  });
}

module.exports = { logConsent };
