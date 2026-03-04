// middleware/errorHandler.js
const logger = require('../utils/logger');
const { sendError } = require('../utils/responseHelper');

// Error Handler Middleware (MUSS ZULETZT sein!)
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'N/A';
  const status = err.statusCode || 500;
  const message = err.message || 'Interner Serverfehler';

  // Log Error (immer die echte Fehlermeldung loggen)
  logger.error(`Unhandled Error: ${message}`, {
    requestId,
    status,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Response: In Production keine internen Fehlermeldungen an den Client leaken.
  // Nur bewusst gesetzte statusCode-Fehler (z.B. 400, 404) geben ihre Message weiter.
  const isProduction = process.env.NODE_ENV === 'production';
  const isServerError = status >= 500;
  const clientMessage = (isProduction && isServerError)
    ? 'Interner Serverfehler'
    : message;

  sendError(res, req, {
    error: clientMessage,
    code: err.code || 'INTERNAL_ERROR',
    status,
  });
};

module.exports = errorHandler;
