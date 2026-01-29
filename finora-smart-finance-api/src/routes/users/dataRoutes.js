const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const auth = require('../../middleware/authMiddleware');
const dataService = require('../../services/dataService');
const logger = require('../../utils/logger');
const { loadUserOr404, handleServerError } = require('./userHelpers');

// DELETE /api/users/me - Account löschen (mit Cascade)
router.delete('/me', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

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
    handleServerError(res, 'DELETE /me', error);
  }
});

// POST /api/users/export-data - Daten exportieren
router.post('/export-data', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

    const exportResult = await dataService.exportUserData(user._id, user);

    const jsonData = JSON.stringify(exportResult.export, null, 2);

    const filename = `finora-export-${user._id}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonData);

    logger.info(`User ${user._id} exported data`);
  } catch (error) {
    handleServerError(res, 'POST /export-data', error);
  }
});

// DELETE /api/users/transactions - Alle Transaktionen löschen
router.delete('/transactions', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await loadUserOr404(req.user._id, res);
    if (!user) return;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Passwort erforderlich zur Bestätigung' });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed transaction deletion attempt for user ${user._id}`);
      return res.status(400).json({ success: false, message: 'Passwort ist falsch' });
    }

    const deleteResult = await dataService.deleteAllTransactions(user._id, password, user);
    if (!deleteResult.deleted) {
      return res.status(400).json({ success: false, message: deleteResult.error });
    }

    logger.info(`User ${user._id} deleted all ${deleteResult.deletedCount} transactions`);

    res.json({ 
      success: true, 
      message: 'Alle Transaktionen wurden gelöscht',
      data: { deletedCount: deleteResult.deletedCount }
    });
  } catch (error) {
    handleServerError(res, 'DELETE /transactions', error);
  }
});

module.exports = router;
