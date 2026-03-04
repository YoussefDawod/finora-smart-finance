/**
 * Standardisierter API Response Helper
 *
 * Alle API-Responses folgen einem einheitlichen Format:
 *
 * Erfolg:  { success: true,  data?, message?, ...extras }
 * Fehler:  { success: false, error, code, requestId }
 *
 * `requestId` wird automatisch aus `req.requestId` bezogen
 * (gesetzt durch requestLogger Middleware via UUID).
 */

const logger = require('./logger');

/**
 * Erfolgs-Response senden
 * @param {Object} res - Express Response
 * @param {Object} [options]
 * @param {*}      [options.data]    - Payload
 * @param {string} [options.message] - Optionale Nachricht
 * @param {number} [options.status=200] - HTTP Status
 * @param {Object} [options.extras]  - Zusätzliche Top-Level-Felder (z.B. pagination)
 */
function sendSuccess(res, { data, message, status = 200, ...extras } = {}) {
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  Object.assign(body, extras);
  return res.status(status).json(body);
}

/**
 * Fehler-Response senden
 * @param {Object} res  - Express Response
 * @param {Object} req  - Express Request (für requestId)
 * @param {Object} options
 * @param {string} options.error   - Fehlermeldung
 * @param {string} options.code    - Maschinenlesbarer Fehlercode
 * @param {number} [options.status=500] - HTTP Status
 * @param {Array}  [options.details] - Validierungsdetails
 */
function sendError(res, req, { error, code, status = 500, details } = {}) {
  const body = {
    success: false,
    error: error || 'Interner Serverfehler',
    code: code || 'INTERNAL_ERROR',
    requestId: req.requestId || 'N/A',
  };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/**
 * Server-Error loggen und standardisierte 500-Antwort senden
 * @param {Object} res  - Express Response
 * @param {Object} req  - Express Request (für requestId)
 * @param {string} context - Kontext für Logging (z.B. 'GET /api/transactions')
 * @param {Error}  error   - Fehler-Objekt
 */
function handleServerError(res, req, context, error) {
  logger.error(`${context} error:`, error);
  return sendError(res, req, {
    error: 'Serverfehler',
    code: 'SERVER_ERROR',
    status: 500,
  });
}

module.exports = { sendSuccess, sendError, handleServerError };
