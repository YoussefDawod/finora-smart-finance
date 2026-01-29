const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const { validatePreferencesInput } = require('../../validators/userValidation');
const { loadUserOr404, handleServerError } = require('./userHelpers');

// PUT /api/users/preferences - Einstellungen aktualisieren
router.put('/preferences', auth, async (req, res) => {
  try {
    const { errors, updates } = validatePreferencesInput(req.body || {});
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
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

    res.json({ success: true, data: user.preferences });
  } catch (error) {
    handleServerError(res, 'PUT /preferences', error);
  }
});

module.exports = router;
