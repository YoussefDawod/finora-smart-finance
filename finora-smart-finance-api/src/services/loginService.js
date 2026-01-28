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
 * @returns {Object} { valid: boolean, error?: string, code?: string }
 */
function validateLoginInput(name, password) {
  if (!name || !password) {
    return {
      valid: false,
      error: 'Name und Passwort erforderlich',
      code: 'INVALID_INPUT',
    };
  }
  return { valid: true };
}

/**
 * Authenticates user by name and password
 * @returns {Object} { success: boolean, user?: User, error?: string, code?: string }
 */
async function authenticateUser(name, password) {
  const user = await User.findOne({ name: name.trim() });

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
