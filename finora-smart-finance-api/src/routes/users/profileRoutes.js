const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const { sanitizeUser } = require('../../utils/userSanitizer');
const { sendError } = require('../../utils/responseHelper');
const { validateProfileUpdate } = require('../../validators/userValidation');
const { loadUserOr404 } = require('./userHelpers');
const { handleServerError } = require('../../utils/responseHelper');

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Eigenes Profil abrufen
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User-Profil (sanitized)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Nicht authentifiziert
 *   put:
 *     tags: [Users]
 *     summary: Profil aktualisieren
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, description: Aktuelles Passwort zur Bestätigung }
 *               name: { type: string, minLength: 3, maxLength: 50 }
 *               lastName: { type: string }
 *               avatar: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Profil aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validierungsfehler
 *   delete:
 *     tags: [Users]
 *     summary: Account löschen
 *     description: Löscht den Account und alle zugehörigen Transaktionen (Cascade).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Account gelöscht
 */
// GET /api/users/me - Aktuellen User abrufen
router.get('/me', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    handleServerError(res, req, 'GET /me', error);
  }
});

// PUT /api/users/me - User-Profil aktualisieren (Passwort-Bestätigung erforderlich)
router.put('/me', auth, async (req, res) => {
  try {
    const { password, ...profileData } = req.body || {};

    // H-6: Passwort-Bestätigung erforderlich für Profiländerungen
    if (!password) {
      return sendError(res, req, {
        error: 'Passwort erforderlich zur Bestätigung',
        code: 'PASSWORD_REQUIRED',
        status: 400,
      });
    }

    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, req, {
        error: 'Passwort ist falsch',
        code: 'INVALID_PASSWORD',
        status: 400,
      });
    }

    const { errors, updates } = validateProfileUpdate(profileData);

    if (errors.length > 0) {
      return sendError(res, req, { error: 'Validierungsfehler', code: 'VALIDATION_ERROR', status: 400, details: errors });
    }

    Object.assign(user, updates);

    await user.save();
    logger.info(`User ${user._id} updated profile`);

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    handleServerError(res, req, 'PUT /me', error);
  }
});

module.exports = router;
