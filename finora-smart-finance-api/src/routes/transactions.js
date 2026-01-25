/**
 * Transaction Routes
 * Schlanke Router-Datei - nur Routen-Definitionen
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');

// ============================================
// AUTHENTICATION MIDDLEWARE
// Alle Routes benötigen gültige JWT-Token
// ============================================
router.use(authMiddleware);

// ============================================
// STATS ROUTES (MUST be before /:id)
// ============================================
router.get('/stats/summary', transactionController.getSummary);
router.get('/stats/dashboard', transactionController.getDashboard);

// ============================================
// CRUD ROUTES
// ============================================

// Create
router.post('/', transactionController.createTransaction);

// Read
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);

// Update
router.put('/:id', transactionController.updateTransaction);

// Delete
router.delete('/', transactionController.deleteAllTransactions);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
