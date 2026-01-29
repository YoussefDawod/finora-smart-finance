const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/authMiddleware');
const emailService = require('../../utils/emailService');
const logger = require('../../utils/logger');
const { sanitizeUser } = require('../../utils/userSanitizer');
const { validateEmailChangeInput } = require('../../validators/userValidation');
const { loadUserOr404, handleServerError } = require('./userHelpers');

// POST /api/users/change-email - Email ändern (mit Verifizierung)
router.post('/change-email', auth, async (req, res) => {
  try {
    const { errors, email: normalizedEmail } = validateEmailChangeInput(req.body || {});
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(req.body?.password);
    if (!isPasswordValid) {
      logger.warn(`Failed email change attempt for user ${user._id}`);
      return res.status(400).json({ success: false, message: 'Passwort ist falsch' });
    }

    // Neue Email == aktuelle Email?
    if (normalizedEmail && normalizedEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Neue Email muss sich von der aktuellen unterscheiden' 
      });
    }

    // Neue Email schon registriert?
    const existingUser = await User.findOne({ email: normalizedEmail.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email ist bereits registriert' });
    }

    // Token generieren
    const emailChangeToken = user.generateEmailChangeToken(normalizedEmail.toLowerCase());
    await user.save();

    // Verification-Email senden
    const emailResult = await emailService.sendEmailChangeVerification(user, emailChangeToken, normalizedEmail);

    logger.info(`Email change token generated for user ${user._id} (new: ${normalizedEmail})`);

    // Dev-Mode: Token zurückgeben für Testing
    const response = {
      success: true,
      message: 'Bestätigungs-Email gesendet'
    };

    if (process.env.NODE_ENV === 'development' && emailResult?.link) {
      response.verificationLink = emailResult.link;
    }

    res.json(response);
  } catch (error) {
    handleServerError(res, 'POST /change-email', error);
  }
});

// GET /api/users/verify-email-change - Email-Change verifizieren
router.get('/verify-email-change', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token erforderlich' });
    }

    // Token hashen und suchen
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ emailChangeToken: tokenHash });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token ungültig' });
    }

    // Token abgelaufen?
    if (new Date() > user.emailChangeExpires) {
      user.emailChangeToken = undefined;
      user.emailChangeNewEmail = undefined;
      user.emailChangeExpires = undefined;
      user.newEmailPending = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'Token ist abgelaufen' });
    }

    // Email aktualisieren
    const oldEmail = user.email;
    user.email = user.emailChangeNewEmail;
    user.emailChangeToken = undefined;
    user.emailChangeNewEmail = undefined;
    user.emailChangeExpires = undefined;
    user.newEmailPending = undefined;

    await user.save();

    logger.info(`User ${user._id} verified email change (${oldEmail} -> ${user.email})`);

    res.json({ 
      success: true, 
      message: 'Email erfolgreich geändert',
      data: sanitizeUser(user)
    });
  } catch (error) {
    handleServerError(res, 'GET /verify-email-change', error);
  }
});

module.exports = router;
