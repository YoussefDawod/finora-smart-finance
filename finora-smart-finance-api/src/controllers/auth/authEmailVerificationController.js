const User = require('../../models/User');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const authService = require('../../services/authService');
const emailService = require('../../utils/emailService');
const { sendError } = require('../../utils/responseHelper');

// Email Verification
async function resendVerification(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return sendError(res, req, {
        error: 'Email erforderlich',
        code: 'INVALID_INPUT',
        status: 400,
      });
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
      ...(config.nodeEnv === 'development' &&
        emailResult && { verificationLink: emailResult.link }),
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    logger.error('resendVerification error:', err);
    return sendError(res, req, {
      error: 'Erneutes Senden fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

async function verifyEmail(req, res) {
  const frontendUrl = config.frontendUrl || 'http://localhost:3000';
  try {
    const token = req.body?.token || req.query?.token;

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

    return res.redirect(
      `${frontendUrl}/verify-email?success=true&email=${encodeURIComponent(user.email || '')}&type=initial`
    );
  } catch (err) {
    logger.error(`Verify-email error: ${err.message}`);
    return res.redirect(`${frontendUrl}/verify-email?error=server_error&type=initial`);
  }
}

module.exports = {
  resendVerification,
  verifyEmail,
};
