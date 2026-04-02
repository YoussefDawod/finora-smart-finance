const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitContact } = require('../controllers/contactController');

// Rate limiter: max 3 contact requests per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many contact requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      requestId: req.requestId || 'N/A',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.clientIp || req.ip,
});

/**
 * @openapi
 * /contact:
 *   post:
 *     tags: [Contact]
 *     summary: Kontaktformular absenden
 *     description: Sendet eine Kontakt-Nachricht. Rate Limit 3 pro Stunde.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string, example: Max Mustermann }
 *               email: { type: string, format: email }
 *               category: { type: string, example: support }
 *               message: { type: string, example: Ich habe eine Frage... }
 *     responses:
 *       200:
 *         description: Nachricht gesendet
 *       400:
 *         description: Validierungsfehler
 *       429:
 *         description: Rate Limit (3/Std)
 */
router.post('/', contactLimiter, submitContact);

module.exports = router;
