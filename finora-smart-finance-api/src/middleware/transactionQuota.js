/**
 * Transaction Quota Middleware
 * Begrenzt die Anzahl der Transaktionen pro User pro Monat (150/Monat).
 *
 * Sicherheits-Design:
 * - Atomares Check+Increment via `findOneAndUpdate` mit $lt-Bedingung (H-4 Race-Condition-Fix)
 * - Fail-Closed: Bei DB-Fehlern wird 500 zurückgegeben statt fail-open (H-5 Fix)
 * - Automatischer Monats-Reset (basierend auf `monthlyCountResetAt`)
 * - Blockiert mit HTTP 429 wenn Limit erreicht
 * - Quota-Slot wird in der Middleware reserviert (req.quotaReserved)
 */

const User = require('../models/User');
const { sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/** Maximale Transaktionen pro User pro Monat */
const MONTHLY_TRANSACTION_LIMIT = 150;

/**
 * Prüft ob der aktuelle Monat seit dem letzten Reset vergangen ist
 * @param {Date} resetDate - Letztes Reset-Datum
 * @returns {boolean} true wenn neuer Monat
 */
function isNewMonth(resetDate) {
  if (!resetDate) return true;

  const now = new Date();
  const reset = new Date(resetDate);

  return now.getFullYear() !== reset.getFullYear() || now.getMonth() !== reset.getMonth();
}

/**
 * Berechnet das Datum des nächsten Monatsanfangs (UTC)
 * @returns {Date} Erster Tag des nächsten Monats um 00:00 UTC
 */
function getNextMonthReset() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
}

/**
 * Berechnet den Beginn des aktuellen Monats (UTC Mitternacht)
 * @returns {Date} Erster Tag des aktuellen Monats um 00:00 UTC
 */
function getCurrentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

/**
 * Middleware: Prüft und erzwingt das monatliche Transaktionslimit.
 *
 * Atomares Check+Increment:
 * 1. Versuch: Gleicher Monat + count < limit → $inc: 1 (atomar)
 * 2. Versuch: Neuer Monat → $set count=1, resetAt=now (atomar)
 * 3. Keiner matcht → Limit erreicht (429)
 *
 * Setzt `req.quotaReserved = true` und `req.quotaSnapshot` bei Erfolg.
 * Bei DB-Fehler: Fail-Closed (500), kein fail-open.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function transactionQuota(req, res, next) {
  try {
    const user = req.user;

    if (!user) {
      return sendError(res, req, {
        error: 'Authentifizierung erforderlich',
        code: 'AUTH_REQUIRED',
        status: 401,
      });
    }

    const monthStart = getCurrentMonthStart();

    // Versuch 1: Gleicher Monat + unter Limit → atomar inkrementieren
    let updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        'transactionLifecycle.monthlyCountResetAt': { $gte: monthStart },
        'transactionLifecycle.monthlyTransactionCount': { $lt: MONTHLY_TRANSACTION_LIMIT },
      },
      {
        $inc: { 'transactionLifecycle.monthlyTransactionCount': 1 },
      },
      { new: true }
    );

    if (!updated) {
      // Versuch 2: Neuer Monat → Reset + Slot reservieren (count=1)
      updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [
            { 'transactionLifecycle.monthlyCountResetAt': { $lt: monthStart } },
            { 'transactionLifecycle.monthlyCountResetAt': null },
            { 'transactionLifecycle.monthlyCountResetAt': { $exists: false } },
          ],
        },
        {
          $set: {
            'transactionLifecycle.monthlyTransactionCount': 1,
            'transactionLifecycle.monthlyCountResetAt': new Date(),
          },
        },
        { new: true }
      );

      if (updated) {
        logger.debug(`Transaction quota reset for user ${user._id} (new month)`);
      }
    }

    // Slot erfolgreich reserviert
    if (updated) {
      const lifecycle = updated.transactionLifecycle;
      const used = lifecycle.monthlyTransactionCount;

      req.quotaReserved = true;
      req.quotaSnapshot = {
        used,
        limit: MONTHLY_TRANSACTION_LIMIT,
        remaining: Math.max(0, MONTHLY_TRANSACTION_LIMIT - used),
        resetDate: getNextMonthReset().toISOString(),
        isLimitReached: used >= MONTHLY_TRANSACTION_LIMIT,
      };

      return next();
    }

    // Weder Versuch 1 noch 2 matcht → Limit erreicht
    const freshUser = await User.findById(user._id).select('transactionLifecycle').lean();
    const currentCount =
      freshUser?.transactionLifecycle?.monthlyTransactionCount || MONTHLY_TRANSACTION_LIMIT;
    const resetDate = getNextMonthReset();

    logger.info(
      `Transaction quota exceeded for user ${user._id}: ${currentCount}/${MONTHLY_TRANSACTION_LIMIT}`
    );

    return sendError(res, req, {
      error: 'Monatliches Transaktionslimit erreicht',
      code: 'TRANSACTION_QUOTA_EXCEEDED',
      status: 429,
      details: {
        limit: MONTHLY_TRANSACTION_LIMIT,
        used: currentCount,
        resetDate: resetDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Transaction quota middleware error:', error);
    // Fail-Closed: Bei DB-Fehler Request blockieren (kein fail-open)
    return sendError(res, req, {
      error: 'Quota-Prüfung fehlgeschlagen',
      code: 'QUOTA_CHECK_FAILED',
      status: 500,
    });
  }
}

/**
 * Rollback: Gibt einen reservierten Quota-Slot zurück.
 * Wird aufgerufen wenn die Transaktion trotz Middleware-Reservierung fehlschlägt.
 *
 * @param {string} userId - User-ID
 * @returns {Promise<void>}
 */
async function rollbackQuotaReservation(userId) {
  try {
    await User.findOneAndUpdate(
      {
        _id: userId,
        'transactionLifecycle.monthlyTransactionCount': { $gt: 0 },
      },
      {
        $inc: { 'transactionLifecycle.monthlyTransactionCount': -1 },
      }
    );
  } catch (error) {
    logger.error(`Failed to rollback quota reservation for user ${userId}:`, error);
  }
}

/**
 * Atomar: Erhöht den monatlichen Transaktionszähler.
 * Verwendet $inc für Atomarität. Für Fälle außerhalb der Middleware.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @returns {Promise<number>} Neuer Zählerstand
 */
async function incrementTransactionCount(user) {
  try {
    const now = new Date();

    if (isNewMonth(user.transactionLifecycle?.monthlyCountResetAt)) {
      const result = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            'transactionLifecycle.monthlyTransactionCount': 1,
            'transactionLifecycle.monthlyCountResetAt': now,
          },
        },
        { new: true }
      );
      return result?.transactionLifecycle?.monthlyTransactionCount ?? -1;
    }

    const result = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $inc: { 'transactionLifecycle.monthlyTransactionCount': 1 },
      },
      { new: true }
    );
    return result?.transactionLifecycle?.monthlyTransactionCount ?? -1;
  } catch (error) {
    logger.error(`Failed to increment transaction count for user ${user._id}:`, error);
    return -1;
  }
}

/**
 * Atomar: Dekrementiert den monatlichen Transaktionszähler nach Löschung.
 * Nur wenn die gelöschte Transaktion im aktuellen Monat erstellt wurde.
 * Verwendet $inc: -1 mit $gt: 0 Guard für Atomarität.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @param {Date} transactionCreatedAt - Erstelldatum der gelöschten Transaktion
 * @returns {Promise<number>} Neuer Zählerstand
 */
async function decrementTransactionCount(user, transactionCreatedAt) {
  try {
    const lifecycle = user.transactionLifecycle || {};
    const resetAt = lifecycle.monthlyCountResetAt;

    // Nur dekrementieren wenn Transaktion im aktuellen Monat erstellt wurde
    if (!resetAt || !transactionCreatedAt) return lifecycle.monthlyTransactionCount || 0;

    const txDate = new Date(transactionCreatedAt);
    const resetDate = new Date(resetAt);

    const sameMonth =
      txDate.getFullYear() === resetDate.getFullYear() &&
      txDate.getMonth() === resetDate.getMonth();

    if (!sameMonth) return lifecycle.monthlyTransactionCount || 0;

    const result = await User.findOneAndUpdate(
      {
        _id: user._id,
        'transactionLifecycle.monthlyTransactionCount': { $gt: 0 },
      },
      {
        $inc: { 'transactionLifecycle.monthlyTransactionCount': -1 },
      },
      { new: true }
    );

    return result?.transactionLifecycle?.monthlyTransactionCount ?? -1;
  } catch (error) {
    logger.error(`Failed to decrement transaction count for user ${user._id}:`, error);
    return -1;
  }
}

/**
 * Gibt den aktuellen Quota-Status eines Users zurück.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @returns {Object} { used, limit, remaining, resetDate, isLimitReached }
 */
function getQuotaStatus(user) {
  const lifecycle = user.transactionLifecycle || {};
  let used = lifecycle.monthlyTransactionCount || 0;

  // Falls neuer Monat → noch nicht resettet, aber Status zeigt 0
  if (isNewMonth(lifecycle.monthlyCountResetAt)) {
    used = 0;
  }

  return {
    used,
    limit: MONTHLY_TRANSACTION_LIMIT,
    remaining: Math.max(0, MONTHLY_TRANSACTION_LIMIT - used),
    resetDate: getNextMonthReset().toISOString(),
    isLimitReached: used >= MONTHLY_TRANSACTION_LIMIT,
  };
}

module.exports = {
  transactionQuota,
  rollbackQuotaReservation,
  incrementTransactionCount,
  decrementTransactionCount,
  getQuotaStatus,
  MONTHLY_TRANSACTION_LIMIT,
  // Exported for testing
  isNewMonth,
  getNextMonthReset,
  getCurrentMonthStart,
};
