/**
 * Login Service
 * Handles login logic, authentication, and session management
 */

const User = require('../models/User');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const config = require('../config/env');
const logger = require('../utils/logger');

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

  const passwordValid = await user.validatePassword(password);
  if (!passwordValid) {
    return {
      success: false,
      error: 'Ungültige Zugangsdaten',
      code: 'INVALID_CREDENTIALS',
    };
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

  // Send security alert if email is verified
  if (user.email && user.isVerified) {
    try {
      await emailService.sendSecurityAlert(user, 'login', {
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
    } catch (notifyError) {
      logger.warn(`Login notification skipped: ${notifyError.message}`);
    }
  }

  return { tokens, user };
}

module.exports = {
  validateLoginInput,
  authenticateUser,
  checkEmailVerification,
  generateLoginSession,
};
