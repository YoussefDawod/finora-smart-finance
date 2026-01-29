const User = require('../../models/User');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const authService = require('../../services/authService');
const emailService = require('../../utils/emailService');
const { validateEmail } = require('../../validators/authValidation');

async function addEmail(req, res) {
  try {
    const { email } = req.body || {};
    const user = req.user;

    if (user.email) {
      return res.status(400).json({
        error: 'Sie haben bereits eine Email-Adresse. Nutzen Sie "Email ändern" stattdessen.',
        code: 'EMAIL_EXISTS',
      });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error, code: 'INVALID_EMAIL' });
    }

    const existingEmail = await User.findOne({ email: emailValidation.email });
    if (existingEmail) {
      return res.status(409).json({ error: 'Diese Email ist bereits registriert', code: 'EMAIL_TAKEN' });
    }

    const token = user.generateEmailAddToken(emailValidation.email);
    await user.save();

    const emailResult = await emailService.sendAddEmailVerification(user, token, emailValidation.email);

    const responseData = {
      sent: true,
      message: 'Bestätigungs-Email gesendet. Bitte prüfen Sie Ihr Postfach.',
      pendingEmail: emailValidation.email,
      ...(config.nodeEnv === 'development' && emailResult && {
        verificationLink: emailResult.link,
        previewUrl: emailResult.previewUrl,
      }),
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    return res.status(500).json({ error: 'Email hinzufügen fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function verifyAddEmailGet(req, res) {
  const frontendUrl = config.frontendUrl || 'http://localhost:5173';
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(`${frontendUrl}/verify-email?error=missing_token&type=add`);
    }

    const tokenHash = authService.hashToken(token);
    const user = await User.findOne({
      emailChangeToken: tokenHash,
      emailChangeExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(`${frontendUrl}/verify-email?error=invalid_token&type=add`);
    }

    const verifiedEmail = user.emailChangeNewEmail;
    user.email = verifiedEmail;
    user.isVerified = true;
    user.understoodNoEmailReset = false;
    user.emailChangeToken = undefined;
    user.emailChangeNewEmail = undefined;
    user.emailChangeExpires = undefined;
    await user.save();

    return res.redirect(`${frontendUrl}/verify-email?success=true&email=${encodeURIComponent(verifiedEmail)}&type=add`);
  } catch (err) {
    logger.error(`Verify-add-email error: ${err.message}`);
    return res.redirect(`${frontendUrl}/verify-email?error=server_error&type=add`);
  }
}

async function verifyAddEmailPost(req, res) {
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
    user.isVerified = true;
    user.understoodNoEmailReset = false;
    user.emailChangeToken = undefined;
    user.emailChangeNewEmail = undefined;
    user.emailChangeExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { verified: true, email: user.email, message: 'Email erfolgreich hinzugefügt und verifiziert!' },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Email-Verifizierung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function removeEmail(req, res) {
  try {
    const { password, confirmRemoval } = req.body || {};

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'User nicht gefunden', code: 'INVALID_USER' });
    }

    if (!user.email) {
      return res.status(400).json({ error: 'Keine Email zum Entfernen vorhanden', code: 'NO_EMAIL' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Passwort erforderlich', code: 'MISSING_PASSWORD' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(400).json({ error: 'Passwort ist falsch', code: 'INVALID_PASSWORD' });
    }

    if (!confirmRemoval) {
      return res.status(400).json({
        error: 'Bitte bestätigen Sie, dass Sie verstehen: Ohne Email ist kein Passwort-Reset möglich!',
        code: 'CONFIRMATION_REQUIRED',
      });
    }

    user.removeEmail();
    user.understoodNoEmailReset = true;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { removed: true, message: 'Email wurde entfernt. Password-Reset ist nicht mehr möglich.' },
    });
  } catch (err) {
    logger.error(`Remove-email failed: ${err.message}`);
    return res.status(500).json({ error: 'Email entfernen fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function resendAddEmailVerification(req, res) {
  try {
    const user = req.user;

    if (!user.emailChangeNewEmail) {
      return res.status(400).json({
        error: 'Keine ausstehende Email-Bestätigung vorhanden',
        code: 'NO_PENDING_EMAIL',
      });
    }

    const token = user.generateEmailAddToken(user.emailChangeNewEmail);
    await user.save();

    const emailResult = await emailService.sendAddEmailVerification(user, token, user.emailChangeNewEmail);

    const responseData = {
      sent: true,
      email: user.emailChangeNewEmail,
      ...(config.nodeEnv === 'development' && emailResult && { verificationLink: emailResult.link }),
    };

    logger.info(`📧 Resend Add-Email Verification: ${user.emailChangeNewEmail}`);
    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    logger.error(`Resend add-email verification failed: ${err.message}`);
    return res.status(500).json({ error: 'Email erneut senden fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function getEmailStatus(req, res) {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      data: {
        hasEmail: !!user.email,
        email: user.email || null,
        isVerified: user.isVerified,
        pendingEmail: user.emailChangeNewEmail || null,
        canResetPassword: !!user.email && user.isVerified,
        understoodNoEmailReset: user.understoodNoEmailReset,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Status-Abfrage fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  addEmail,
  verifyAddEmailGet,
  verifyAddEmailPost,
  removeEmail,
  resendAddEmailVerification,
  getEmailStatus,
};
