const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/authMiddleware');
const {
  emailOperationLimiter,
  sensitiveOperationLimiter,
} = require('../../middleware/rateLimiter');
const emailService = require('../../utils/emailService');
const auditLogService = require('../../services/auditLogService');
const logger = require('../../utils/logger');
const { sanitizeUser } = require('../../utils/userSanitizer');
const { sendError } = require('../../utils/responseHelper');
const { validateEmailChangeInput } = require('../../validators/userValidation');
const { loadUserOr404 } = require('./userHelpers');
const { handleServerError } = require('../../utils/responseHelper');
const authEmailAddController = require('../../controllers/auth/authEmailAddController');

/**
 * @openapi
 * /users/change-email:
 *   post:
 *     tags: [Users]
 *     summary: Email-Adresse ändern
 *     description: Initiiert Email-Änderung mit Verifizierung. Passwort erforderlich.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Bestätigungs-Email gesendet
 *       400:
 *         description: Validierungsfehler oder falsches Passwort
 *       409:
 *         description: Email bereits registriert
 *
 * /users/verify-email-change:
 *   get:
 *     tags: [Users]
 *     summary: Email-Änderung bestätigen
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email erfolgreich geändert
 *       400:
 *         description: Token ungültig oder abgelaufen
 *
 * /users/add-email:
 *   post:
 *     tags: [Users]
 *     summary: Email-Adresse hinzufügen
 *     description: Fügt einem Account ohne Email eine Email-Adresse hinzu.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Verifizierungs-Email gesendet
 *       429:
 *         description: Rate Limit (10/24h)
 *
 * /users/verify-add-email:
 *   get:
 *     tags: [Users]
 *     summary: Email-Hinzufügung verifizieren (Link)
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verifiziert
 *   post:
 *     tags: [Users]
 *     summary: Email-Hinzufügung verifizieren (Token)
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
 *       200:
 *         description: Email verifiziert
 *
 * /users/remove-email:
 *   delete:
 *     tags: [Users]
 *     summary: Email-Adresse entfernen
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
 *         description: Email entfernt
 *       429:
 *         description: Rate Limit (10/24h)
 *
 * /users/resend-add-email-verification:
 *   post:
 *     tags: [Users]
 *     summary: Verifizierungs-Email erneut senden
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Email gesendet
 *       429:
 *         description: Rate Limit (10/24h)
 *
 * /users/email-status:
 *   get:
 *     tags: [Users]
 *     summary: Email-Status abrufen
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Aktueller Email-Status
 */
// POST /api/users/change-email - Email ändern (mit Verifizierung)
router.post('/change-email', auth, emailOperationLimiter, async (req, res) => {
  try {
    const { errors, email: normalizedEmail } = validateEmailChangeInput(req.body || {});
    const user = await loadUserOr404(req.user._id, res, req);
    if (!user) return;

    if (errors.length > 0) {
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: errors,
      });
    }

    // Passwort verifizieren
    const isPasswordValid = await user.comparePassword(req.body?.password);
    if (!isPasswordValid) {
      logger.warn(`Failed email change attempt for user ${user._id}`);
      return sendError(res, req, {
        error: 'Passwort ist falsch',
        code: 'INVALID_PASSWORD',
        status: 400,
      });
    }

    // Neue Email == aktuelle Email?
    if (normalizedEmail && normalizedEmail.toLowerCase() === user.email.toLowerCase()) {
      return sendError(res, req, {
        error: 'Neue Email muss sich von der aktuellen unterscheiden',
        code: 'SAME_EMAIL',
        status: 400,
      });
    }

    // Neue Email schon registriert?
    const existingUser = await User.findOne({ email: normalizedEmail.toLowerCase() });
    if (existingUser) {
      return sendError(res, req, {
        error: 'Email ist bereits registriert',
        code: 'EMAIL_TAKEN',
        status: 409,
      });
    }

    // Token generieren
    const emailChangeToken = user.generateEmailChangeToken(normalizedEmail.toLowerCase());
    await user.save();

    // Verification-Email senden
    const emailResult = await emailService.sendEmailChangeVerification(
      user,
      emailChangeToken,
      normalizedEmail
    );

    logger.info(`Email change token generated for user ${user._id} (new: ${normalizedEmail})`);

    // Dev-Mode: Token zurückgeben für Testing
    const response = {
      success: true,
      message: 'Bestätigungs-Email gesendet',
    };

    if (process.env.NODE_ENV === 'development' && emailResult?.link) {
      response.verificationLink = emailResult.link;
    }

    res.json(response);
  } catch (error) {
    handleServerError(res, req, 'POST /change-email', error);
  }
});

// GET /api/users/verify-email-change - Email-Change verifizieren
router.get('/verify-email-change', sensitiveOperationLimiter, async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return sendError(res, req, {
        error: 'Token erforderlich',
        code: 'MISSING_TOKEN',
        status: 400,
      });
    }

    // Token hashen und suchen
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ emailChangeToken: tokenHash });

    if (!user) {
      return sendError(res, req, { error: 'Token ungültig', code: 'INVALID_TOKEN', status: 400 });
    }

    // Token abgelaufen?
    if (new Date() > user.emailChangeExpires) {
      user.emailChangeToken = undefined;
      user.emailChangeNewEmail = undefined;
      user.emailChangeExpires = undefined;
      await user.save();
      return sendError(res, req, {
        error: 'Token ist abgelaufen',
        code: 'TOKEN_EXPIRED',
        status: 400,
      });
    }

    // Email aktualisieren
    const oldEmail = user.email;
    user.email = user.emailChangeNewEmail;
    user.emailChangeToken = undefined;
    user.emailChangeNewEmail = undefined;
    user.emailChangeExpires = undefined;

    await user.save();

    logger.info(`User ${user._id} verified email change (${oldEmail} -> ${user.email})`);

    // Audit-Log: Email geändert
    auditLogService.log({
      action: 'EMAIL_CHANGED',
      targetUserId: user._id,
      targetUserName: user.name,
      details: { oldEmail, newEmail: user.email },
      req,
    });

    res.json({
      success: true,
      message: 'Email erfolgreich geändert',
      data: sanitizeUser(user),
    });
  } catch (error) {
    handleServerError(res, req, 'GET /verify-email-change', error);
  }
});

// ============================================
// Multi-Email Management Routes
// ============================================

// POST /api/users/add-email - Zusätzliche Email hinzufügen
router.post('/add-email', auth, emailOperationLimiter, authEmailAddController.addEmail);

// GET /api/users/verify-add-email - Email-Hinzufügung verifizieren (Link)
router.get('/verify-add-email', authEmailAddController.verifyAddEmailGet);

// POST /api/users/verify-add-email - Email-Hinzufügung verifizieren (Token)
router.post('/verify-add-email', authEmailAddController.verifyAddEmailPost);

// DELETE /api/users/remove-email - Zusätzliche Email entfernen
router.delete('/remove-email', auth, emailOperationLimiter, authEmailAddController.removeEmail);

// POST /api/users/resend-add-email-verification - Verifizierungs-Email erneut senden
router.post(
  '/resend-add-email-verification',
  auth,
  emailOperationLimiter,
  authEmailAddController.resendAddEmailVerification
);

// GET /api/users/email-status - Email-Status abrufen
router.get('/email-status', auth, authEmailAddController.getEmailStatus);

module.exports = router;
