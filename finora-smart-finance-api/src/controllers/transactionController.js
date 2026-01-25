/**
 * Transaction Controller Module
 * Route-Handler für alle Transaction-Endpoints
 */

const Transaction = require('../models/Transaction');
const transactionService = require('../services/transactionService');
const {
  validateObjectId,
  validatePagination,
  validateCreateTransaction,
  validateUpdateTransaction,
} = require('../validators/transactionValidation');

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

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.date.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime())) {
          dateFilter.date.$lte = end;
        }
      }
    }

    const stats = await transactionService.getSummaryStats(userId, dateFilter);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('GET /api/transactions/stats/summary Error:', error);
    res.status(500).json({
      error: 'Fehler beim Berechnen der Zusammenfassung',
      code: 'SERVER_ERROR',
      message: error.message,
    });
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
    console.error('GET /api/transactions/stats/dashboard Error:', error);
    res.status(500).json({
      error: 'Fehler beim Laden der Dashboard-Daten',
      code: 'SERVER_ERROR',
      message: error.message,
    });
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
    const userId = req.user._id;
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

    res.status(201).json({
      success: true,
      data: transactionService.formatTransaction(transaction),
      message: 'Transaktion erstellt',
    });
  } catch (error) {
    console.error('POST /api/transactions Error:', error);

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
    console.error('GET /api/transactions Error:', error);
    res.status(500).json({
      error: 'Fehler beim Abrufen der Transaktionen',
      code: 'SERVER_ERROR',
      message: error.message,
    });
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

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        error: idValidation.error,
        code: 'INVALID_ID',
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaktion nicht gefunden',
        code: 'NOT_FOUND',
      });
    }

    if (!transactionService.isOwner(transaction, userId)) {
      return res.status(403).json({
        error: 'Sie haben keine Berechtigung, diese Transaktion zu sehen',
        code: 'FORBIDDEN',
      });
    }

    res.json({
      success: true,
      data: transactionService.formatTransaction(transaction),
    });
  } catch (error) {
    console.error('GET /api/transactions/:id Error:', error);
    res.status(500).json({
      error: 'Fehler beim Abrufen der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
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

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        error: idValidation.error,
        code: 'INVALID_ID',
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaktion nicht gefunden',
        code: 'NOT_FOUND',
      });
    }

    if (!transactionService.isOwner(transaction, userId)) {
      return res.status(403).json({
        error: 'Sie haben keine Berechtigung, diese Transaktion zu ändern',
        code: 'FORBIDDEN',
      });
    }

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
    console.error('PUT /api/transactions/:id Error:', error);

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

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        error: idValidation.error,
        code: 'INVALID_ID',
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaktion nicht gefunden',
        code: 'NOT_FOUND',
      });
    }

    if (!transactionService.isOwner(transaction, userId)) {
      return res.status(403).json({
        error: 'Sie haben keine Berechtigung, diese Transaktion zu löschen',
        code: 'FORBIDDEN',
      });
    }

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
    console.error('DELETE /api/transactions/:id Error:', error);
    res.status(500).json({
      error: 'Fehler beim Löschen der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
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
    console.error('DELETE /api/transactions Error:', error);
    res.status(500).json({
      error: 'Fehler beim Löschen aller Transaktionen',
      code: 'SERVER_ERROR',
      message: error.message,
    });
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
