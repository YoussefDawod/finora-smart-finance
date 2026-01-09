const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const config = require('../config/env');
const auth = require('../middleware/authMiddleware');
const emailService = require('../utils/emailService');

const ACCESS_TTL_SECONDS = 3600; // 1h
const REFRESH_TTL_SECONDS = 7 * 24 * 3600; // 7d

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    config.jwt.secret,
    { expiresIn: ACCESS_TTL_SECONDS }
  );
}

function newRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user) {
  const { _id, email, name, isVerified, createdAt, updatedAt } = user;
  return { id: _id.toString(), email, name, isVerified, createdAt, updatedAt };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email und Passwort erforderlich', code: 'INVALID_INPUT' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email bereits registriert', code: 'EMAIL_EXISTS' });

    const user = new User({ email, name: name || '' });
    await user.setPassword(password);
    const verificationToken = user.generateVerification();
    await user.save();

    const emailResult = await emailService.sendVerificationEmail(user, verificationToken);

    // In DEV-Mode: Return verification link so user can verify without email
    const responseData = {
      user: sanitizeUser(user),
      ...(config.nodeEnv === 'development' && emailResult && { verificationLink: emailResult.link })
    };

    return res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    return res.status(500).json({ error: 'Registrierung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    console.log('[LOGIN] Request body:', req.body);
    
    const { email, password } = req.body || {};
    console.log('[LOGIN] Email:', email, 'Password:', password ? '***' : 'missing');
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email und Passwort erforderlich', code: 'INVALID_INPUT' });
    }

    console.log('[LOGIN] Finding user by email...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('[LOGIN] User not found');
      return res.status(401).json({ error: 'Ungültige Zugangsdaten', code: 'INVALID_CREDENTIALS' });
    }
    
    console.log('[LOGIN] User found, validating password...');
    const valid = await user.validatePassword(password);
    
    if (!valid) {
      console.log('[LOGIN] Password invalid');
      return res.status(401).json({ error: 'Ungültige Zugangsdaten', code: 'INVALID_CREDENTIALS' });
    }
    
    if (!user.isVerified) {
      console.log('[LOGIN] Email not verified');
      return res.status(403).json({ error: 'Email nicht verifiziert', code: 'EMAIL_NOT_VERIFIED' });
    }

    console.log('[LOGIN] Creating tokens...');
    const accessToken = signAccessToken(user);
    const refreshToken = newRefreshToken();
    
    console.log('[LOGIN] Adding refresh token...');
    user.addRefreshToken(refreshToken, REFRESH_TTL_SECONDS, { userAgent: req.headers['user-agent'], ip: req.ip });
    
    console.log('[LOGIN] Saving user...');
    await user.save();

    console.log('[LOGIN] Login successful');
    return res.status(200).json({ success: true, data: { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS, user: sanitizeUser(user) } });
  } catch (err) {
    console.error('[LOGIN_CATCH]', err.message, err.stack);
    return next(err);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  return res.status(200).json({ success: true, data: sanitizeUser(req.user) });
});

// PUT /api/auth/me - Update profile (name)
router.put('/me', auth, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name ist erforderlich', code: 'INVALID_INPUT' });
    }
    
    const user = req.user;
    user.name = name.trim();
    await user.save();
    
    return res.status(200).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Profil-Update fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// DELETE /api/auth/me - Delete account
router.delete('/me', auth, async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = req.user;
    
    // Confirm email matches
    if (email !== user.email) {
      return res.status(400).json({ error: 'Email stimmt nicht überein', code: 'EMAIL_MISMATCH' });
    }
    
    // Delete all user's transactions
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({ userId: user._id });
    
    // Delete user
    await User.findByIdAndDelete(user._id);
    
    return res.status(200).json({ success: true, data: { deleted: true, message: 'Account gelöscht' } });
  } catch (err) {
    return res.status(500).json({ error: 'Account-Löschung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/change-email - Request email change
router.post('/change-email', auth, async (req, res) => {
  try {
    const { newEmail } = req.body || {};
    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ error: 'Gültige Email erforderlich', code: 'INVALID_INPUT' });
    }
    
    // Check if email already exists
    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      return res.status(409).json({ error: 'Email bereits registriert', code: 'EMAIL_EXISTS' });
    }
    
    const user = req.user;
    
    // Generate verification token for email change
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    user.emailChangeToken = tokenHash;
    user.emailChangeNewEmail = newEmail;
    user.emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save();
    
    // Send verification email to new address
    await emailService.sendEmailChangeVerification(user, token, newEmail);
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        sent: true, 
        message: 'Verifizierungs-Email gesendet',
        newEmail 
      } 
    });
  } catch (err) {
    return res.status(500).json({ error: 'Email-Änderung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/verify-email-change - Verify new email
router.post('/verify-email-change', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token fehlt', code: 'MISSING_TOKEN' });
    
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 
      emailChangeToken: tokenHash, 
      emailChangeExpires: { $gt: new Date() } 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' });
    }
    
    // Update email
    user.email = user.emailChangeNewEmail;
    user.emailChangeToken = undefined;
    user.emailChangeNewEmail = undefined;
    user.emailChangeExpires = undefined;
    await user.save();
    
    return res.status(200).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Email-Verifizierung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'Refresh-Token fehlt', code: 'MISSING_TOKEN' });
    const user = await User.findByRefreshToken(refreshToken);
    if (!user) return res.status(401).json({ error: 'Ungültiger Refresh-Token', code: 'INVALID_TOKEN' });

    // Validate expiry
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh-Token abgelaufen', code: 'TOKEN_EXPIRED' });
    }

    // Rotate token
    user.removeRefreshToken(refreshToken);
    const newRefresh = newRefreshToken();
    user.addRefreshToken(newRefresh, REFRESH_TTL_SECONDS, { userAgent: req.headers['user-agent'], ip: req.ip });
    await user.save();

    const accessToken = signAccessToken(user);
    return res.status(200).json({ success: true, data: { accessToken, refreshToken: newRefresh, expiresIn: ACCESS_TTL_SECONDS, user: sanitizeUser(user) } });
  } catch (err) {
    return res.status(500).json({ error: 'Token-Refresh fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'Refresh-Token fehlt', code: 'MISSING_TOKEN' });
    const user = await User.findByRefreshToken(refreshToken);
    if (user) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }
    return res.status(200).json({ success: true, data: { loggedOut: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Logout fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email erforderlich', code: 'INVALID_INPUT' });

    const user = await User.findOne({ email });
    if (!user) {
      // Do not leak user existence
      return res.status(200).json({ success: true, data: { sent: true } });
    }

    if (user.isVerified) {
      // Already verified
      return res.status(200).json({ success: true, data: { sent: false, alreadyVerified: true } });
    }

    const verificationToken = user.generateVerification();
    await user.save();
    const emailResult = await emailService.sendVerificationEmail(user, verificationToken);

    const responseData = {
      sent: true,
      ...(config.nodeEnv === 'development' && emailResult && { verificationLink: emailResult.link })
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    return res.status(500).json({ error: 'Erneutes Senden fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// GET /api/auth/verify-email?token=...
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token fehlt', code: 'MISSING_TOKEN' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ verificationToken: tokenHash, verificationExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' });
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    return res.status(200).json({ success: true, data: { verified: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Verifizierung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email erforderlich', code: 'INVALID_INPUT' });
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
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Ungültige Eingabe', code: 'INVALID_INPUT' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token', code: 'INVALID_TOKEN' });
    await user.setPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(200).json({ success: true, data: { reset: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Passwort-Zurücksetzen fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Passwörter erforderlich', code: 'INVALID_INPUT' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 8 Zeichen lang sein', code: 'WEAK_PASSWORD' });
    }

    const user = req.user;
    
    // Verify current password
    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Aktuelles Passwort ist falsch', code: 'INVALID_PASSWORD' });
    }

    // Set new password
    await user.setPassword(newPassword);
    await user.save();

    return res.status(200).json({ success: true, data: { message: 'Passwort geändert' } });
  } catch (err) {
    return res.status(500).json({ error: 'Passwortänderung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// PUT /api/auth/preferences - Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { theme, currency, timezone, language, notifications } = req.body || {};
    const user = req.user;

    // Update preferences (store as object or individual fields)
    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      user.preferences = user.preferences || {};
      user.preferences.theme = theme;
    }
    
    if (currency) {
      user.preferences = user.preferences || {};
      user.preferences.currency = currency;
    }
    
    if (timezone) {
      user.preferences = user.preferences || {};
      user.preferences.timezone = timezone;
    }
    
    if (language) {
      user.preferences = user.preferences || {};
      user.preferences.language = language;
    }
    
    if (notifications !== undefined) {
      user.preferences = user.preferences || {};
      user.preferences.notifications = notifications;
    }

    await user.save();

    return res.status(200).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Preferences-Update fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/export-data - Export user data
router.post('/export-data', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const Transaction = require('../models/Transaction');

    // Get all user's transactions
    const transactions = await Transaction.find({ userId }).lean();

    // Prepare export data
    const exportData = {
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        name: req.user.name,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
      transactions: transactions.map(t => ({
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

    // Return JSON data
    return res.status(200).json({ 
      success: true, 
      data: { 
        message: 'Daten exportiert',
        export: exportData 
      } 
    });
  } catch (err) {
    return res.status(500).json({ error: 'Datenexport fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

// DELETE /api/auth/transactions - Delete all user transactions
router.delete('/transactions', auth, async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'Passwort erforderlich', code: 'MISSING_PASSWORD' });
    }

    const user = req.user;
    
    // Verify password
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(400).json({ error: 'Passwort ist falsch', code: 'INVALID_PASSWORD' });
    }

    const Transaction = require('../models/Transaction');
    const result = await Transaction.deleteMany({ userId: user._id });

    return res.status(200).json({ 
      success: true, 
      data: { 
        message: 'Alle Transaktionen gelöscht',
        deletedCount: result.deletedCount 
      } 
    });
  } catch (err) {
    return res.status(500).json({ error: 'Transaktionenlöschung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
});

module.exports = router;
