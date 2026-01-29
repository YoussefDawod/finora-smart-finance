const crypto = require('crypto');
const User = require('../../models/User');
const authService = require('../../services/authService');
const emailService = require('../../utils/emailService');
const { validateEmail } = require('../../validators/authValidation');

async function changeEmail(req, res) {
  try {
    const { newEmail } = req.body || {};
    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error, code: 'INVALID_INPUT' });
    }

    const existing = await User.findOne({ email: emailValidation.email });
    if (existing) {
      return res.status(409).json({ error: 'Email bereits registriert', code: 'EMAIL_EXISTS' });
    }

    const user = req.user;
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = authService.hashToken(token);

    user.emailChangeToken = tokenHash;
    user.emailChangeNewEmail = emailValidation.email;
    user.emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await emailService.sendEmailChangeVerification(user, token, emailValidation.email);

    return res.status(200).json({
      success: true,
      data: { sent: true, message: 'Verifizierungs-Email gesendet', newEmail: emailValidation.email },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Email-Änderung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function verifyEmailChange(req, res) {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'Token fehlt', code: 'MISSING_TOKEN' });
    }

    const tokenHash = authService.hashToken(token);
    const user = await User.findOne({
      emailChangeToken: tokenHash,
      emailChangeExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' });
    }

    user.email = user.emailChangeNewEmail;
    user.emailChangeToken = undefined;
    user.emailChangeNewEmail = undefined;
    user.emailChangeExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, data: authService.sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Email-Verifizierung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  changeEmail,
  verifyEmailChange,
};
