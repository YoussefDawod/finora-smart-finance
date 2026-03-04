const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const { sendError } = require('../../utils/responseHelper');
const { validatePreferencesInput } = require('../../validators/userValidation');
const { loadUserOr404 } = require('./userHelpers');
const { handleServerError } = require('../../utils/responseHelper');
const Subscriber = require('../../models/Subscriber');

/**
 * @openapi
 * /users/preferences:
 *   put:
 *     tags: [Users]
 *     summary: Benutzer-Einstellungen aktualisieren
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Preferences' }
 *     responses:
 *       200:
 *         description: Einstellungen aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences: { $ref: '#/components/schemas/Preferences' }
 *       400:
 *         description: Validierungsfehler
 */
// PUT /api/users/preferences - Einstellungen aktualisieren
router.put('/preferences', auth, async (req, res) => {
  try {
    const { errors, updates } = validatePreferencesInput(req.body || {});
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    if (errors.length > 0) {
      return sendError(res, req, { error: 'Validierungsfehler', code: 'VALIDATION_ERROR', status: 400, details: errors });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    Object.assign(user.preferences, updates);

    if (updates.notificationCategories) {
      user.preferences.notificationCategories = {
        ...(user.preferences.notificationCategories || {}),
        ...updates.notificationCategories,
      };
    }

    if (updates.budget) {
      user.preferences.budget = {
        ...(user.preferences.budget || {}),
        ...updates.budget,
      };

      if (updates.budget.categoryLimits !== undefined) {
        user.preferences.budget.categoryLimits = new Map(
          Object.entries(updates.budget.categoryLimits)
        );
      }
    }

    await user.save();
    logger.info(`User ${user._id} updated preferences`);

    // Subscriber-Sprache synchronisieren, falls User aktiver Abonnent ist
    if (updates.language) {
      try {
        await Subscriber.updateOne(
          { userId: user._id, isConfirmed: true },
          { $set: { language: updates.language } }
        );
      } catch (err) {
        logger.warn(`Failed to sync subscriber language for user ${user._id}: ${err.message}`);
      }
    }

    res.json({ success: true, data: user.preferences });
  } catch (error) {
    handleServerError(res, req, 'PUT /preferences', error);
  }
});

module.exports = router;
