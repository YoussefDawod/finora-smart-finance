/**
 * Email Verification Service
 * Handles email verification and sending verification emails
 */

const User = require('../models/User');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Sends verification email to user
 * @param {Object} user - Mongoose user document
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
 * Verifies email using token from link
 * @param {string} token - Raw verification token
 * @returns {Object} { verified: boolean, error?: string, code?: string, user?: Object }
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

  // Welcome-Email senden (fire-and-forget)
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (err) {
    logger.warn(`Welcome email failed for ${user.email}: ${err.message}`);
  }

  return { verified: true, user };
}

module.exports = {
  sendVerificationEmail,
  verifyEmailByToken,
};
