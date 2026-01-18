// middleware/requestLogger.js
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Request-Logger Middleware
const requestLoggerMiddleware = (req, res, next) => {
  // Unique Request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;

  // Start time
  const startTime = Date.now();

  // Log incoming request
  logger.info(`${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
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
    console.log('[LOGGER]  Response sent for', req.method, req.path, 'with status', status);
    return result;
  };

  next();
};

module.exports = requestLoggerMiddleware;
