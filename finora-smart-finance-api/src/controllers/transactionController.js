/**
 * Transaction Controller Module
 * Route-Handler für alle Transaction-Endpoints
 */

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const transactionService = require('../services/transactionService');
const emailService = require('../utils/emailService');
const budgetAlertService = require('../services/budgetAlertService');
const {
  rollbackQuotaReservation,
  decrementTransactionCount,
  getQuotaStatus,
} = require('../middleware/transactionQuota');
const logger = require('../utils/logger');
const {
  validateObjectId,
  validatePagination,
  validateCreateTransaction,
  validateUpdateTransaction,
} = require('../validators/transactionValidation');

const { sendError, handleServerError } = require('../utils/responseHelper');

async function getOwnedTransactionOrFail(id, userId, res, req) {
  const idValidation = validateObjectId(id);
  if (!idValidation.valid) {
    sendError(res, req, { error: idValidation.error, code: 'INVALID_ID', status: 400 });
    return null;
  }

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    sendError(res, req, { error: 'Transaktion nicht gefunden', code: 'NOT_FOUND', status: 404 });
    return null;
  }

  if (!transactionService.isOwner(transaction, userId)) {
    sendError(res, req, {
      error: 'Sie haben keine Berechtigung, diese Transaktion zu sehen',
      code: 'FORBIDDEN',
      status: 403,
    });
    return null;
  }

  return transaction;
}

// ============================================
// STATS ENDPOINTS
// ============================================

/**
 * GET /api/transactions/quota
 * Monatliches Transaktions-Quota-Status
 *
 * Verwendet die tatsächliche Anzahl aus der DB als Source-of-Truth,
 * damit auch Transaktionen gezählt werden, die vor dem Quota-System
 * erstellt wurden.  Der gespeicherte Counter wird bei Bedarf synchronisiert.
 */
async function getQuota(req, res) {
  try {
    const user = req.user;

    // ── Source-of-Truth: echte Anzahl dieses Monats aus der DB ──
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const actualCount = await Transaction.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    });

    // Gespeicherten Counter mit DB synchronisieren (fire-and-forget)
    const storedCount = user.transactionLifecycle?.monthlyTransactionCount ?? 0;
    if (storedCount !== actualCount) {
      user.transactionLifecycle = {
        ...(user.transactionLifecycle?.toObject?.() || {}),
        monthlyTransactionCount: actualCount,
        monthlyCountResetAt: new Date(),
      };
      user.save().catch(err => logger.error('Quota counter sync failed:', err));
    }

    // Quota-Status mit echtem Wert berechnen
    const quota = getQuotaStatus(user);
    // Überschreibe `used` mit DB-Wert (falls getQuotaStatus cached war)
    quota.used = actualCount;
    quota.remaining = Math.max(0, quota.limit - actualCount);
    quota.isLimitReached = actualCount >= quota.limit;

    res.json({
      success: true,
      data: quota,
    });
  } catch (error) {
    handleServerError(res, req, 'GET /api/transactions/quota', error);
  }
}

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
    handleServerError(res, req, 'GET /api/transactions/stats/summary', error);
  }
}

/**
 * GET /api/transactions/stats/dashboard
 * Aggregierte Dashboard-Daten
 * Query-Parameter:
 *   - month: Monat (1-12), optional
 *   - year: Jahr, optional
 */
async function getDashboard(req, res) {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    // Parse month/year wenn vorhanden
    const options = {};
    if (month) {
      const parsedMonth = parseInt(month, 10);
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        options.month = parsedMonth;
      }
    }
    if (year) {
      const parsedYear = parseInt(year, 10);
      if (parsedYear >= 2000 && parsedYear <= 2100) {
        options.year = parsedYear;
      }
    }

    const data = await transactionService.getDashboardData(userId, options);

    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'GET /api/transactions/stats/dashboard', error);
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
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: validation.errors,
      });
    }

    const transaction = await Transaction.create({
      userId,
      ...validation.data,
    });

    // Quota wurde bereits atomar in der Middleware reserviert (req.quotaReserved)
    const quota = req.quotaSnapshot || getQuotaStatus(user);

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
      quota,
    });
  } catch (error) {
    // Quota-Rollback: Middleware hat Slot reserviert, aber Transaktion schlug fehl
    if (req.quotaReserved) {
      await rollbackQuotaReservation(req.user._id);
    }

    logger.error('POST /api/transactions Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: messages,
      });
    }

    handleServerError(res, req, 'POST /api/transactions', error);
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
    handleServerError(res, req, 'GET /api/transactions', error);
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

    const transaction = await getOwnedTransactionOrFail(id, userId, res, req);
    if (!transaction) return;

    res.json({
      success: true,
      data: transactionService.formatTransaction(transaction),
    });
  } catch (error) {
    handleServerError(res, req, 'GET /api/transactions/:id', error);
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

    const transaction = await getOwnedTransactionOrFail(id, userId, res, req);
    if (!transaction) return;

    const validation = validateUpdateTransaction(req.body);
    if (!validation.valid) {
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: validation.errors,
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
      const messages = Object.values(error.errors).map(err => err.message);
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: messages,
      });
    }

    handleServerError(res, req, 'PUT /api/transactions/:id', error);
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

    const transaction = await getOwnedTransactionOrFail(id, userId, res, req);
    if (!transaction) return;

    await Transaction.findByIdAndDelete(id);

    // Transaktionszähler dekrementieren (nur wenn im aktuellen Monat erstellt)
    await decrementTransactionCount(req.user, transaction.createdAt);

    res.json({
      success: true,
      message: 'Transaktion gelöscht',
      data: {
        id: transaction._id,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleServerError(res, req, 'DELETE /api/transactions/:id', error);
  }
}

/**
 * DELETE /api/transactions
 * Alle Transaktionen löschen (Bulk) — erfordert Passwort-Bestätigung (L-8)
 */
async function deleteAllTransactions(req, res) {
  try {
    const userId = req.user._id;
    const { confirm } = req.query;
    const { password } = req.body || {};

    if (confirm !== 'true') {
      return sendError(res, req, {
        error: 'Sicherheitsbestätigung erforderlich: ?confirm=true',
        code: 'MISSING_CONFIRMATION',
        status: 400,
      });
    }

    // Passwort-Bestätigung für destruktive Operation (L-8)
    if (!password) {
      return sendError(res, req, {
        error: 'Passwort erforderlich zur Bestätigung',
        code: 'CONFIRMATION_REQUIRED',
        status: 400,
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return sendError(res, req, {
        error: 'Benutzer nicht gefunden',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed bulk delete attempt for user ${userId}`);
      return sendError(res, req, {
        error: 'Passwort ist falsch',
        code: 'INVALID_PASSWORD',
        status: 400,
      });
    }

    const result = await Transaction.deleteMany({ userId });

    // Transaktionszähler zurücksetzen
    if (req.user.transactionLifecycle) {
      req.user.transactionLifecycle.monthlyTransactionCount = 0;
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Alle eigenen Transaktionen gelöscht',
      data: {
        deletedCount: result.deletedCount,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleServerError(res, req, 'DELETE /api/transactions', error);
  }
}

module.exports = {
  // Stats
  getSummary,
  getDashboard,
  getQuota,

  // CRUD
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions,
};
