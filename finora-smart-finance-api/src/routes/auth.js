/**
 * Auth Routes
 * Schlanke Router-Datei - nur Routen-Definitionen
 */

const express = require('express');
const router = express.Router();
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
  apiLimiter,
  refreshLimiter,
  sensitiveOperationLimiter,
} = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Neuen Benutzer registrieren
 *     description: Erstellt einen Account, generiert JWT-Tokens und sendet optional eine Verifizierungs-Email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: MaxMuster
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Geheim123!
 *               email:
 *                 type: string
 *                 format: email
 *               understoodNoEmailReset:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Registrierung erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AuthTokens' }
 *       400:
 *         description: Validierungsfehler
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         description: Rate Limit (3/Std)
 */
router.post('/register', registerLimiter, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Benutzer einloggen
 *     description: Login per Name oder Email. Gibt JWT Access- und Refresh-Token zurück.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: MaxMuster
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 example: Geheim123!
 *     responses:
 *       200:
 *         description: Login erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AuthTokens' }
 *       401:
 *         description: Ungültige Zugangsdaten
 *       429:
 *         description: Rate Limit (5/15 Min, nur fehlgeschlagene Versuche)
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Access Token erneuern
 *     description: Rotiert das Refresh Token und gibt ein neues Token-Paar zurück.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Neue Tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AuthTokens' }
 *       401:
 *         description: Ungültiges oder abgelaufenes Refresh Token
 */
router.post('/refresh', refreshLimiter, authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Benutzer ausloggen
 *     description: Invalidiert das Refresh Token und löscht den Cookie.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Erfolgreich ausgeloggt
 */
router.post('/logout', apiLimiter, authController.logout);

/**
 * @openapi
 * /auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Email verifizieren (Link)
 *     description: Verifiziert die Email-Adresse über den Token-Link und leitet zum Frontend weiter.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirect zum Frontend
 *   post:
 *     tags: [Auth]
 *     summary: Email verifizieren (Token)
 *     description: Alternative Verifizierung per POST mit Token im Body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       302:
 *         description: Redirect zum Frontend
 */
router.get('/verify-email', apiLimiter, authController.verifyEmail);
router.post('/verify-email', apiLimiter, authController.verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Verifizierungs-Email erneut senden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Email gesendet (oder leise ignoriert wenn nicht vorhanden)
 *       429:
 *         description: Rate Limit (5/15 Min)
 */
router.post('/resend-verification', resendVerificationLimiter, authController.resendVerification);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Passwort-Reset anfordern
 *     description: Sendet eine Reset-Email an die angegebene Adresse (falls vorhanden).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset-Email gesendet (oder leise ignoriert)
 *       429:
 *         description: Rate Limit (3/Std)
 */
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Passwort mit Token zurücksetzen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *               passwordConfirm: { type: string }
 *     responses:
 *       200:
 *         description: Passwort erfolgreich zurückgesetzt
 *       400:
 *         description: Ungültiger oder abgelaufener Token
 */
router.post('/reset-password', sensitiveOperationLimiter, authController.resetPassword);

module.exports = router;
