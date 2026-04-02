/**
 * @fileoverview MongoDB NoSQL Injection Sanitizer Middleware
 * @description Sanitizes request body/params by removing dangerous keys ($, .),
 *              and blocks requests with dangerous query parameters (read-only in Express 5).
 */

const logger = require('../utils/logger');

/**
 * Recursively deletes keys starting with '$' or containing '.' from a mutable object.
 * @param {Object} obj - The object to sanitize in-place
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Recursively checks whether an object contains keys starting with '$' or containing '.'.
 * Does NOT mutate the object — safe for read-only objects like req.query in Express 5.
 * @param {Object} obj
 * @returns {boolean} true if dangerous keys are found
 */
function hasDangerousKeys(obj) {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) return true;
    if (typeof obj[key] === 'object' && hasDangerousKeys(obj[key])) return true;
  }
  return false;
}

/**
 * Express middleware that sanitizes body/params and rejects dangerous query strings.
 */
function mongoSanitizeMiddleware(req, res, next) {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);

  if (req.query && hasDangerousKeys(req.query)) {
    logger.warn('Blocked request with NoSQL injection attempt in query params', {
      ip: req.clientIp || req.ip,
      path: req.path,
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      code: 'INVALID_QUERY',
      requestId: req.requestId || 'N/A',
    });
  }

  next();
}

module.exports = { sanitizeObject, hasDangerousKeys, mongoSanitizeMiddleware };
