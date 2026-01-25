/**
 * Auth Controller Module
 * Route-Handler für alle Auth-Endpoints
 */

const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const config = require('../config/env');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const authService = require('../services/authService');
const { validateName, validatePassword, validateEmail, validateOptionalEmail } = require('../validators/authValidation');

// ============================================
// REGISTRATION & LOGIN
// ============================================

/**
 * POST /api/auth/register
 * Registriert einen neuen Benutzer
 */
async function register(req, res) {
  try {
    const { name, password, email, understoodNoEmailReset } = req.body || {};

    // Name validieren (Pflicht)
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error, code: 'INVALID_NAME' });
    }

    // Password validieren (Pflicht)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error, code: 'INVALID_PASSWORD' });
    }

    // Prüfen ob Name bereits existiert
    const existingName = await User.findOne({ name: nameValidation.name });
    if (existingName) {
      return res.status(409).json({ error: 'Dieser Name ist bereits vergeben', code: 'NAME_EXISTS' });
    }

    // Email validieren (optional)
    const emailValidation = validateOptionalEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error, code: 'INVALID_EMAIL' });
    }

    if (emailValidation.email) {
      const existingEmail = await User.findOne({ email: emailValidation.email });
      if (existingEmail) {
        return res.status(409).json({ error: 'Diese Email ist bereits registriert', code: 'EMAIL_EXISTS' });
      }
    }

    // Wenn keine Email: Checkbox muss bestätigt sein
    if (!emailValidation.email && !understoodNoEmailReset) {
      return res.status(400).json({
        error: 'Bitte bestätigen Sie, dass Sie verstanden haben, dass ohne Email kein Passwort-Reset möglich ist',
        code: 'CHECKBOX_REQUIRED',
      });
    }

    // User erstellen
    const user = new User({
      name: nameValidation.name,
      email: emailValidation.email,
      understoodNoEmailReset: !emailValidation.email,
    });
    await user.setPassword(password);

    // Wenn Email: Verifizierungs-Email senden
    let verificationLink = null;
    if (emailValidation.email) {
      const verificationToken = user.generateVerification();
      await user.save();
      const emailResult = await emailService.sendVerificationEmail(user, verificationToken);
      if (config.nodeEnv === 'development' && emailResult) {
        verificationLink = emailResult.link;
      }
    } else {
      // Ohne Email: User ist direkt "verifiziert"
      user.isVerified = true;
      await user.save();
    }

    // Auto-Login: Tokens generieren
    const tokens = await authService.generateAuthTokens(user, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    const responseData = {
      ...authService.buildAuthResponse(tokens, user),
      ...(verificationLink && { verificationLink }),
    };

    return res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.name) {
        return res.status(409).json({ error: 'Dieser Name ist bereits vergeben', code: 'NAME_EXISTS' });
      }
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(409).json({ error: 'Diese Email ist bereits registriert', code: 'EMAIL_EXISTS' });
      }
    }
    return res.status(500).json({ error: 'Registrierung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

/**
 * POST /api/auth/login
 * Login mit Name und Passwort
 */
async function login(req, res, next) {
  try {
    const { name, password } = req.body || {};

    if (!name || !password) {
      return res.status(400).json({ error: 'Name und Passwort erforderlich', code: 'INVALID_INPUT' });
    }

    const user = await User.findOne({ name: name.trim() });
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Zugangsdaten', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Ungültige Zugangsdaten', code: 'INVALID_CREDENTIALS' });
    }

    // Email-Verifizierung prüfen
    if (user.email && !user.isVerified && config.nodeEnv !== 'development') {
      return res.status(403).json({
        error: 'Email nicht verifiziert. Bitte bestätigen Sie Ihre Email-Adresse.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Auto-verify in development
    if (user.email && !user.isVerified && config.nodeEnv === 'development') {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationExpires = undefined;
    }

    const tokens = await authService.generateAuthTokens(user, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      data: authService.buildAuthResponse(tokens, user),
    });
  } catch (err) {
    return next(err);
  }
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * GET /api/auth/me
 * Gibt aktuelle User-Daten zurück
 */
async function getMe(req, res) {
  return res.status(200).json({ success: true, data: authService.sanitizeUser(req.user) });
}

/**
 * PUT /api/auth/me
 * Aktualisiert Profil (Name)
 */
async function updateMe(req, res) {
  try {
    const { name } = req.body || {};
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error, code: 'INVALID_INPUT' });
    }

    const user = req.user;
    user.name = nameValidation.name;
    await user.save();

    return res.status(200).json({ success: true, data: authService.sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Profil-Update fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

/**
 * DELETE /api/auth/me
 * Löscht Account
 */
async function deleteMe(req, res) {
  try {
    const { email } = req.body || {};
    const user = req.user;

    if (email !== user.email) {
      return res.status(400).json({ error: 'Email stimmt nicht überein', code: 'EMAIL_MISMATCH' });
    }

    await Transaction.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({ success: true, data: { deleted: true, message: 'Account gelöscht' } });
  } catch (err) {
    return res.status(500).json({ error: 'Account-Löschung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

/**
 * POST /api/auth/refresh
 * Erneuert Access Token mit Refresh Token
 */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh-Token fehlt', code: 'MISSING_TOKEN' });
    }

    const user = await User.findByRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ error: 'Ungültiger Refresh-Token', code: 'INVALID_TOKEN' });
    }

    const validation = authService.validateRefreshToken(user, refreshToken);
    if (!validation.valid) {
      return res.status(401).json({ error: validation.error, code: 'TOKEN_EXPIRED' });
    }

    const tokens = await authService.rotateRefreshToken(user, refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: authService.buildAuthResponse(tokens, user),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Token-Refresh fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

/**
 * POST /api/auth/logout
 * Logout (entfernt Refresh Token)
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh-Token fehlt', code: 'MISSING_TOKEN' });
    }

    const user = await User.findByRefreshToken(refreshToken);
    if (user) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    return res.status(200).json({ success: true, data: { loggedOut: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Logout fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

/**
 * POST /api/auth/change-password
 * Ändert Passwort (mit aktuellem Passwort)
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Passwörter erforderlich', code: 'INVALID_INPUT' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error, code: 'WEAK_PASSWORD' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden', code: 'USER_NOT_FOUND' });
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Aktuelles Passwort ist falsch', code: 'INVALID_PASSWORD' });
    }

    await user.setPassword(newPassword);
    await user.save();

    return res.status(200).json({ success: true, data: { message: 'Passwort geändert' } });
  } catch (err) {
    return res.status(500).json({ error: 'Passwortänderung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

/**
 * POST /api/auth/forgot-password
 * Initiiert Passwort-Reset per Email
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email erforderlich', code: 'INVALID_INPUT' });
    }

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = user.generatePasswordReset();
      await user.save();
      await emailService.sendPasswordResetEmail(user, resetToken);
    }

    // Always return success to avoid leaking users
    return res.status(200).json({ success: true, data: { sent: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Anfrage fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

/**
 * POST /api/auth/reset-password
 * Setzt Passwort mit Reset-Token zurück
 */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: 'Ungültige Eingabe', code: 'INVALID_INPUT' });
    }

    const tokenHash = authService.hashToken(token);
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' });
    }

    await user.setPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, data: { reset: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Passwort-Zurücksetzen fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

// ============================================
// EMAIL VERIFICATION
// ============================================

/**
 * POST /api/auth/resend-verification
 * Sendet Verifizierungs-Email erneut
 */
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

/**
 * GET /api/auth/verify-email
 * Verifiziert Email via Link
 */
async function verifyEmail(req, res) {
  const frontendUrl = config.frontendUrl || 'http://localhost:3000';
  try {
    const { token } = req.query;
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

// ============================================
// EMAIL CHANGE
// ============================================

/**
 * POST /api/auth/change-email
 * Initiiert Email-Änderung
 */
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

/**
 * POST /api/auth/verify-email-change
 * Bestätigt Email-Änderung
 */
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

// ============================================
// EMAIL ADD (for users without email)
// ============================================

/**
 * POST /api/auth/add-email
 * Fügt Email für User ohne Email hinzu
 */
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

/**
 * GET /api/auth/verify-add-email
 * Verifiziert hinzugefügte Email via Link
 */
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

/**
 * POST /api/auth/verify-add-email
 * Verifiziert hinzugefügte Email via API
 */
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

/**
 * DELETE /api/auth/remove-email
 * Entfernt Email vom Account
 */
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

/**
 * POST /api/auth/resend-add-email-verification
 * Sendet Bestätigungs-Email für hinzugefügte Email erneut
 */
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

/**
 * GET /api/auth/email-status
 * Gibt Email-Status zurück
 */
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

// ============================================
// PREFERENCES
// ============================================

/**
 * PUT /api/auth/preferences
 * Aktualisiert User-Preferences
 */
async function updatePreferences(req, res) {
  try {
    const { theme, currency, timezone, language, notifications } = req.body || {};
    const user = req.user;

    user.preferences = user.preferences || {};

    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      user.preferences.theme = theme;
    }
    if (currency) {
      user.preferences.currency = currency;
    }
    if (timezone) {
      user.preferences.timezone = timezone;
    }
    if (language) {
      user.preferences.language = language;
    }
    if (notifications !== undefined) {
      user.preferences.notifications = notifications;
    }

    await user.save();

    return res.status(200).json({ success: true, data: authService.sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Preferences-Update fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

// ============================================
// DATA EXPORT & DELETION
// ============================================

/**
 * POST /api/auth/export-data
 * Exportiert User-Daten
 */
async function exportData(req, res) {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({ userId }).lean();

    const exportDataPayload = {
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        name: req.user.name,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        amount: t.amount,
        category: t.category,
        description: t.description,
        type: t.type,
        date: t.date,
        tags: t.tags,
        notes: t.notes,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      exportedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: { message: 'Daten exportiert', export: exportDataPayload },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Datenexport fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

/**
 * DELETE /api/auth/transactions
 * Löscht alle User-Transaktionen
 */
async function deleteTransactions(req, res) {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'Passwort erforderlich', code: 'MISSING_PASSWORD' });
    }

    const user = req.user;

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(400).json({ error: 'Passwort ist falsch', code: 'INVALID_PASSWORD' });
    }

    const result = await Transaction.deleteMany({ userId: user._id });

    return res.status(200).json({
      success: true,
      data: { message: 'Alle Transaktionen gelöscht', deletedCount: result.deletedCount },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Transaktionenlöschung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  // Registration & Login
  register,
  login,

  // Profile
  getMe,
  updateMe,
  deleteMe,

  // Tokens
  refresh,
  logout,

  // Password
  changePassword,
  forgotPassword,
  resetPassword,

  // Email Verification
  resendVerification,
  verifyEmail,

  // Email Change
  changeEmail,
  verifyEmailChange,

  // Email Add
  addEmail,
  verifyAddEmailGet,
  verifyAddEmailPost,
  removeEmail,
  resendAddEmailVerification,
  getEmailStatus,

  // Preferences
  updatePreferences,

  // Data Export & Deletion
  exportData,
  deleteTransactions,
};
