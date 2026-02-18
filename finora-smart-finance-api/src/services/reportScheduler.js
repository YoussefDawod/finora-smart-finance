/**
 * Report Scheduler Service
 * Sendet wöchentliche und monatliche Finanzberichte an Benutzer
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Berechnet Report-Daten für einen Benutzer
 * @param {string} userId - User ID
 * @param {Date} startDate - Startdatum
 * @param {Date} endDate - Enddatum
 * @returns {Promise<Object>} Report-Daten
 */
async function calculateReportData(userId, startDate, endDate) {
  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  });

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Top Kategorien berechnen
  const categoryMap = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const topCategories = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    income,
    expenses,
    balance: income - expenses,
    topCategories,
    startDate: startDate.toLocaleDateString('de-DE'),
    endDate: endDate.toLocaleDateString('de-DE'),
    transactionCount: transactions.length,
  };
}

/**
 * Sendet wöchentliche Berichte an alle berechtigten Benutzer
 * @returns {Promise<Object>} Ergebnis mit Statistiken
 */
async function sendWeeklyReports() {
  logger.info('Starting weekly report distribution...');

  // Letzte 7 Tage
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // Finde alle User mit aktivierten Berichten
  const users = await User.find({
    email: { $exists: true, $ne: null },
    isVerified: true,
    'preferences.emailNotifications': true,
    'preferences.notificationCategories.reports': true,
  });

  logger.info(`Found ${users.length} users eligible for weekly reports`);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const reportData = await calculateReportData(user._id, startDate, endDate);

      // Nur senden wenn es Transaktionen gab
      if (reportData.transactionCount === 0) {
        skipped++;
        continue;
      }

      const result = await emailService.sendFinancialReport(user, reportData, 'weekly');
      if (result.sent) {
        sent++;
      } else {
        skipped++;
      }
    } catch (error) {
      logger.error(`Weekly report failed for user ${user._id}: ${error.message}`);
      failed++;
    }
  }

  logger.info(`Weekly reports complete: ${sent} sent, ${skipped} skipped, ${failed} failed`);
  return { sent, skipped, failed, total: users.length };
}

/**
 * Sendet monatliche Berichte an alle berechtigten Benutzer
 * @returns {Promise<Object>} Ergebnis mit Statistiken
 */
async function sendMonthlyReports() {
  logger.info('Starting monthly report distribution...');

  // Letzter Monat
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  // Finde alle User mit aktivierten Berichten
  const users = await User.find({
    email: { $exists: true, $ne: null },
    isVerified: true,
    'preferences.emailNotifications': true,
    'preferences.notificationCategories.reports': true,
  });

  logger.info(`Found ${users.length} users eligible for monthly reports`);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const reportData = await calculateReportData(user._id, startDate, endDate);

      // Nur senden wenn es Transaktionen gab
      if (reportData.transactionCount === 0) {
        skipped++;
        continue;
      }

      const result = await emailService.sendFinancialReport(user, reportData, 'monthly');
      if (result.sent) {
        sent++;
      } else {
        skipped++;
      }
    } catch (error) {
      logger.error(`Monthly report failed for user ${user._id}: ${error.message}`);
      failed++;
    }
  }

  logger.info(`Monthly reports complete: ${sent} sent, ${skipped} skipped, ${failed} failed`);
  return { sent, skipped, failed, total: users.length };
}

/**
 * Manueller Bericht für einen einzelnen Benutzer (für Admin/Testing)
 * @param {string} userId - User ID
 * @param {string} period - 'weekly' oder 'monthly'
 * @returns {Promise<Object>} Ergebnis
 */
async function sendReportToUser(userId, period = 'weekly') {
  const user = await User.findById(userId);
  if (!user) {
    return { sent: false, reason: 'USER_NOT_FOUND' };
  }

  if (!user.email || !user.isVerified) {
    return { sent: false, reason: 'NO_VERIFIED_EMAIL' };
  }

  const endDate = new Date();
  const startDate = new Date();
  if (period === 'weekly') {
    startDate.setDate(startDate.getDate() - 7);
  } else {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  const reportData = await calculateReportData(userId, startDate, endDate);
  return emailService.sendFinancialReport(user, reportData, period);
}

module.exports = {
  calculateReportData,
  sendWeeklyReports,
  sendMonthlyReports,
  sendReportToUser,
};
