/**
 * Data Service
 * Handles data export and deletion operations
 */

const Transaction = require('../models/Transaction');

/**
 * Exports user data als Stream-fähiges Objekt mit Cursor-basiertem Transaction-Iterator (L-7)
 * @param {string} userId - User ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Exported data mit cursor
 */
async function exportUserData(userId, user) {
  // Zähle Transaktionen zuerst für Fortschritts-Info
  const transactionCount = await Transaction.countDocuments({ userId });

  return {
    success: true,
    message: 'Daten erfolgreich exportiert',
    user: {
      id: userId.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    transactionCount,
    /**
     * Gibt einen Mongoose-Cursor zurück, der Transaktionen batch-weise liefert.
     * Verhindert Memory-Overflow bei Usern mit vielen Transaktionen.
     */
    getTransactionCursor() {
      return Transaction.find({ userId })
        .lean()
        .cursor({ batchSize: 500 });
    },
  };
}

/**
 * Deletes all user transactions
 * @param {string} userId - User ID
 * @param {string} password - User password for verification
 * @param {Object} user - User object
 * @returns {Promise<Object>} Deletion result
 */
async function deleteAllTransactions(userId, password, user) {
  if (!password) {
    return { deleted: false, error: 'Passwort erforderlich', code: 'MISSING_PASSWORD' };
  }

  const isValid = await user.validatePassword(password);
  if (!isValid) {
    return { deleted: false, error: 'Passwort ist falsch', code: 'INVALID_PASSWORD' };
  }

  const result = await Transaction.deleteMany({ userId });

  return {
    deleted: true,
    deletedCount: result.deletedCount,
    message: `${result.deletedCount} Transaktionen gelöscht`,
  };
}

module.exports = {
  exportUserData,
  deleteAllTransactions,
};
