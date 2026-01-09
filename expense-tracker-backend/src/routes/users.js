const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/authMiddleware');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// Validierung für Passwort-Anforderungen
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Passwort muss mind. 8 Zeichen lang sein');
  if (!/[A-Z]/.test(password)) errors.push('Passwort muss Großbuchstaben enthalten');
  if (!/[a-z]/.test(password)) errors.push('Passwort muss Kleinbuchstaben enthalten');
  if (!/\d/.test(password)) errors.push('Passwort muss Ziffern enthalten');
  return errors;
}

// Email-Format Validierung
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Sensitive Fields entfernen
function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  delete obj.verificationToken;
  delete obj.verificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailChangeToken;
  delete obj.emailChangeNewEmail;
  delete obj.emailChangeExpires;
  delete obj.newEmailPending;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
}

// ============================================================================
// 1. GET /api/users/me - Aktuellen User abrufen
// ============================================================================
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    logger.error('GET /me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 2. PUT /api/users/me - User-Profil aktualisieren
// ============================================================================
router.put('/me', auth, async (req, res) => {
  try {
    const { name, lastName, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Validierung
    const errors = [];
    if (name !== undefined && typeof name !== 'string') {
      errors.push('Name muss ein String sein');
    }
    if (lastName !== undefined && typeof lastName !== 'string') {
      errors.push('LastName muss ein String sein');
    }
    if (phone !== undefined && typeof phone !== 'string') {
      errors.push('Phone muss ein String sein');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    // Aktualisieren
    if (name !== undefined) user.name = name.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone.trim() || null;
    if (avatar !== undefined) user.avatar = avatar || null;

    await user.save();
    logger.info(`User ${user._id} updated profile`);

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    logger.error('PUT /me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 3. POST /api/users/change-password - Passwort ändern
// ============================================================================
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Validierungen
    const errors = [];

    if (!currentPassword) {
      errors.push('Aktuelles Passwort erforderlich');
    }

    if (!newPassword) {
      errors.push('Neues Passwort erforderlich');
    }

    if (!confirmPassword) {
      errors.push('Passwort-Bestätigung erforderlich');
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.push('Passwörter stimmen nicht überein');
    }

    // Passwort-Stärke prüfen
    if (newPassword) {
      const strengthErrors = validatePasswordStrength(newPassword);
      errors.push(...strengthErrors);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    // Aktuelles Passwort verifizieren
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      logger.warn(`Failed password change attempt for user ${user._id}`);
      return res.status(400).json({ success: false, message: 'Aktuelles Passwort ist falsch' });
    }

    // Neues Passwort == altes Passwort prüfen
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Neues Passwort muss sich vom aktuellen unterscheiden' 
      });
    }

    // Passwort setzen (Hook hasht es)
    user.passwordHash = newPassword;
    await user.save();

    // Alle Refresh-Tokens invalidieren (User muss sich neu anmelden)
    user.refreshTokens = [];
    await user.save();

    logger.info(`User ${user._id} changed password`);
    res.json({ success: true, message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    logger.error('POST /change-password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 4. POST /api/users/change-email - Email ändern (mit Verifizierung)
// ============================================================================
router.post('/change-email', auth, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Validierungen
    const errors = [];

    if (!newEmail) {
      errors.push('Neue Email erforderlich');
    } else if (!validateEmail(newEmail)) {
      errors.push('Email-Format ungültig');
    }

    if (!password) {
      errors.push('Passwort erforderlich zur Bestätigung');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed email change attempt for user ${user._id}`);
      return res.status(400).json({ success: false, message: 'Passwort ist falsch' });
    }

    // Neue Email == aktuelle Email?
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Neue Email muss sich von der aktuellen unterscheiden' 
      });
    }

    // Neue Email schon registriert?
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email ist bereits registriert' });
    }

    // Token generieren
    const emailChangeToken = user.generateEmailChangeToken(newEmail.toLowerCase());
    await user.save();

    // Verification-Email senden
    const emailResult = await emailService.sendEmailChangeVerification(user, emailChangeToken, newEmail);

    logger.info(`Email change token generated for user ${user._id} (new: ${newEmail})`);

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
    logger.error('POST /change-email error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 5. GET /api/users/verify-email-change - Email-Change verifizieren
// ============================================================================
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
    logger.error('GET /verify-email-change error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 6. PUT /api/users/preferences - Einstellungen aktualisieren
// ============================================================================
router.put('/preferences', auth, async (req, res) => {
  try {
    const { theme, currency, timezone, language, emailNotifications } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Validierung
    const errors = [];
    const validThemes = ['light', 'dark', 'system'];
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];
    const validLanguages = ['en', 'de', 'fr'];

    if (theme !== undefined && !validThemes.includes(theme)) {
      errors.push(`Theme muss einer dieser Werte sein: ${validThemes.join(', ')}`);
    }

    if (currency !== undefined && !validCurrencies.includes(currency)) {
      errors.push(`Währung muss einer dieser Werte sein: ${validCurrencies.join(', ')}`);
    }

    if (language !== undefined && !validLanguages.includes(language)) {
      errors.push(`Sprache muss einer dieser Werte sein: ${validLanguages.join(', ')}`);
    }

    if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
      errors.push('emailNotifications muss ein Boolean sein');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    // Aktualisieren
    if (theme !== undefined) user.preferences.theme = theme;
    if (currency !== undefined) user.preferences.currency = currency;
    if (timezone !== undefined) user.preferences.timezone = timezone;
    if (language !== undefined) user.preferences.language = language;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;

    await user.save();
    logger.info(`User ${user._id} updated preferences`);

    res.json({ success: true, data: user.preferences });
  } catch (error) {
    logger.error('PUT /preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 7. DELETE /api/users/me - Account löschen (mit Cascade)
// ============================================================================
router.delete('/me', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Passwort erforderlich zur Bestätigung' });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed account deletion attempt for user ${user._id}`);
      return res.status(400).json({ success: false, message: 'Passwort ist falsch' });
    }

    const userId = user._id;

    // Cascade: Alle Transaktionen des Users löschen
    const deleteResult = await Transaction.deleteMany({ userId });
    logger.info(`Deleted ${deleteResult.deletedCount} transactions for user ${userId}`);

    // User löschen
    await User.deleteOne({ _id: userId });
    logger.warn(`User ${userId} account permanently deleted`);

    res.json({ 
      success: true, 
      message: 'Account wurde dauerhaft gelöscht',
      data: { deletedTransactions: deleteResult.deletedCount }
    });
  } catch (error) {
    logger.error('DELETE /me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 8. POST /api/users/export-data - Daten exportieren
// ============================================================================
router.post('/export-data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Alle Transaktionen des Users sammeln
    const transactions = await Transaction.find({ userId: user._id }).lean();

    // Daten-Objekt zusammenstellen
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        createdAt: user.createdAt,
        preferences: user.preferences
      },
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        amount: t.amount,
        category: t.category,
        type: t.type,
        description: t.description,
        date: t.date,
        createdAt: t.createdAt
      }))
    };

    // JSON als String
    const jsonData = JSON.stringify(exportData, null, 2);

    // Download-Header setzen
    const filename = `expense-tracker-export-${user._id}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonData);

    logger.info(`User ${user._id} exported data (${transactions.length} transactions)`);
  } catch (error) {
    logger.error('POST /export-data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// 9. DELETE /api/users/transactions - Alle Transaktionen löschen
// ============================================================================
router.delete('/transactions', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Passwort erforderlich zur Bestätigung' });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed transaction deletion attempt for user ${user._id}`);
      return res.status(400).json({ success: false, message: 'Passwort ist falsch' });
    }

    // Alle Transaktionen des Users löschen
    const deleteResult = await Transaction.deleteMany({ userId: user._id });

    logger.info(`User ${user._id} deleted all ${deleteResult.deletedCount} transactions`);

    res.json({ 
      success: true, 
      message: 'Alle Transaktionen wurden gelöscht',
      data: { deletedCount: deleteResult.deletedCount }
    });
  } catch (error) {
    logger.error('DELETE /transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
