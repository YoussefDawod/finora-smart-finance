const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const { sensitiveOperationLimiter } = require('../../middleware/rateLimiter');
const logger = require('../../utils/logger');
const { sendError } = require('../../utils/responseHelper');
const { validatePasswordChangeInput } = require('../../validators/userValidation');
const { loadUserOr404 } = require('./userHelpers');
const { handleServerError } = require('../../utils/responseHelper');

/**
 * @openapi
 * /users/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Passwort ändern
 *     description: Ändert das Passwort. Invalidiert alle bestehenden Refresh-Tokens.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Passwort geändert
 *       400:
 *         description: Ungültiges aktuelles Passwort oder Validierungsfehler
 *       429:
 *         description: Rate Limit (5/Std)
 */
// POST /api/users/change-password - Passwort ändern
router.post('/change-password', auth, sensitiveOperationLimiter, async (req, res) => {
  try {
    const { errors } = validatePasswordChangeInput(req.body || {});
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    if (errors.length > 0) {
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: errors,
      });
    }

    // Aktuelles Passwort verifizieren
    const isPasswordValid = await user.comparePassword(req.body.currentPassword);
    if (!isPasswordValid) {
      logger.warn(`Failed password change attempt for user ${user._id}`);
      return sendError(res, req, {
        error: 'Aktuelles Passwort ist falsch',
        code: 'INVALID_PASSWORD',
        status: 400,
      });
    }

    // Neues Passwort == altes Passwort prüfen
    const isSamePassword = await bcrypt.compare(req.body.newPassword, user.passwordHash);
    if (isSamePassword) {
      return sendError(res, req, {
        error: 'Neues Passwort muss sich vom aktuellen unterscheiden',
        code: 'SAME_PASSWORD',
        status: 400,
      });
    }

    // Passwort setzen (Hook hasht es) + alle Refresh-Tokens invalidieren
    user.passwordHash = req.body.newPassword;
    user.refreshTokens = [];
    await user.save();

    logger.info(`User ${user._id} changed password`);
    res.json({ success: true, message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    handleServerError(res, req, 'POST /change-password', error);
  }
});

module.exports = router;
