const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const auth = require('../../middleware/authMiddleware');
const { sensitiveOperationLimiter } = require('../../middleware/rateLimiter');
const dataService = require('../../services/dataService');
const lifecycleService = require('../../services/transactionLifecycleService');
const auditLogService = require('../../services/auditLogService');
const { clearRefreshTokenCookie } = require('../../utils/cookieConfig');
const logger = require('../../utils/logger');
const { sendError } = require('../../utils/responseHelper');
const { loadUserOr404 } = require('./userHelpers');
const { handleServerError } = require('../../utils/responseHelper');

/**
 * @openapi
 * /users/export-data:
 *   post:
 *     tags: [Users]
 *     summary: Daten als JSON exportieren
 *     description: Gibt alle User-Daten und Transaktionen als JSON-Download zurück.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: JSON-Datei-Download
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Nicht authentifiziert
 *
 * /users/transactions:
 *   delete:
 *     tags: [Users]
 *     summary: Alle eigenen Transaktionen löschen
 *     description: Löscht alle Transaktionen des aktuellen Users. Passwort zur Bestätigung erforderlich.
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
 *         description: Transaktionen gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount: { type: integer }
 *       400:
 *         description: Passwort falsch oder fehlt
 */
// DELETE /api/users/me - Account löschen (mit Cascade)
router.delete('/me', auth, sensitiveOperationLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    if (!password) {
      return sendError(res, req, {
        error: 'Passwort erforderlich zur Bestätigung',
        code: 'CONFIRMATION_REQUIRED',
        status: 400,
      });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed account deletion attempt for user ${user._id}`);
      return sendError(res, req, {
        error: 'Passwort ist falsch',
        code: 'INVALID_PASSWORD',
        status: 400,
      });
    }

    const userId = user._id;

    // Cascade: Alle Transaktionen des Users löschen
    const deleteResult = await Transaction.deleteMany({ userId });
    logger.info(`Deleted ${deleteResult.deletedCount} transactions for user ${userId}`);

    // DSGVO: AuditLog-Einträge des Users löschen
    await auditLogService.deleteByUserId(userId);

    // User löschen
    await User.deleteOne({ _id: userId });
    logger.warn(`User ${userId} account permanently deleted`);

    // Refresh-Token-Cookie löschen (Session beenden)
    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: 'Account wurde dauerhaft gelöscht',
      data: { deletedTransactions: deleteResult.deletedCount },
    });
  } catch (error) {
    handleServerError(res, req, 'DELETE /me', error);
  }
});

// POST /api/users/export-data - Daten exportieren (Streaming, L-7)
router.post('/export-data', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    const exportResult = await dataService.exportUserData(user._id, user);

    const filename = `finora-export-${user._id}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // JSON-Streaming: Header + User-Daten schreiben
    res.write('{\n');
    res.write(`  "user": ${JSON.stringify(exportResult.user)},\n`);
    res.write(`  "exportedAt": "${new Date().toISOString()}",\n`);
    res.write('  "transactions": [\n');

    // Transaktionen cursor-basiert streamen (L-7: kein Memory-Overflow)
    const cursor = exportResult.getTransactionCursor();
    let first = true;

    for await (const t of cursor) {
      const entry = JSON.stringify({
        id: t._id.toString(),
        amount: t.amount,
        category: t.category,
        description: t.description,
        type: t.type,
        date: t.date,
        tags: t.tags,
        notes: t.notes,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
      res.write(first ? `    ${entry}` : `,\n    ${entry}`);
      first = false;
    }

    res.write('\n  ]\n}');
    res.end();

    // Automatisch Export-Bestätigung setzen (stoppt Retention-Erinnerungen)
    try {
      await lifecycleService.markExportConfirmed(user);
    } catch (exportConfirmError) {
      logger.warn(`Export confirm failed for user ${user._id}: ${exportConfirmError.message}`);
    }

    logger.info(`User ${user._id} exported data`);
  } catch (error) {
    handleServerError(res, req, 'POST /export-data', error);
  }
});

// DELETE /api/users/transactions - Alle Transaktionen löschen
router.delete('/transactions', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    if (!password) {
      return sendError(res, req, {
        error: 'Passwort erforderlich zur Bestätigung',
        code: 'CONFIRMATION_REQUIRED',
        status: 400,
      });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed transaction deletion attempt for user ${user._id}`);
      return sendError(res, req, {
        error: 'Passwort ist falsch',
        code: 'INVALID_PASSWORD',
        status: 400,
      });
    }

    const deleteResult = await dataService.deleteAllTransactions(user._id, password, user);
    if (!deleteResult.deleted) {
      return sendError(res, req, {
        error: deleteResult.error,
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    logger.info(`User ${user._id} deleted all ${deleteResult.deletedCount} transactions`);

    res.json({
      success: true,
      message: 'Alle Transaktionen wurden gelöscht',
      data: { deletedCount: deleteResult.deletedCount },
    });
  } catch (error) {
    handleServerError(res, req, 'DELETE /transactions', error);
  }
});

module.exports = router;
