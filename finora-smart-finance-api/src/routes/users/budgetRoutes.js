const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const budgetAlertService = require('../../services/budgetAlertService');
const { loadUserOr404, handleServerError } = require('./userHelpers');

// GET /api/users/budget-status - Aktuellen Budget-Status abrufen
router.get('/budget-status', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

    const budgetStatus = await budgetAlertService.getBudgetStatus(user);

    res.json({ success: true, data: budgetStatus });
  } catch (error) {
    handleServerError(res, 'GET /budget-status', error);
  }
});

module.exports = router;
