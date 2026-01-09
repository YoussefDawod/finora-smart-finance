const config = require('../config/env');
const logger = require('./logger');

// For verification, hit backend /verify-email which then redirects to frontend status page
const backendBaseUrl = (config.apiUrl && config.apiUrl.replace(/\/api$/, '')) || 'http://localhost:5000';
// Password reset stays on frontend
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3001';

function buildLink(base, path, token) {
  const url = new URL(path, base);
  url.searchParams.set('token', token);
  return url.toString();
}

module.exports = {
  async sendVerificationEmail(user, token) {
    const link = buildLink(backendBaseUrl, '/verify-email', token);
    logger.info(`Verification email (DEV): ${user.email} -> ${link}`);
    return { link };
  },

  async sendPasswordResetEmail(user, token) {
    const link = buildLink(frontendBaseUrl, '/reset-password', token);
    logger.info(`Password reset email (DEV): ${user.email} -> ${link}`);
    return { link };
  },

  async sendEmailChangeVerification(user, token, newEmail) {
    const link = buildLink(frontendBaseUrl, '/verify-email-change', token);
    logger.info(`Email change verification (DEV): ${newEmail} -> ${link}`);
    return { link };
  },
};
