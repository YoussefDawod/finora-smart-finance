/**
 * Rate Limiting Middleware
 * Schützt gegen Brute-Force-Angriffe und API-Missbrauch
 */

const rateLimit = require('express-rate-limit');

// Basis-Konfiguration
const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 Minuten
    max: options.max || 100, // Default: 100 Anfragen pro Fenster
    message: {
      error: options.message || 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true, // Rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // Use default keyGenerator (handles IPv6 correctly)
    validate: { xForwardedForHeader: false }
  });
};

// ============================================
// AUTH RATE LIMITERS
// ============================================

// Login: 5 Versuche pro 15 Minuten pro IP
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5,
  message: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.',
  skipSuccessfulRequests: true // Erfolgreiche Logins zählen nicht
});

// Registration: 3 pro Stunde pro IP
const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 3,
  message: 'Zu viele Registrierungsversuche. Bitte warten Sie 1 Stunde.'
});

// Password Reset Request: 3 pro Stunde pro IP
const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 3,
  message: 'Zu viele Password-Reset-Anfragen. Bitte warten Sie 1 Stunde.'
});

// Email Verification Resend: 5 pro 15 Minuten
const resendVerificationLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5,
  message: 'Zu viele Verifizierungs-Anfragen. Bitte warten Sie 15 Minuten.'
});

// ============================================
// GENERAL API RATE LIMITERS
// ============================================

// Genereller API-Limiter: 100 Anfragen pro 15 Minuten
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Zu viele API-Anfragen. Bitte warten Sie einen Moment.'
});

// Sensitive Operations (Password Change, Account Delete): 5 pro Stunde
const sensitiveOperationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5,
  message: 'Zu viele sensible Operationen. Bitte warten Sie 1 Stunde.'
});

// Email Operations (Add, Change, Remove): 10 pro Tag
const emailOperationLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 Stunden
  max: 10,
  message: 'Zu viele Email-Änderungen. Bitte warten Sie 24 Stunden.'
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
  apiLimiter,
  sensitiveOperationLimiter,
  emailOperationLimiter,
  createLimiter
};
