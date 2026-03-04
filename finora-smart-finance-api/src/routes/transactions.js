/**
 * Transaction Routes
 * Schlanke Router-Datei - nur Routen-Definitionen
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const { transactionQuota } = require('../middleware/transactionQuota');
const transactionController = require('../controllers/transactionController');

// ============================================
// RATE LIMITING & AUTHENTICATION MIDDLEWARE
// Alle Routes benötigen gültige JWT-Token + API Rate Limit
// ============================================
router.use(apiLimiter);
router.use(authMiddleware);

// ============================================
// STATS ROUTES (MUST be before /:id)
// ============================================

/**
 * @openapi
 * /transactions/stats/summary:
 *   get:
 *     tags: [Transactions]
 *     summary: Finanz-Zusammenfassung
 *     description: Aggregierte Summen (Income, Expense, Balance) mit optionalem Datumsfilter.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Zusammenfassung
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome: { type: number }
 *                     totalExpense: { type: number }
 *                     balance: { type: number }
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/stats/summary', transactionController.getSummary);

/**
 * @openapi
 * /transactions/quota:
 *   get:
 *     tags: [Transactions]
 *     summary: Monatliches Transaktions-Quota
 *     description: Gibt den aktuellen Quota-Status zurück (verwendet/Limit/verbleibend).
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Quota-Status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     used: { type: integer }
 *                     limit: { type: integer }
 *                     remaining: { type: integer }
 *                     resetDate: { type: string, format: date-time }
 *                     isLimitReached: { type: boolean }
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/quota', transactionController.getQuota);

/**
 * @openapi
 * /transactions/stats/dashboard:
 *   get:
 *     tags: [Transactions]
 *     summary: Dashboard-Daten
 *     description: Aggregierte Dashboard-Daten (Kategorien, Trends) für Monat/Jahr.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dashboard-Daten
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/stats/dashboard', transactionController.getDashboard);

// ============================================
// CRUD ROUTES
// ============================================

/**
 * @openapi
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Transaktion erstellen
 *     description: Erstellt eine neue Transaktion. Prüft Budget-Alerts und sendet ggf. Email.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       201:
 *         description: Transaktion erstellt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction: { $ref: '#/components/schemas/Transaction' }
 *                 message: { type: string }
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Nicht authentifiziert
 *   get:
 *     tags: [Transactions]
 *     summary: Transaktionen auflisten
 *     description: Paginierte, filterbare Transaktionsliste mit Volltext-Suche.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 15, maximum: 100 }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Volltext-Suche in Beschreibung und Kategorie
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: date }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginierte Transaktionsliste
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Transaction' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401:
 *         description: Nicht authentifiziert
 *   delete:
 *     tags: [Transactions]
 *     summary: Alle Transaktionen löschen (Bulk)
 *     description: "Löscht alle eigenen Transaktionen. Query-Parameter `confirm=true` erforderlich."
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: confirm
 *         required: true
 *         schema: { type: string, enum: ['true'] }
 *     responses:
 *       200:
 *         description: Alle Transaktionen gelöscht
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
 *                     deletedAt: { type: string, format: date-time }
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/', transactionQuota, transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.delete('/', transactionController.deleteAllTransactions);

/**
 * @openapi
 * /transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Einzelne Transaktion abrufen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Transaktion gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction: { $ref: '#/components/schemas/Transaction' }
 *       404:
 *         description: Nicht gefunden
 *   put:
 *     tags: [Transactions]
 *     summary: Transaktion aktualisieren
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       200:
 *         description: Transaktion aktualisiert
 *       404:
 *         description: Nicht gefunden
 *   delete:
 *     tags: [Transactions]
 *     summary: Einzelne Transaktion löschen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaktion gelöscht
 *       404:
 *         description: Nicht gefunden
 */
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
