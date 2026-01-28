/**
 * Email Verification Service
 * Handles email verification, resending verification emails, and email-related operations
 */

const User = require('../models/User');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const config = require('../config/env');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Sends verification email to user
 * @returns {Object} { sent: true, verificationLink?: string }
 */
async function sendVerificationEmail(user) {
  const verificationToken = user.generateVerification();
  await user.save();

  const emailResult = await emailService.sendVerificationEmail(user, verificationToken);

  const response = { sent: true };
  if (config.nodeEnv === 'development' && emailResult) {
    response.verificationLink = emailResult.link;
  }

  return response;
}

/**
 * Resends verification email for unverified users
 * @returns {Object} { sent: boolean, alreadyVerified?: boolean, verificationLink?: string }
 */
async function resendVerificationEmail(email) {
  if (!email) {
    return { sent: false, error: 'Email erforderlich' };
  }

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return { sent: true };
  }

  // Already verified
  if (user.isVerified) {
    return { sent: true, alreadyVerified: true };
  }

  // Send verification email
  const verificationToken = user.generateVerification();
  await user.save();

  const emailResult = await emailService.sendVerificationEmail(user, verificationToken);

  const response = { sent: true };
  if (config.nodeEnv === 'development' && emailResult) {
    response.verificationLink = emailResult.link;
  }

  return response;
}

/**
 * Verifies email using token from link
 * @returns {Object} { verified: boolean, error?: string, code?: string }
 */
async function verifyEmailByToken(token) {
  if (!token) {
    return { verified: false, error: 'Token fehlt', code: 'MISSING_TOKEN' };
  }

  const tokenHash = authService.hashToken(token);
  const user = await User.findOne({
    verificationToken: tokenHash,
    verificationExpires: { $gt: new Date() },
  });

  if (!user) {
    return { verified: false, error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' };
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  return { verified: true, user };
}

/**
 * Initiates email change process
 * @returns {Object} { sent: true, newEmail }
 */
async function initiateEmailChange(user, newEmail) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = authService.hashToken(token);

  user.emailChangeToken = tokenHash;
  user.emailChangeNewEmail = newEmail;
  user.emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  await emailService.sendEmailChangeVerification(user, token, newEmail);

  return {
    sent: true,
    message: 'Verifizierungs-Email gesendet',
    newEmail,
  };
}

/**
 * Verifies and completes email change
 * @returns {Object} { changed: boolean, email: string }
 */
async function verifyEmailChange(token) {
  if (!token) {
    return { changed: false, error: 'Token fehlt', code: 'MISSING_TOKEN' };
  }

  const tokenHash = authService.hashToken(token);
  const user = await User.findOne({
    emailChangeToken: tokenHash,
    emailChangeExpires: { $gt: new Date() },
  });

  if (!user) {
    return { changed: false, error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' };
  }

  user.email = user.emailChangeNewEmail;
  user.emailChangeToken = undefined;
  user.emailChangeNewEmail = undefined;
  user.emailChangeExpires = undefined;
  await user.save();

  return { changed: true, email: user.email };
}

/**
 * Adds email to users without email
 * @returns {Object} { sent: true, pendingEmail: string }
 */
async function addEmailToUser(user, email) {
  if (user.email) {
    return {
      sent: false,
      error: 'Sie haben bereits eine Email-Adresse. Nutzen Sie "Email ändern" stattdessen.',
      code: 'EMAIL_EXISTS',
    };
  }

  const token = user.generateEmailAddToken(email);
  await user.save();

  const emailResult = await emailService.sendAddEmailVerification(user, token, email);

  const response = {
    sent: true,
    message: 'Bestätigungs-Email gesendet. Bitte prüfen Sie Ihr Postfach.',
    pendingEmail: email,
  };

  if (config.nodeEnv === 'development' && emailResult) {
    response.verificationLink = emailResult.link;
    response.previewUrl = emailResult.previewUrl;
  }

  return response;
}

/**
 * Verifies and adds email to user
 * @returns {Object} { verified: boolean, email?: string }
 */
async function verifyAndAddEmail(token) {
  if (!token) {
    return { verified: false, error: 'Token fehlt', code: 'MISSING_TOKEN' };
  }

  const tokenHash = authService.hashToken(token);
  const user = await User.findOne({
    emailChangeToken: tokenHash,
    emailChangeExpires: { $gt: new Date() },
  });

  if (!user) {
    return { verified: false, error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' };
  }

  user.email = user.emailChangeNewEmail;
  user.isVerified = true;
  user.understoodNoEmailReset = false;
  user.emailChangeToken = undefined;
  user.emailChangeNewEmail = undefined;
  user.emailChangeExpires = undefined;
  await user.save();

  return {
    verified: true,
    email: user.email,
    message: 'Email erfolgreich hinzugefügt und verifiziert!',
  };
}

/**
 * Removes email from user account
 * @returns {Object} { removed: true }
 */
async function removeEmailFromUser(user) {
  if (!user.email) {
    return { removed: false, error: 'Keine Email zum Entfernen vorhanden', code: 'NO_EMAIL' };
  }

  user.removeEmail();
  user.understoodNoEmailReset = true;
  await user.save();

  return {
    removed: true,
    message: 'Email wurde entfernt. Password-Reset ist nicht mehr möglich.',
  };
}

/**
 * Resends verification for added email
 * @returns {Object} { sent: true }
 */
async function resendAddEmailVerification(user) {
  if (!user.emailChangeNewEmail) {
    return {
      sent: false,
      error: 'Keine ausstehende Email-Bestätigung vorhanden',
      code: 'NO_PENDING_EMAIL',
    };
  }

  const token = user.generateEmailAddToken(user.emailChangeNewEmail);
  await user.save();

  const emailResult = await emailService.sendAddEmailVerification(user, token, user.emailChangeNewEmail);

  const response = {
    sent: true,
    email: user.emailChangeNewEmail,
  };

  if (config.nodeEnv === 'development' && emailResult) {
    response.verificationLink = emailResult.link;
  }

  logger.info(`📧 Resend Add-Email Verification: ${user.emailChangeNewEmail}`);
  return response;
}

/**
 * Gets current email status
 * @returns {Object} email status information
 */
function getEmailStatus(user) {
  return {
    hasEmail: !!user.email,
    email: user.email || null,
    isVerified: user.isVerified,
    pendingEmail: user.emailChangeNewEmail || null,
    canResetPassword: !!user.email && user.isVerified,
    understoodNoEmailReset: user.understoodNoEmailReset,
  };
}

module.exports = {
  sendVerificationEmail,
  resendVerificationEmail,
  verifyEmailByToken,
  initiateEmailChange,
  verifyEmailChange,
  addEmailToUser,
  verifyAndAddEmail,
  removeEmailFromUser,
  resendAddEmailVerification,
  getEmailStatus,
};
