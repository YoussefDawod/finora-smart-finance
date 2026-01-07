/**
 * Custom Error Types für strukturierte Fehlerbehandlung
 */

// ============================================
// API ERROR
// ============================================
export class APIError extends Error {
  constructor(message, statusCode, endpoint, responseData = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.responseData = responseData;
    this.timestamp = new Date().toISOString();
    this.isRetryable = statusCode >= 500 || statusCode === 429;
  }
}

// ============================================
// VALIDATION ERROR
// ============================================
export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields; // { fieldName: 'error message' }
  }
}

// ============================================
// NETWORK ERROR
// ============================================
export class NetworkError extends Error {
  constructor(message = 'Netzwerkfehler - Bitte Verbindung prüfen') {
    super(message);
    this.name = 'NetworkError';
    this.isRetryable = true;
  }
}

// ============================================
// AUTHENTICATION ERROR
// ============================================
export class AuthenticationError extends Error {
  constructor(message = 'Authentifizierung fehlgeschlagen') {
    super(message);
    this.name = 'AuthenticationError';
    this.requiresLogin = true;
  }
}

// ============================================
// TIMEOUT ERROR
// ============================================
export class TimeoutError extends Error {
  constructor(message = 'Anfrage hat zu lange gedauert', timeout) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    this.isRetryable = true;
  }
}

// ============================================
// ERROR HANDLER UTILITY
// ============================================

/**
 * Zentrale Fehlerbehandlung für strukturierte Error-Responses
 * @param {Error} error - Der zu behandelnde Fehler
 * @returns {Object} Strukturiertes Error-Objekt
 */
export const handleError = (error) => {
  // API Error
  if (error instanceof APIError) {
    return {
      type: 'api',
      message: error.message,
      statusCode: error.statusCode,
      endpoint: error.endpoint,
      canRetry: error.isRetryable,
      userMessage: getUserFriendlyMessage(error.statusCode, error.message),
    };
  }

  // Validation Error
  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      fields: error.fields,
      canRetry: false,
      userMessage: 'Bitte überprüfe deine Eingaben',
    };
  }

  // Network Error
  if (error instanceof NetworkError) {
    return {
      type: 'network',
      message: error.message,
      canRetry: true,
      userMessage: 'Keine Internetverbindung - Bitte erneut versuchen',
    };
  }

  // Authentication Error
  if (error instanceof AuthenticationError) {
    return {
      type: 'auth',
      message: error.message,
      canRetry: false,
      requiresLogin: true,
      userMessage: 'Bitte melde dich erneut an',
    };
  }

  // Timeout Error
  if (error instanceof TimeoutError) {
    return {
      type: 'timeout',
      message: error.message,
      canRetry: true,
      userMessage: 'Anfrage dauerte zu lange - Bitte erneut versuchen',
    };
  }

  // Unknown Error
  return {
    type: 'unknown',
    message: error.message || 'Ein unbekannter Fehler ist aufgetreten',
    canRetry: true,
    userMessage: 'Ein unerwarteter Fehler ist aufgetreten',
  };
};

/**
 * Benutzerfreundliche Fehlermeldungen basierend auf HTTP Status Codes
 */
const getUserFriendlyMessage = (statusCode, originalMessage) => {
  const messages = {
    400: 'Ungültige Anfrage - Bitte überprüfe deine Eingaben',
    401: 'Nicht authentifiziert - Bitte melde dich an',
    403: 'Zugriff verweigert - Keine Berechtigung',
    404: 'Ressource nicht gefunden',
    409: 'Konflikt - Daten wurden bereits geändert',
    422: 'Validierungsfehler - Bitte überprüfe deine Eingaben',
    429: 'Zu viele Anfragen - Bitte warte einen Moment',
    500: 'Serverfehler - Bitte später erneut versuchen',
    502: 'Server nicht erreichbar',
    503: 'Service vorübergehend nicht verfügbar',
    504: 'Server antwortet nicht',
  };

  return messages[statusCode] || originalMessage || 'Ein Fehler ist aufgetreten';
};

/**
 * Error Logger für Produktionsumgebungen
 */
export const logError = (error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // In Development: Console
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorLog);
  }

  // In Production: Send to monitoring service
  if (import.meta.env.PROD) {
    // Hier könnte Sentry/LogRocket Integration stehen:
    // Sentry.captureException(error, { extra: errorLog });
  }

  return errorLog;
};

/**
 * Retry Utility für fehlerhafte Requests
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Nur retryable Errors wiederholen
      const errorInfo = handleError(error);
      if (!errorInfo.canRetry || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential Backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
