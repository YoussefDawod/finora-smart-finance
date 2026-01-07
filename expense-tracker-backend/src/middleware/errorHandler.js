// middleware/errorHandler.js
const logger = require('../utils/logger');

// Error Handler Middleware (MUSS ZULETZT sein!)
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'N/A';
  const status = err.statusCode || 500;
  const message = err.message || 'Interner Serverfehler';

  // Log Error
  logger.error(`Unhandled Error: ${message}`, {
    requestId,
    status,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Response
  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
