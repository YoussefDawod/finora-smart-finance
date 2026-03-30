const User = require('../../models/User');
const Subscriber = require('../../models/Subscriber');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const authService = require('../../services/authService');
const emailService = require('../../utils/emailService');
const { validateEmail } = require('../../validators/authValidation');
const { sendError } = require('../../utils/responseHelper');

async function addEmail(req, res) {
  try {
    const { email } = req.body || {};
    const user = req.user;

    if (user.email) {
      return sendError(res, req, {
        error: 'Sie haben bereits eine Email-Adresse. Nutzen Sie "Email ändern" stattdessen.',
        code: 'EMAIL_EXISTS',
        status: 400,
      });
    }

    // Nur blockieren wenn bereits eine Email existiert UND Konto nicht verifiziert
    // Ohne Email muss der User eine hinzufügen dürfen, um sich zu verifizieren

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return sendError(res, req, {
        error: emailValidation.error,
        code: 'INVALID_EMAIL',
        status: 400,
      });
    }

    const existingEmail = await User.findOne({ email: emailValidation.email });
    if (existingEmail) {
      return sendError(res, req, {
        error: 'Diese Email ist bereits registriert',
        code: 'EMAIL_TAKEN',
        status: 409,
      });
    }

    const token = user.generateEmailAddToken(emailValidation.email);
    await user.save();

    // Fire-and-forget: SMTP soll Response nicht blockieren
    emailService.sendAddEmailVerification(user, token, emailValidation.email).catch(err => {
      logger.warn(`Add-email verification email failed: ${err.message}`);
    });

    const responseData = {
      sent: true,
      message: 'Bestätigungs-Email gesendet. Bitte prüfen Sie Ihr Postfach.',
      pendingEmail: emailValidation.email,
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    logger.error('addEmail error:', err);
    return sendError(res, req, {
      error: 'Email hinzufügen fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

async function verifyAddEmailGet(req, res) {
  const frontendUrl = config.frontendUrl || 'http://localhost:3000';
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

    // Alle Benachrichtigungen aktivieren wenn erstmals Email hinzugefügt
    if (!user.preferences) user.preferences = {};
    user.preferences.emailNotifications = true;
    user.preferences.notificationCategories = {
      security: true,
      transactions: true,
      reports: true,
      alerts: true,
    };
    user.markModified('preferences');

    await user.save();

    // Newsletter-Abo aktivieren (fire & forget)
    Subscriber.findOne({ email: verifiedEmail })
      .then(existingSub => {
        if (!existingSub) {
          const sub = new Subscriber({
            email: verifiedEmail,
            userId: user._id,
            isConfirmed: true,
            subscribedAt: new Date(),
            confirmedAt: new Date(),
            language: 'de',
          });
          sub.generateUnsubscribeToken();
          return sub.save();
        }
      })
      .catch(() => {});

    return res.redirect(
      `${frontendUrl}/verify-email?success=true&email=${encodeURIComponent(verifiedEmail)}&type=add`
    );
  } catch (err) {
    logger.error(`Verify-add-email error: ${err.message}`);
    return res.redirect(`${frontendUrl}/verify-email?error=server_error&type=add`);
  }
}

async function verifyAddEmailPost(req, res) {
  try {
    const { token } = req.body || {};
    if (!token) {
      return sendError(res, req, { error: 'Token fehlt', code: 'MISSING_TOKEN', status: 400 });
    }

    const tokenHash = authService.hashToken(token);
    const user = await User.findOne({
      emailChangeToken: tokenHash,
      emailChangeExpires: { $gt: new Date() },
    });

    if (!user) {
      return sendError(res, req, {
        error: 'Ungültiger oder abgelaufener Token',
        code: 'INVALID_TOKEN',
        status: 400,
      });
    }

    user.email = user.emailChangeNewEmail;
    user.isVerified = true;
    user.understoodNoEmailReset = false;
    user.emailChangeToken = undefined;
    user.emailChangeNewEmail = undefined;
    user.emailChangeExpires = undefined;

    // Alle Benachrichtigungen aktivieren wenn erstmals Email hinzugefügt
    if (!user.preferences) user.preferences = {};
    user.preferences.emailNotifications = true;
    user.preferences.notificationCategories = {
      security: true,
      transactions: true,
      reports: true,
      alerts: true,
    };
    user.markModified('preferences');

    await user.save();

    // Newsletter-Abo aktivieren (fire & forget)
    const verifiedEmailPost = user.email;
    Subscriber.findOne({ email: verifiedEmailPost })
      .then(existingSub => {
        if (!existingSub) {
          const sub = new Subscriber({
            email: verifiedEmailPost,
            userId: user._id,
            isConfirmed: true,
            subscribedAt: new Date(),
            confirmedAt: new Date(),
            language: 'de',
          });
          sub.generateUnsubscribeToken();
          return sub.save();
        }
      })
      .catch(() => {});

    return res.status(200).json({
      success: true,
      data: {
        verified: true,
        email: user.email,
        message: 'Email erfolgreich hinzugefügt und verifiziert!',
      },
    });
  } catch (err) {
    logger.error('verifyAddEmailPost error:', err);
    return sendError(res, req, {
      error: 'Email-Verifizierung fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

async function removeEmail(req, res) {
  try {
    const { password, confirmRemoval } = req.body || {};

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return sendError(res, req, {
        error: 'User nicht gefunden',
        code: 'INVALID_USER',
        status: 401,
      });
    }

    if (!user.email) {
      return sendError(res, req, {
        error: 'Keine Email zum Entfernen vorhanden',
        code: 'NO_EMAIL',
        status: 400,
      });
    }

    if (!password) {
      return sendError(res, req, {
        error: 'Passwort erforderlich',
        code: 'MISSING_PASSWORD',
        status: 400,
      });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return sendError(res, req, {
        error: 'Passwort ist falsch',
        code: 'INVALID_PASSWORD',
        status: 400,
      });
    }

    if (!confirmRemoval) {
      return sendError(res, req, {
        error:
          'Bitte bestätigen Sie, dass Sie verstehen: Ohne Email ist kein Passwort-Reset möglich!',
        code: 'CONFIRMATION_REQUIRED',
        status: 400,
      });
    }

    user.removeEmail();
    user.understoodNoEmailReset = true;
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        removed: true,
        message: 'Email wurde entfernt. Passwort-Reset ist nicht mehr möglich.',
      },
    });
  } catch (err) {
    logger.error(`Remove-email failed: ${err.message}`);
    return sendError(res, req, {
      error: 'Email entfernen fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

async function resendAddEmailVerification(req, res) {
  try {
    const user = req.user;

    if (!user.emailChangeNewEmail) {
      return sendError(res, req, {
        error: 'Keine ausstehende Email-Bestätigung vorhanden',
        code: 'NO_PENDING_EMAIL',
        status: 400,
      });
    }

    const token = user.generateEmailAddToken(user.emailChangeNewEmail);
    await user.save();

    // Fire-and-forget: SMTP soll Response nicht blockieren
    emailService.sendAddEmailVerification(user, token, user.emailChangeNewEmail).catch(err => {
      logger.warn(`Resend add-email verification failed: ${err.message}`);
    });

    const responseData = {
      sent: true,
      email: user.emailChangeNewEmail,
    };

    logger.info(`📧 Resend Add-Email Verification: ${user.emailChangeNewEmail}`);
    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    logger.error(`Resend add-email verification failed: ${err.message}`);
    return sendError(res, req, {
      error: 'Email erneut senden fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
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
    logger.error('getEmailStatus error:', err);
    return sendError(res, req, {
      error: 'Status-Abfrage fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
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
