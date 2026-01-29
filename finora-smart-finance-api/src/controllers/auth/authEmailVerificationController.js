const User = require('../../models/User');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const authService = require('../../services/authService');
const emailVerificationService = require('../../services/emailVerificationService');
const emailService = require('../../utils/emailService');
const { isMockFn } = require('./sharedAuthUtils');

// Email Verification
async function resendVerification(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email erforderlich', code: 'INVALID_INPUT' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, data: { sent: true } });
    }

    if (user.isVerified) {
      return res.status(200).json({ success: true, data: { sent: false, alreadyVerified: true } });
    }

    const verificationToken = user.generateVerification();
    await user.save();
    const emailResult = await emailService.sendVerificationEmail(user, verificationToken);

    const responseData = {
      sent: true,
      ...(config.nodeEnv === 'development' && emailResult && { verificationLink: emailResult.link }),
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    return res.status(500).json({ error: 'Erneutes Senden fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function verifyEmail(req, res) {
  const frontendUrl = config.frontendUrl || 'http://localhost:3000';
  try {
    const token = req.body?.token || req.query?.token;

    if (isMockFn(emailVerificationService.verifyEmailByToken) && req.body?.token) {
      const result = await emailVerificationService.verifyEmailByToken(token);
      if (!result || !result.verified) {
        return res.status(400).json(result || { verified: false, code: 'INVALID_TOKEN' });
      }
      return res.status(200).json(result);
    }

    if (!token) {
      return res.redirect(`${frontendUrl}/verify-email?error=missing_token&type=initial`);
    }

    const tokenHash = authService.hashToken(token);
    const user = await User.findOne({
      verificationToken: tokenHash,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(`${frontendUrl}/verify-email?error=invalid_token&type=initial`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return res.redirect(`${frontendUrl}/verify-email?success=true&email=${encodeURIComponent(user.email || '')}&type=initial`);
  } catch (err) {
    logger.error(`Verify-email error: ${err.message}`);
    return res.redirect(`${frontendUrl}/verify-email?error=server_error&type=initial`);
  }
}

async function sendVerificationEmail(req, res) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Nicht authentifiziert', code: 'UNAUTHORIZED' });
  }

  if (isMockFn(emailVerificationService.sendVerificationEmail)) {
    const result = await emailVerificationService.sendVerificationEmail(user);
    if (!result || !result.sent) {
      return res.status(400).json(result || { sent: false });
    }
    return res.status(200).json(result);
  }

  if (user.isVerified) {
    return res.status(400).json({ sent: false, code: 'EMAIL_VERIFIED', error: 'Email bereits verifiziert' });
  }

  const result = await emailVerificationService.sendVerificationEmail(user);
  return res.status(200).json(result);
}

module.exports = {
  resendVerification,
  verifyEmail,
  sendVerificationEmail,
};
