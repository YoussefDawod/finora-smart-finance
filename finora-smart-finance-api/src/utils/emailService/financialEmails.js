const logger = require('../logger');
const { sendEmail } = require('./emailTransport');
const templates = require('../emailTemplates');

/**
 * Transaktions-Benachrichtigung senden
 * @param {Object} user - Der User (mit Email)
 * @param {Object} transaction - Die Transaktion
 * @returns {Promise<Object>}
 */
async function sendTransactionNotification(user, transaction) {
  if (!user?.email) {
    return { sent: false, reason: 'NO_EMAIL' };
  }

  if (!user.preferences?.emailNotifications) {
    return { sent: false, reason: 'NOTIFICATIONS_DISABLED' };
  }

  if (user.preferences?.notificationCategories?.transactions === false) {
    return { sent: false, reason: 'CATEGORY_DISABLED' };
  }

  const name = user.name || 'Nutzer';
  const subject = transaction.type === 'income'
    ? '📈 Neue Einnahme erfasst - Finora'
    : '📉 Neue Ausgabe erfasst - Finora';

  try {
    await sendEmail(user.email, subject, templates.transactionNotification(name, transaction));
    return { sent: true };
  } catch (error) {
    logger.error(`Transaction notification failed: ${error.message}`);
    return { sent: false, error: error.message };
  }
}

/**
 * Budget-Warnung senden
 * @param {Object} user - Der User
 * @param {Object} alertData - { category, spent, budget, percentage }
 * @returns {Promise<Object>}
 */
async function sendBudgetAlert(user, alertData) {
  if (!user?.email) {
    return { sent: false, reason: 'NO_EMAIL' };
  }

  if (!user.preferences?.emailNotifications) {
    return { sent: false, reason: 'NOTIFICATIONS_DISABLED' };
  }

  if (user.preferences?.notificationCategories?.alerts === false) {
    return { sent: false, reason: 'CATEGORY_DISABLED' };
  }

  const name = user.name || 'Nutzer';

  try {
    await sendEmail(user.email, '⚠️ Budget-Warnung - Finora', templates.budgetAlert(name, alertData));
    return { sent: true };
  } catch (error) {
    logger.error(`Budget alert failed: ${error.message}`);
    return { sent: false, error: error.message };
  }
}

/**
 * Finanzbericht senden (wöchentlich/monatlich)
 * @param {Object} user - Der User
 * @param {Object} reportData - { income, expenses, balance, topCategories, startDate, endDate }
 * @param {string} period - 'weekly' oder 'monthly'
 * @returns {Promise<Object>}
 */
async function sendFinancialReport(user, reportData, period = 'weekly') {
  if (!user?.email) {
    return { sent: false, reason: 'NO_EMAIL' };
  }

  if (!user.preferences?.emailNotifications) {
    return { sent: false, reason: 'NOTIFICATIONS_DISABLED' };
  }

  if (user.preferences?.notificationCategories?.reports === false) {
    return { sent: false, reason: 'CATEGORY_DISABLED' };
  }

  const name = user.name || 'Nutzer';
  const subject = period === 'weekly'
    ? '📊 Dein Wochenbericht - Finora'
    : '📊 Dein Monatsbericht - Finora';

  try {
    await sendEmail(user.email, subject, templates.financialReport(name, reportData, period));
    return { sent: true };
  } catch (error) {
    logger.error(`Financial report failed: ${error.message}`);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendTransactionNotification,
  sendBudgetAlert,
  sendFinancialReport,
};
