/**
 * Password Reset Service
 * Handles password changes, reset requests, and token management
 */

const User = require('../models/User');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const auditLogService = require('./auditLogService');
const logger = require('../utils/logger');
const { validatePassword } = require('../validators/authValidation');

/**
 * Changes password for authenticated user
 * Requires current password verification
 * @returns {Object} { changed: boolean, error?: string, code?: string }
 */
async function changePassword(userId, currentPassword, newPassword, requestContext = {}) {
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

  // Audit-Log: Passwort geändert
  auditLogService.log({
    action: 'PASSWORD_CHANGED',
    targetUserId: user._id,
    targetUserName: user.name,
    ip: requestContext.ip,
    userAgent: requestContext.userAgent,
  });

  // Fire-and-forget: Security Alert soll Response nicht blockieren
  if (user.email && user.isVerified) {
    emailService.sendSecurityAlert(user, 'password_change', {}).catch(notifyError => {
      logger.warn(`Password change notification skipped: ${notifyError.message}`);
    });
  }

  return { changed: true, message: 'Passwort geändert' };
}

/**
 * Initiates password reset process
 * Sends reset email to user
 * @returns {Object} { sent: true } - always true to prevent email enumeration
 */
async function initiatePasswordReset(email, requestContext = {}) {
  if (!email) {
    return { sent: true }; // Prevent email enumeration
  }

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return { sent: true };
  }

  // Sicherheit: Kein Unterschied in der Antwort, egal ob E-Mail
  // verifiziert ist oder Reset nicht erlaubt — verhindert E-Mail-Enumeration.
  // Probleme werden nur intern geloggt.
  if (!user.isVerified) {
    logger.info(`Password reset requested for unverified email: ${email}`);
    return { sent: true };
  }

  if (!user.canResetPassword()) {
    logger.info(`Password reset requested but not allowed for: ${email}`);
    return { sent: true };
  }

  // Generate reset token and send email
  const resetToken = user.generatePasswordReset();
  await user.save();

  // Fire-and-forget: SMTP soll Response nicht blockieren
  emailService.sendPasswordResetEmail(user, resetToken).catch(err => {
    logger.warn(`Password reset email failed for ${user.email}: ${err.message}`);
  });

  // Audit-Log: Passwort-Reset angefordert
  auditLogService.log({
    action: 'PASSWORD_RESET_REQUESTED',
    targetUserId: user._id,
    targetUserName: user.name,
    ip: requestContext.ip,
    userAgent: requestContext.userAgent,
  });

  return { sent: true };
}

/**
 * Completes password reset using token
 * @returns {Object} { reset: boolean, error?: string, code?: string }
 */
async function completePasswordReset(token, newPassword, requestContext = {}) {
  if (!token || !newPassword) {
    return {
      reset: false,
      error: 'Token und Passwort erforderlich',
      code: 'INVALID_INPUT',
    };
  }

  // Validate new password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return {
      reset: false,
      error: passwordValidation.error,
      code: 'WEAK_PASSWORD',
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

  // Audit-Log: Passwort-Reset abgeschlossen
  auditLogService.log({
    action: 'PASSWORD_RESET_COMPLETED',
    targetUserId: user._id,
    targetUserName: user.name,
    ip: requestContext.ip,
    userAgent: requestContext.userAgent,
  });

  // Fire-and-forget: Security Alert soll Response nicht blockieren
  if (user.email && user.isVerified) {
    emailService.sendSecurityAlert(user, 'password_change', {}).catch(notifyError => {
      logger.warn(`Password reset notification skipped: ${notifyError.message}`);
    });
  }

  return { reset: true };
}

module.exports = {
  changePassword,
  initiatePasswordReset,
  completePasswordReset,
};
