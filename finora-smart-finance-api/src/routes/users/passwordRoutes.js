const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const { validatePasswordChangeInput } = require('../../validators/userValidation');
const { loadUserOr404, handleServerError } = require('./userHelpers');

// POST /api/users/change-password - Passwort ändern
router.post('/change-password', auth, async (req, res) => {
  try {
    const { errors } = validatePasswordChangeInput(req.body || {});
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    // Aktuelles Passwort verifizieren
    const isPasswordValid = await user.comparePassword(req.body.currentPassword);
    if (!isPasswordValid) {
      logger.warn(`Failed password change attempt for user ${user._id}`);
      return res.status(400).json({ success: false, message: 'Aktuelles Passwort ist falsch' });
    }

    // Neues Passwort == altes Passwort prüfen
    const isSamePassword = await bcrypt.compare(req.body.newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Neues Passwort muss sich vom aktuellen unterscheiden' 
      });
    }

    // Passwort setzen (Hook hasht es)
    user.passwordHash = req.body.newPassword;
    await user.save();

    // Alle Refresh-Tokens invalidieren (User muss sich neu anmelden)
    user.refreshTokens = [];
    await user.save();

    logger.info(`User ${user._id} changed password`);
    res.json({ success: true, message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    handleServerError(res, 'POST /change-password', error);
  }
});

module.exports = router;
