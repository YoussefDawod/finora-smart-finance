// middleware/requestLogger.js
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Sensible Query-Parameter, die NICHT geloggt werden dürfen
const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'refreshToken',
  'accessToken',
  'apiKey',
  'key',
  'secret',
  'password',
]);

/**
 * Maskiert sensible Werte in Query-Parametern für sicheres Logging
 * @param {Object} query - Express req.query
 * @returns {Object} Kopie mit maskierten Werten
 */
function sanitizeQueryForLog(query) {
  if (!query || typeof query !== 'object') return {};
  const safe = {};
  for (const [key, value] of Object.entries(query)) {
    const safeKey = String(key);
    // eslint-disable-next-line security/detect-object-injection -- key aus Object.entries(), kein User-Input als Property-Accessor
    safe[safeKey] = SENSITIVE_QUERY_KEYS.has(safeKey.toLowerCase()) ? '[REDACTED]' : value;
  }
  return safe;
}

// Request-Logger Middleware
const requestLoggerMiddleware = (req, res, next) => {
  // Unique Request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;

  // Start time
  const startTime = Date.now();

  // Log incoming request — sensible Query-Parameter maskiert
  logger.info(`${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    query: sanitizeQueryForLog(req.query),
    ip: req.ip,
  });

  // Override res.json für Response-Logging
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    // Log outgoing response
    if (status >= 400) {
      logger.warn(`${req.method} ${req.path} - ${status}`, {
        requestId,
        status,
        duration: `${duration}ms`,
        error: data?.error,
        code: data?.code,
        message: data?.message,
      });
    } else {
      logger.info(`${req.method} ${req.path} - ${status}`, {
        requestId,
        status,
        duration: `${duration}ms`,
      });
    }

    // Call original with proper binding
    const result = originalJson.call(this, data);
    return result;
  };

  next();
};

module.exports = requestLoggerMiddleware;
