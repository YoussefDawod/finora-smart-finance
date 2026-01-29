/**
 * Transaction Controller Module
 * Route-Handler für alle Transaction-Endpoints
 */

const Transaction = require('../models/Transaction');
const transactionService = require('../services/transactionService');
const emailService = require('../utils/emailService');
const budgetAlertService = require('../services/budgetAlertService');
const logger = require('../utils/logger');
const {
  validateObjectId,
  validatePagination,
  validateCreateTransaction,
  validateUpdateTransaction,
} = require('../validators/transactionValidation');

function handleServerError(res, context, error) {
  logger.error(`${context} error:`, error);
  return res.status(500).json({
    error: 'Serverfehler',
    code: 'SERVER_ERROR',
    message: error.message,
  });
}

async function getOwnedTransactionOrFail(id, userId, res) {
  const idValidation = validateObjectId(id);
  if (!idValidation.valid) {
    res.status(400).json({ error: idValidation.error, code: 'INVALID_ID' });
    return null;
  }

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    res.status(404).json({ error: 'Transaktion nicht gefunden', code: 'NOT_FOUND' });
    return null;
  }

  if (!transactionService.isOwner(transaction, userId)) {
    res.status(403).json({
      error: 'Sie haben keine Berechtigung, diese Transaktion zu sehen',
      code: 'FORBIDDEN',
    });
    return null;
  }

  return transaction;
}

// ============================================
// STATS ENDPOINTS
// ============================================

/**
 * GET /api/transactions/stats/summary
 * Zusammenfassung: Total Income, Total Expense, Balance
 */
async function getSummary(req, res) {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const dateFilter = transactionService.buildTransactionFilter(userId, { startDate, endDate });

    const stats = await transactionService.getSummaryStats(userId, dateFilter);

    res.json({ success: true, data: stats });
  } catch (error) {
    handleServerError(res, 'GET /api/transactions/stats/summary', error);
  }
}

/**
 * GET /api/transactions/stats/dashboard
 * Aggregierte Dashboard-Daten
 */
async function getDashboard(req, res) {
  try {
    const userId = req.user._id;
    const data = await transactionService.getDashboardData(userId);

    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, 'GET /api/transactions/stats/dashboard', error);
  }
}

// ============================================
// CRUD ENDPOINTS
// ============================================

/**
 * POST /api/transactions
 * Neue Transaktion erstellen
 */
async function createTransaction(req, res) {
  try {
    const user = req.user;
    const userId = user._id;
    const validation = validateCreateTransaction(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: validation.errors,
        code: 'VALIDATION_ERROR',
      });
    }

    const transaction = await Transaction.create({
      userId,
      ...validation.data,
    });

    // Transaktions-Benachrichtigung (prüft automatisch Benutzereinstellungen)
    if (user.email && user.isVerified) {
      try {
        await emailService.sendTransactionNotification(user, transaction);
      } catch (notifyError) {
        logger.warn(`Transaction notification skipped: ${notifyError.message}`);
      }

      // Budget-Alert prüfen (nur für Ausgaben, benötigt Budget-Limit)
      try {
        await budgetAlertService.checkBudgetAfterTransaction(user, transaction);
      } catch (budgetError) {
        logger.warn(`Budget alert check failed: ${budgetError.message}`);
      }

      // Negatives Saldo Alert prüfen (für alle Ausgaben)
      try {
        await budgetAlertService.checkNegativeBalanceAlert(user, transaction);
      } catch (negativeBalanceError) {
        logger.warn(`Negative balance alert check failed: ${negativeBalanceError.message}`);
      }
    }

    res.status(201).json({
      success: true,
      data: transactionService.formatTransaction(transaction),
      message: 'Transaktion erstellt',
    });
  } catch (error) {
    logger.error('POST /api/transactions Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: messages,
        code: 'VALIDATION_ERROR',
      });
    }

    res.status(500).json({
      error: 'Fehler beim Erstellen der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
}

/**
 * GET /api/transactions
 * Alle Transaktionen (paginiert, filterbar)
 */
async function getTransactions(req, res) {
  try {
    const userId = req.user._id;
    const { page, limit, skip } = validatePagination(req.query);

    const filter = transactionService.buildTransactionFilter(userId, req.query);
    const sortObj = transactionService.buildSortObject(req.query);

    const total = await Transaction.countDocuments(filter);

    let query = Transaction.find(filter);

    // Bei Volltext-Suche: Text-Score projizieren
    if (req.query.search && req.query.search.trim()) {
      query = query.select({ score: { $meta: 'textScore' } });
    }

    const transactions = await query.sort(sortObj).skip(skip).limit(limit);

    res.json({
      success: true,
      data: transactionService.formatTransactions(transactions),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      ...(req.query.search && { searchQuery: req.query.search }),
    });
  } catch (error) {
    handleServerError(res, 'GET /api/transactions', error);
  }
}

/**
 * GET /api/transactions/:id
 * Eine Transaktion abrufen
 */
async function getTransactionById(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const transaction = await getOwnedTransactionOrFail(id, userId, res);
    if (!transaction) return;

    res.json({
      success: true,
      data: transactionService.formatTransaction(transaction),
    });
  } catch (error) {
    handleServerError(res, 'GET /api/transactions/:id', error);
  }
}

/**
 * PUT /api/transactions/:id
 * Transaktion aktualisieren
 */
async function updateTransaction(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const transaction = await getOwnedTransactionOrFail(id, userId, res);
    if (!transaction) return;

    const validation = validateUpdateTransaction(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: validation.errors,
        code: 'VALIDATION_ERROR',
      });
    }

    // Apply updates
    Object.assign(transaction, validation.data);
    await transaction.save();

    res.json({
      success: true,
      data: transactionService.formatTransaction(transaction),
      message: 'Transaktion aktualisiert',
    });
  } catch (error) {
    logger.error('PUT /api/transactions/:id Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: messages,
        code: 'VALIDATION_ERROR',
      });
    }

    res.status(500).json({
      error: 'Fehler beim Aktualisieren der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/transactions/:id
 * Transaktion löschen
 */
async function deleteTransaction(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const transaction = await getOwnedTransactionOrFail(id, userId, res);
    if (!transaction) return;

    await Transaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Transaktion gelöscht',
      data: {
        id: transaction._id,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleServerError(res, 'DELETE /api/transactions/:id', error);
  }
}

/**
 * DELETE /api/transactions
 * Alle Transaktionen löschen (Bulk)
 */
async function deleteAllTransactions(req, res) {
  try {
    const userId = req.user._id;
    const { confirm } = req.query;

    if (confirm !== 'true') {
      return res.status(400).json({
        error: 'Sicherheitsbestätigung erforderlich: ?confirm=true',
        code: 'MISSING_CONFIRMATION',
      });
    }

    const result = await Transaction.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Alle eigenen Transaktionen gelöscht',
      data: {
        deletedCount: result.deletedCount,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleServerError(res, 'DELETE /api/transactions', error);
  }
}

module.exports = {
  // Stats
  getSummary,
  getDashboard,

  // CRUD
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions,
};
