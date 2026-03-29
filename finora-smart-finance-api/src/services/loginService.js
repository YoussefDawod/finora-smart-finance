/**
 * Login Service
 * Handles login logic, authentication, and session management
 */

const User = require('../models/User');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const auditLogService = require('./auditLogService');
const config = require('../config/env');
const logger = require('../utils/logger');

// Account-Lockout-Konfiguration
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 Minuten

/**
 * Validates login input
 * @param {string} identifier - Username or email
 * @param {string} password
 * @returns {Object} { valid: boolean, error?: string, code?: string }
 */
function validateLoginInput(identifier, password) {
  if (!identifier || !password) {
    return {
      valid: false,
      error: 'Name/Email und Passwort erforderlich',
      code: 'INVALID_INPUT',
    };
  }
  return { valid: true };
}

/**
 * Authenticates user by name or email and password
 * @param {string} identifier - Username or email address
 * @param {string} password
 * @returns {Object} { success: boolean, user?: User, error?: string, code?: string }
 */
async function authenticateUser(identifier, password) {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');

  const user = isEmail
    ? await User.findOne({ email: trimmed.toLowerCase() })
    : await User.findOne({ name: trimmed });

  if (!user) {
    return {
      success: false,
      error: 'Ungültige Zugangsdaten',
      code: 'INVALID_CREDENTIALS',
    };
  }

  // Prüfe ob der Account gesperrt ist
  if (user.isActive === false) {
    return {
      success: false,
      error: 'Dein Account wurde gesperrt. Kontaktiere den Support für weitere Informationen.',
      code: 'ACCOUNT_BANNED',
    };
  }

  // Prüfe ob Account wegen zu vieler Fehlversuche temporär gesperrt ist
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMs = user.lockUntil.getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    logger.warn(`Account locked: ${user._id} — ${remainingMin} min remaining`);
    return {
      success: false,
      error: `Account vorübergehend gesperrt. Versuche es in ${remainingMin} Minute(n) erneut.`,
      code: 'ACCOUNT_LOCKED',
    };
  }

  const passwordValid = await user.validatePassword(password);
  if (!passwordValid) {
    // Fehlversuche hochzählen
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      logger.warn(`Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts: ${user._id}`);

      // Audit-Log: Account gesperrt
      auditLogService.log({
        action: 'USER_ACCOUNT_LOCKED',
        targetUserId: user._id,
        targetUserName: user.name,
        details: { failedAttempts: user.failedLoginAttempts },
      });

      // Security-Alert bei Lockout senden (falls E-Mail vorhanden)
      if (user.email && user.isVerified) {
        try {
          await emailService.sendSecurityAlert(user, 'account_locked', {
            failedAttempts: user.failedLoginAttempts,
          });
        } catch (notifyError) {
          logger.warn(`Lockout notification skipped: ${notifyError.message}`);
        }
      }
    }

    await user.save();

    // Audit-Log: Fehlgeschlagener Login
    auditLogService.log({
      action: 'USER_LOGIN_FAILED',
      targetUserId: user._id,
      targetUserName: user.name,
      details: { attempt: user.failedLoginAttempts },
    });

    return {
      success: false,
      error: 'Ungültige Zugangsdaten',
      code: 'INVALID_CREDENTIALS',
    };
  }

  // Erfolgreicher Login: Fehlversuche zurücksetzen
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
  }

  return { success: true, user };
}

/**
 * Checks email verification status
 * @returns {Object} { verified: boolean, error?: string, code?: string }
 */
function checkEmailVerification(user) {
  if (user.email && !user.isVerified && config.nodeEnv !== 'development') {
    return {
      verified: false,
      error: 'Email nicht verifiziert. Bitte bestätigen Sie Ihre Email-Adresse.',
      code: 'EMAIL_NOT_VERIFIED',
    };
  }

  // Auto-verify in development mode
  if (user.email && !user.isVerified && config.nodeEnv === 'development') {
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
  }

  return { verified: true };
}

/**
 * Generates login session and sends security alert
 * @returns {Object} { tokens, user }
 */
async function generateLoginSession(user, requestContext = {}) {
  // Generate tokens
  const tokens = await authService.generateAuthTokens(user, {
    userAgent: requestContext.userAgent,
    ip: requestContext.ip,
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Audit-Log: Erfolgreicher Login
  auditLogService.log({
    action: 'USER_LOGIN',
    targetUserId: user._id,
    targetUserName: user.name,
    details: { ip: requestContext.ip },
  });

  // Send security alert if email is verified (fire-and-forget — Login darf nicht auf SMTP warten)
  if (user.email && user.isVerified) {
    emailService
      .sendSecurityAlert(user, 'login', {
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      })
      .catch(notifyError => {
        logger.warn(`Login notification skipped: ${notifyError.message}`);
      });
  }

  return { tokens, user };
}

module.exports = {
  validateLoginInput,
  authenticateUser,
  checkEmailVerification,
  generateLoginSession,
};
