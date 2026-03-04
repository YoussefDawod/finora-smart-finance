const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const budgetAlertService = require('../../services/budgetAlertService');
const { loadUserOr404 } = require('./userHelpers');
const { handleServerError } = require('../../utils/responseHelper');

/**
 * @openapi
 * /users/budget-status:
 *   get:
 *     tags: [Users]
 *     summary: Budget-Status abrufen
 *     description: Gibt den aktuellen Budget-Status mit Verbrauch pro Kategorie zurück.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Budget-Status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     budgetStatus: { type: object }
 *       401:
 *         description: Nicht authentifiziert
 */
// GET /api/users/budget-status - Aktuellen Budget-Status abrufen
router.get('/budget-status', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    const budgetStatus = await budgetAlertService.getBudgetStatus(user);

    res.json({ success: true, data: budgetStatus });
  } catch (error) {
    handleServerError(res, req, 'GET /budget-status', error);
  }
});

module.exports = router;
