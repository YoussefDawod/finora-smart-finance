/**
 * Data Service
 * Handles data export and deletion operations
 */

const Transaction = require('../models/Transaction');

/**
 * Exports user data
 * @param {string} userId - User ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Exported data
 */
async function exportUserData(userId, user) {
  const transactions = await Transaction.find({ userId }).lean();

  const exportDataPayload = {
    user: {
      id: userId.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      amount: t.amount,
      category: t.category,
      description: t.description,
      type: t.type,
      date: t.date,
      tags: t.tags,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    exportedAt: new Date().toISOString(),
  };

  return {
    success: true,
    export: exportDataPayload,
    message: 'Daten erfolgreich exportiert',
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
