/**
 * Admin Routes
 * Schlanke Router-Datei — nur Routen-Definitionen + Middleware
 *
 * ⚠️ SECURITY: Geschützt durch JWT-Auth + Admin-Rolle
 * Fallback auf API-Key für CLI/Entwicklung
 */

const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { sendError } = require('../utils/responseHelper');
const { adminLimiter } = require('../middleware/rateLimiter');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/authMiddleware');

const isDevelopment = process.env.NODE_ENV !== 'production';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// ============================================
// AUTH MIDDLEWARE (JWT + Admin-Rolle ODER API-Key Fallback)
// ============================================
router.use(async (req, res, next) => {
  // 1. Versuch: JWT-basierte Auth (Bearer Token)
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return authMiddleware(req, res, err => {
      if (err) return next(err);
      return requireAdmin(req, res, next);
    });
  }

  // 2. Fallback: API-Key Auth (für CLI-Tool und Legacy-Zugang)
  const providedKey = req.headers['x-admin-key'];

  if (!ADMIN_API_KEY || !providedKey) {
    return sendError(res, req, {
      error: isDevelopment
        ? 'Nicht autorisiert: Admin-API-Key erforderlich (auch in Development)'
        : 'Nicht autorisiert: Admin-Login oder API-Key erforderlich',
      code: 'UNAUTHORIZED',
      status: 403,
    });
  }

  // Timing-safe Vergleich in ALLEN Umgebungen
  // Verhindert Timing-Side-Channel-Angriffe auf den API-Key
  const keyBuffer = Buffer.from(ADMIN_API_KEY, 'utf8');
  const providedBuffer = Buffer.from(String(providedKey), 'utf8');

  if (
    keyBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(keyBuffer, providedBuffer)
  ) {
    return sendError(res, req, {
      error: 'Nicht autorisiert: Ungültiger Admin-API-Schlüssel',
      code: 'UNAUTHORIZED',
      status: 403,
    });
  }

  next();
});

// Rate Limiter
router.use(adminLimiter);

// ============================================
// ROUTES
// ============================================

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: System-Statistiken
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     responses:
 *       200:
 *         description: Statistiken (User-Counts, etc.)
 *       403:
 *         description: Ungültiger Admin-Key
 *
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Alle Benutzer auflisten
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: showSensitive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginierte Userliste
 *   post:
 *     tags: [Admin]
 *     summary: Neuen User erstellen (Admin)
 *     security:
 *       - AdminKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, password]
 *             properties:
 *               name: { type: string }
 *               password: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: User erstellt
 *   delete:
 *     tags: [Admin]
 *     summary: Alle User löschen
 *     security:
 *       - AdminKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirm]
 *             properties:
 *               confirm: { type: string, example: DELETE_ALL_USERS }
 *     responses:
 *       200:
 *         description: Alle User und Transaktionen gelöscht
 *
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Einzelnen User abrufen
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User-Daten
 *       404:
 *         description: User nicht gefunden
 *   patch:
 *     tags: [Admin]
 *     summary: User aktualisieren
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               isVerified: { type: boolean }
 *     responses:
 *       200:
 *         description: User aktualisiert
 *   delete:
 *     tags: [Admin]
 *     summary: Einzelnen User löschen
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User und Transaktionen gelöscht
 *
 * /admin/users/{id}/reset-password:
 *   post:
 *     tags: [Admin]
 *     summary: User-Passwort zurücksetzen (Admin)
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Passwort zurückgesetzt
 *
 * /admin/users/{id}/ban:
 *   patch:
 *     tags: [Admin]
 *     summary: User sperren (Ban)
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, maxLength: 500, description: Sperrgrund }
 *     responses:
 *       200:
 *         description: User gesperrt
 *       404:
 *         description: User nicht gefunden
 *       400:
 *         description: Admins können nicht gesperrt werden
 *
 * /admin/users/{id}/unban:
 *   patch:
 *     tags: [Admin]
 *     summary: User-Sperre aufheben
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sperre aufgehoben
 *       404:
 *         description: User nicht gefunden
 *
 * /admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: User-Rolle ändern
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, user] }
 *     responses:
 *       200:
 *         description: Rolle geändert
 *       404:
 *         description: User nicht gefunden
 *       400:
 *         description: Ungültige Rolle oder letzter Admin
 *
 * /admin/audit-log:
 *   get:
 *     tags: [Admin]
 *     summary: Audit-Log abrufen (paginiert, filterbar)
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter nach Aktion (z.B. USER_BANNED)
 *       - in: query
 *         name: adminId
 *         schema: { type: string }
 *         description: Filter nach Admin-ID
 *       - in: query
 *         name: targetUserId
 *         schema: { type: string }
 *         description: Filter nach betroffenem User
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginierte Audit-Log-Einträge
 *
 * /admin/audit-log/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Audit-Log-Statistiken (letzte 30 Tage)
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     responses:
 *       200:
 *         description: Statistiken gruppiert nach Aktion
 *
 * /admin/transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Alle Transaktionen auflisten (paginiert, filterbar)
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Filter nach User-ID
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Suche in Beschreibung
 *     responses:
 *       200:
 *         description: Paginierte Transaktionsliste
 *
 * /admin/transactions/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Transaktions-Statistiken
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     responses:
 *       200:
 *         description: Transaktions-Übersicht (Typ, Kategorie, Beträge)
 *
 * /admin/transactions/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Einzelne Transaktion abrufen
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaktions-Details
 *       404:
 *         description: Transaktion nicht gefunden
 *   delete:
 *     tags: [Admin]
 *     summary: Transaktion löschen
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaktion gelöscht
 *       404:
 *         description: Transaktion nicht gefunden
 *
 * /admin/subscribers:
 *   get:
 *     tags: [Admin]
 *     summary: Alle Newsletter-Abonnenten auflisten
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - in: query
 *         name: isConfirmed
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Suche nach E-Mail
 *       - in: query
 *         name: language
 *         schema: { type: string, enum: [de, en, ar, ka] }
 *     responses:
 *       200:
 *         description: Paginierte Subscriber-Liste
 *
 * /admin/subscribers/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Subscriber-Statistiken
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     responses:
 *       200:
 *         description: Subscriber-Übersicht (bestätigt, Sprache, Trend)
 *
 * /admin/subscribers/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Einzelnen Subscriber abrufen
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscriber-Details
 *       404:
 *         description: Subscriber nicht gefunden
 *   delete:
 *     tags: [Admin]
 *     summary: Subscriber löschen
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscriber gelöscht
 *       404:
 *         description: Subscriber nicht gefunden
 *
 * /admin/lifecycle/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Lifecycle-Statistiken (Retention, Quota)
 *     description: |
 *       Gibt eine Übersicht über den Transaktions-Lifecycle zurück:
 *       - User mit alten Transaktionen
 *       - User in Erinnerungs-/Finale-Phase
 *       - User die exportiert haben
 *       - Löschungen diesen Monat
 *       - User nahe am Quota-Limit
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     responses:
 *       200:
 *         description: Lifecycle-Statistiken
 *
 * /admin/lifecycle/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Lifecycle-Detail eines Users
 *     description: Detaillierter Lifecycle-Status inkl. Quota, Retention-Phase, Transaktions-Alter
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lifecycle-Detail
 *       404:
 *         description: User nicht gefunden
 *
 * /admin/lifecycle/users/{id}/reset:
 *   post:
 *     tags: [Admin]
 *     summary: Retention-Status eines Users zurücksetzen
 *     description: |
 *       Setzt alle Retention-Flags zurück (reminderStartedAt, finalWarningSentAt, etc.).
 *       AuditLog-Eintrag wird erstellt (RETENTION_RESET_BY_ADMIN).
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Retention-Status zurückgesetzt
 *       404:
 *         description: User nicht gefunden
 *
 * /admin/lifecycle/trigger:
 *   post:
 *     tags: [Admin]
 *     summary: Retention-Verarbeitung manuell auslösen
 *     description: |
 *       Führt den täglichen Retention-Cron-Job manuell aus.
 *       Gibt Statistiken zurück (verarbeitet, Erinnerungen, Löschungen, Fehler).
 *       AuditLog-Eintrag wird erstellt (RETENTION_MANUAL_TRIGGER).
 *     security:
 *       - BearerAuth: []
 *       - AdminKey: []
 *     responses:
 *       200:
 *         description: Verarbeitung abgeschlossen mit Statistiken
 */
router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.get('/users/export', adminController.exportUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.patch('/users/:id/role', adminController.changeUserRole);
router.delete('/users', adminController.deleteAllUsers);

// AuditLog-Routen
router.get('/audit-log', adminController.getAuditLogs);
router.get('/audit-log/stats', adminController.getAuditLogStats);

// Transaction-Routen
router.get('/transactions/users', adminController.getTransactionUsers);
router.get('/transactions', adminController.listTransactions);
router.get('/transactions/export', adminController.exportTransactions);
router.get('/transactions/stats', adminController.getTransactionStats);
router.get('/transactions/:id', adminController.getTransaction);
router.delete('/transactions/:id', adminController.deleteTransactionAdmin);

// Subscriber-Routen
router.get('/subscribers', adminController.listSubscribers);
router.get('/subscribers/stats', adminController.getSubscriberStats);
router.get('/subscribers/export', adminController.exportSubscribersCSV);
router.get('/subscribers/:id', adminController.getSubscriber);
router.put('/subscribers/:id', adminController.updateSubscriber);
router.delete('/subscribers/:id', adminController.deleteSubscriberAdmin);
router.post('/subscribers/:id/resend', adminController.resendConfirmation);

// Campaign-Routen (Newsletter-Versand)
router.get('/campaigns', adminController.listCampaigns);
router.get('/campaigns/stats', adminController.getCampaignStats);
router.post('/campaigns', adminController.createCampaign);
router.post('/campaigns/preview', adminController.previewCampaign);
router.get('/campaigns/:id', adminController.getCampaign);
router.put('/campaigns/:id', adminController.updateCampaign);
router.delete('/campaigns/:id', adminController.deleteCampaign);
router.delete('/campaigns', adminController.deleteAllCampaigns);
router.post('/campaigns/:id/send', adminController.sendCampaign);

// Lifecycle-Routen
router.get('/lifecycle/stats', adminController.getLifecycleStats);
router.get('/lifecycle/users/:id', adminController.getUserLifecycleDetail);
router.post('/lifecycle/users/:id/reset', adminController.resetUserRetention);
router.post('/lifecycle/trigger', adminController.triggerRetentionProcessing);

module.exports = router;
