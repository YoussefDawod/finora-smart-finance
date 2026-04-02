/**
 * Newsletter Routes
 * Schlanke Router-Datei — nur Routen-Definitionen + Middleware
 *
 * POST   /api/newsletter/subscribe    - Newsletter abonnieren (öffentlich)
 * GET    /api/newsletter/confirm      - Abonnement bestätigen (Double Opt-In)
 * GET    /api/newsletter/unsubscribe  - Abonnement kündigen (via Email-Link)
 * GET    /api/newsletter/status       - Abo-Status prüfen (authentifiziert)
 * POST   /api/newsletter/toggle       - Abo aktivieren/deaktivieren (authentifiziert)
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const newsletterController = require('../controllers/newsletterController');

// Rate Limiter: max 5 Subscribe-Anfragen pro Stunde pro IP
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
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
  keyGenerator: req => req.clientIp || req.ip,
});

// ============================================
// ROUTES
// ============================================

/**
 * @openapi
 * /newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Newsletter abonnieren
 *     description: Double Opt-In — sendet Bestätigungs-Email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               language: { type: string, enum: [de, en, ar, ka], default: de }
 *     responses:
 *       200:
 *         description: Bestätigungs-Email gesendet
 *       429:
 *         description: Rate Limit (5/Std)
 *
 * /newsletter/confirm:
 *   get:
 *     tags: [Newsletter]
 *     summary: Abonnement bestätigen
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: lang
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: HTML-Statusseite
 *         content:
 *           text/html:
 *             schema: { type: string }
 *
 * /newsletter/unsubscribe:
 *   get:
 *     tags: [Newsletter]
 *     summary: Abonnement kündigen
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: lang
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: HTML-Statusseite
 *         content:
 *           text/html:
 *             schema: { type: string }
 *
 * /newsletter/status:
 *   get:
 *     tags: [Newsletter]
 *     summary: Abo-Status prüfen
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Abo-Status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 subscribed: { type: boolean }
 *
 * /newsletter/toggle:
 *   post:
 *     tags: [Newsletter]
 *     summary: Abo aktivieren/deaktivieren
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Abo-Status geändert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 subscribed: { type: boolean }
 *                 message: { type: string }
 */
router.post('/subscribe', subscribeLimiter, newsletterController.subscribe);
router.get('/confirm', apiLimiter, newsletterController.confirm);
router.get('/unsubscribe', apiLimiter, newsletterController.unsubscribe);
router.get('/status', auth, apiLimiter, newsletterController.getStatus);
router.post('/toggle', auth, apiLimiter, newsletterController.toggle);

module.exports = router;
