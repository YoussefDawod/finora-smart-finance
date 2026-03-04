/**
 * Lifecycle Routes
 * Endpoints für Transaktions-Lifecycle-Status und Export-Bestätigung
 */

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authMiddleware');
const lifecycleService = require('../../services/transactionLifecycleService');
const { getQuotaStatus } = require('../../middleware/transactionQuota');
const { loadUserOr404 } = require('./userHelpers');
const { handleServerError } = require('../../utils/responseHelper');

/**
 * @openapi
 * /users/lifecycle-status:
 *   get:
 *     tags: [Users]
 *     summary: Lifecycle-Status abrufen
 *     description: |
 *       Gibt den vollständigen Transaktions-Lifecycle-Status zurück:
 *       - Retention-Phase (active/pending/reminding/gracePeriodExpired/finalWarning)
 *       - Tage bis Löschung
 *       - Export-Status
 *       - Monatliches Transaktions-Quota
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lifecycle-Status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     retention:
 *                       type: object
 *                       properties:
 *                         phase: { type: string, enum: [active, pending, reminding, gracePeriodExpired, finalWarning] }
 *                         hasOldTransactions: { type: boolean }
 *                         oldTransactionCount: { type: integer }
 *                         daysUntilDeletion: { type: integer, nullable: true }
 *                     quota:
 *                       type: object
 *                       properties:
 *                         used: { type: integer }
 *                         limit: { type: integer }
 *                         remaining: { type: integer }
 *                         isLimitReached: { type: boolean }
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: User nicht gefunden
 */
router.get('/lifecycle-status', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    const lifecycleStatus = await lifecycleService.getLifecycleStatus(user);
    const quota = getQuotaStatus(user);

    res.json({
      success: true,
      data: {
        ...lifecycleStatus,
        quota,
      },
    });
  } catch (error) {
    handleServerError(res, req, 'GET /lifecycle-status', error);
  }
});

/**
 * @openapi
 * /users/export-confirm:
 *   post:
 *     tags: [Users]
 *     summary: Export-Bestätigung manuell setzen
 *     description: |
 *       Markiert, dass der User seine Daten exportiert hat.
 *       Stoppt weitere Retention-Erinnerungen (Löschung nach Fristablauf läuft weiter).
 *       Wird automatisch beim Daten-Export gesetzt, kann aber auch manuell aufgerufen werden.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Export-Bestätigung gespeichert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: User nicht gefunden
 */
router.post('/export-confirm', auth, async (req, res) => {
  try {
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    const result = await lifecycleService.markExportConfirmed(user);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    handleServerError(res, req, 'POST /export-confirm', error);
  }
});

module.exports = router;
