/**
 * Budget Alert Service
 * Prüft Budget-Limits und sendet Warnungen
 */

const Transaction = require('../models/Transaction');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// Verhindert zu viele Alerts (max 1 pro Tag)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Prüft ob Budget-Alert gesendet werden soll nach einer neuen Ausgabe
 * @param {Object} user - User-Objekt aus MongoDB
 * @param {Object} newTransaction - Die neue Transaktion
 * @returns {Promise<Object>} Ergebnis
 */
async function checkBudgetAfterTransaction(user, newTransaction) {
  // Nur für Ausgaben prüfen
  if (newTransaction.type !== 'expense') {
    return { checked: false, reason: 'NOT_EXPENSE' };
  }

  // Prüfe ob User Budget-Limits hat
  const budget = user.preferences?.budget;
  if (!budget || budget.monthlyLimit <= 0) {
    return { checked: false, reason: 'NO_BUDGET_SET' };
  }

  // Prüfe ob Alerts aktiviert sind
  if (!user.preferences?.emailNotifications || !user.preferences?.notificationCategories?.alerts) {
    return { checked: false, reason: 'ALERTS_DISABLED' };
  }

  // Prüfe ob kürzlich ein Alert gesendet wurde (max 1 pro Tag)
  if (budget.lastAlertSent && Date.now() - budget.lastAlertSent.getTime() < ONE_DAY_MS) {
    return { checked: false, reason: 'ALERT_COOLDOWN' };
  }

  // Berechne aktuelle Monatsausgaben
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthlyExpenses = await Transaction.aggregate([
    {
      $match: {
        userId: user._id,
        type: 'expense',
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totalSpent = monthlyExpenses[0]?.total || 0;
  const percentUsed = (totalSpent / budget.monthlyLimit) * 100;
  const threshold = budget.alertThreshold || 80;

  // Prüfe ob Schwellenwert überschritten
  if (percentUsed >= threshold) {
    const alertData = {
      totalSpent,
      limit: budget.monthlyLimit,
      percentUsed: Math.round(percentUsed),
      threshold,
      currency: user.preferences?.currency || 'EUR',
      remainingBudget: Math.max(0, budget.monthlyLimit - totalSpent),
      exceededBy: percentUsed > 100 ? totalSpent - budget.monthlyLimit : 0,
      latestTransaction: {
        amount: newTransaction.amount,
        category: newTransaction.category,
        description: newTransaction.description,
      },
    };

    logger.info(`📊 Budget alert triggered for user ${user._id}: ${percentUsed.toFixed(1)}% used`);

    // Sende Alert
    const result = await emailService.sendBudgetAlert(user, alertData);

    if (result.sent) {
      // Aktualisiere lastAlertSent
      user.preferences.budget.lastAlertSent = new Date();
      await user.save();
    }

    return {
      checked: true,
      triggered: true,
      percentUsed: Math.round(percentUsed),
      ...result,
    };
  }

  return {
    checked: true,
    triggered: false,
    percentUsed: Math.round(percentUsed),
    reason: 'BELOW_THRESHOLD',
  };
}

/**
 * Prüft Budget-Status für einen User (für Dashboard/API)
 * @param {Object} user - User-Objekt
 * @returns {Promise<Object>} Budget-Status
 */
async function getBudgetStatus(user) {
  const budget = user.preferences?.budget;
  if (!budget || budget.monthlyLimit <= 0) {
    return { hasBudget: false };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthlyExpenses = await Transaction.aggregate([
    {
      $match: {
        userId: user._id,
        type: 'expense',
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totalSpent = monthlyExpenses[0]?.total || 0;
  const percentUsed = (totalSpent / budget.monthlyLimit) * 100;

  return {
    hasBudget: true,
    monthlyLimit: budget.monthlyLimit,
    totalSpent,
    remainingBudget: Math.max(0, budget.monthlyLimit - totalSpent),
    percentUsed: Math.round(percentUsed),
    alertThreshold: budget.alertThreshold || 80,
    isOverBudget: percentUsed > 100,
    isNearLimit: percentUsed >= (budget.alertThreshold || 80),
  };
}

/**
 * Prüft ob Gesamtsaldo negativ ist und sendet Warnung
 * Diese Funktion wird aufgerufen wenn eine Ausgabe erstellt wird
 * @param {Object} user - User-Objekt aus MongoDB
 * @param {Object} newTransaction - Die neue Transaktion
 * @returns {Promise<Object>} Ergebnis
 */
async function checkNegativeBalanceAlert(user, newTransaction) {
  // Nur für Ausgaben prüfen
  if (newTransaction.type !== 'expense') {
    return { checked: false, reason: 'NOT_EXPENSE' };
  }

  // Prüfe ob Alerts aktiviert sind
  if (!user.preferences?.emailNotifications || !user.preferences?.notificationCategories?.alerts) {
    return { checked: false, reason: 'ALERTS_DISABLED' };
  }

  // Prüfe ob kürzlich ein Negativ-Saldo-Alert gesendet wurde (max 1 pro Woche)
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const lastNegativeAlert = user.preferences?.budget?.lastNegativeBalanceAlert;
  if (lastNegativeAlert && Date.now() - new Date(lastNegativeAlert).getTime() < ONE_WEEK_MS) {
    return { checked: false, reason: 'NEGATIVE_ALERT_COOLDOWN' };
  }

  // Berechne Gesamtsaldo (alle Transaktionen, nicht nur aktueller Monat)
  const totals = await Transaction.aggregate([
    {
      $match: {
        userId: user._id,
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const income = totals.find(t => t._id === 'income')?.total || 0;
  const expenses = totals.find(t => t._id === 'expense')?.total || 0;
  const balance = income - expenses;

  // Prüfe ob Saldo negativ ist
  if (balance < 0) {
    const alertData = {
      totalIncome: income,
      totalExpenses: expenses,
      balance,
      deficit: Math.abs(balance),
      currency: user.preferences?.currency || 'EUR',
      latestTransaction: {
        amount: newTransaction.amount,
        category: newTransaction.category,
        description: newTransaction.description,
      },
      alertType: 'negative_balance',
    };

    logger.info(`⚠️ Negative balance alert triggered for user ${user._id}: Balance ${balance}`);

    // Sende Alert
    const result = await emailService.sendBudgetAlert(user, alertData);

    if (result.sent) {
      // Aktualisiere lastNegativeBalanceAlert
      if (!user.preferences.budget) {
        user.preferences.budget = {};
      }
      user.preferences.budget.lastNegativeBalanceAlert = new Date();
      await user.save();
    }

    return {
      checked: true,
      triggered: true,
      balance,
      ...result,
    };
  }

  return {
    checked: true,
    triggered: false,
    balance,
    reason: 'BALANCE_POSITIVE',
  };
}

module.exports = {
  checkBudgetAfterTransaction,
  getBudgetStatus,
  checkNegativeBalanceAlert,
};
