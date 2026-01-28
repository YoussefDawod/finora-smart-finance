/**
 * Password Reset Service
 * Handles password changes, reset requests, and token management
 */

const User = require('../models/User');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const logger = require('../utils/logger');
const { validatePassword } = require('../validators/authValidation');

/**
 * Changes password for authenticated user
 * Requires current password verification
 * @returns {Object} { changed: boolean, error?: string, code?: string }
 */
async function changePassword(userId, currentPassword, newPassword) {
  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return {
      changed: false,
      error: passwordValidation.error,
      code: 'WEAK_PASSWORD',
    };
  }

  // Verify current password
  const user = await User.findById(userId);
  if (!user) {
    return { changed: false, error: 'Benutzer nicht gefunden', code: 'USER_NOT_FOUND' };
  }

  const isValid = await user.validatePassword(currentPassword);
  if (!isValid) {
    return {
      changed: false,
      error: 'Aktuelles Passwort ist falsch',
      code: 'INVALID_PASSWORD',
    };
  }

  // Set new password and clear all refresh tokens (logout all sessions)
  await user.setPassword(newPassword);
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  // Send security alert
  if (user.email && user.isVerified) {
    try {
      await emailService.sendSecurityAlert(user, 'password_change', {});
    } catch (notifyError) {
      logger.warn(`Password change notification skipped: ${notifyError.message}`);
    }
  }

  return { changed: true, message: 'Passwort geändert' };
}

/**
 * Initiates password reset process
 * Sends reset email to user
 * @returns {Object} { sent: true } - always true to prevent email enumeration
 */
async function initiatePasswordReset(email) {
  if (!email) {
    return { sent: true }; // Prevent email enumeration
  }

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return { sent: true };
  }

  // Check if password reset is allowed
  if (!user.isVerified) {
    return {
      sent: false,
      error: 'Email ist nicht verifiziert. Bitte zuerst verifizieren.',
      code: 'EMAIL_NOT_VERIFIED',
    };
  }

  if (!user.canResetPassword()) {
    return {
      sent: false,
      error: 'Passwort-Reset ist nicht möglich. Bitte verifiziere zuerst deine Email.',
      code: 'RESET_NOT_ALLOWED',
    };
  }

  // Generate reset token and send email
  const resetToken = user.generatePasswordReset();
  await user.save();
  await emailService.sendPasswordResetEmail(user, resetToken);

  return { sent: true };
}

/**
 * Completes password reset using token
 * @returns {Object} { reset: boolean, error?: string, code?: string }
 */
async function completePasswordReset(token, newPassword) {
  if (!token || !newPassword) {
    return {
      reset: false,
      error: 'Token und Passwort erforderlich',
      code: 'INVALID_INPUT',
    };
  }

  // Find user by reset token
  const tokenHash = authService.hashToken(token);
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return {
      reset: false,
      error: 'Ungültiger oder abgelaufener Token',
      code: 'INVALID_TOKEN',
    };
  }

  // Set new password and clear all sessions
  await user.setPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all existing sessions
  await user.save();

  // Send security alert
  if (user.email && user.isVerified) {
    try {
      await emailService.sendSecurityAlert(user, 'password_change', {});
    } catch (notifyError) {
      logger.warn(`Password reset notification skipped: ${notifyError.message}`);
    }
  }

  return { reset: true };
}

module.exports = {
  changePassword,
  initiatePasswordReset,
  completePasswordReset,
};
