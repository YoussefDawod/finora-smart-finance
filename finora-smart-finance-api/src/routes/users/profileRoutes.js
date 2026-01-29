const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const { sanitizeUser } = require('../../utils/userSanitizer');
const { validateProfileUpdate } = require('../../validators/userValidation');
const { loadUserOr404, handleServerError } = require('./userHelpers');

// GET /api/users/me - Aktuellen User abrufen
router.get('/me', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    handleServerError(res, 'GET /me', error);
  }
});

// PUT /api/users/me - User-Profil aktualisieren
router.put('/me', auth, async (req, res) => {
  try {
    const { errors, updates } = validateProfileUpdate(req.body || {});
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    Object.assign(user, updates);

    await user.save();
    logger.info(`User ${user._id} updated profile`);

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    handleServerError(res, 'PUT /me', error);
  }
});

module.exports = router;
