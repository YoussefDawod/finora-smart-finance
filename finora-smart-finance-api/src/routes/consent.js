/**
 * @deprecated Route deaktiviert seit Phase 3 (Datenschutz-Hinweis-Umbau).
 * Cookie-Consent-Logging nicht mehr benötigt, da nur noch ein reiner
 * Datenschutz-Hinweis ohne Server-Logging verwendet wird.
 * Datei bleibt als Reserve erhalten für zukünftiges echtes Consent-System.
 *
 * Consent Routes
 * DSGVO Art. 7(1) — Serverseitige Protokollierung von Einwilligungen
 *
 * POST   /api/v1/consent   - Einwilligung protokollieren (öffentlich, rate-limited)
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { apiLimiter } = require('../middleware/rateLimiter');
const consentController = require('../controllers/consentController');

// Rate Limiter: max 10 Consent-Logs pro Minute pro IP
const consentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Zu viele Anfragen. Bitte versuche es später erneut.',
      code: 'RATE_LIMIT_EXCEEDED',
      requestId: req.requestId || 'N/A',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// ROUTES
// ============================================

/**
 * @openapi
 * /consent:
 *   post:
 *     tags: [Consent]
 *     summary: Einwilligung protokollieren (DSGVO Art. 7)
 *     description: |
 *       Protokolliert die Cookie-/Datenschutz-Einwilligung serverseitig.
 *       Kann sowohl von authentifizierten als auch anonymen Nutzern aufgerufen werden.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categories, consentVersion]
 *             properties:
 *               categories:
 *                 type: object
 *                 properties:
 *                   essential:
 *                     type: boolean
 *                     default: true
 *                   newsletter:
 *                     type: boolean
 *                     default: false
 *               consentVersion:
 *                 type: string
 *                 example: "1.0"
 *               consentType:
 *                 type: string
 *                 enum: [cookie, registration]
 *                 default: cookie
 *     responses:
 *       201:
 *         description: Einwilligung erfolgreich protokolliert
 *       400:
 *         description: Validierungsfehler
 *       429:
 *         description: Rate Limit erreicht
 */

/**
 * Optional Auth-Token auslesen ohne Pflicht (für userId).
 * Der Controller prüft req.user?._id selbst — kein authMiddleware nötig,
 * da auch anonyme Besucher Consent loggen sollen.
 */
const { verifyAccessToken } = require('../services/authService');
const User = require('../models/User');

async function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('_id');
      if (user) req.user = user;
    }
  } catch {
    // Invalid/expired token — proceed without user context
  }
  next();
}

router.post('/', apiLimiter, consentLimiter, optionalAuth, consentController.logConsent);

module.exports = router;
