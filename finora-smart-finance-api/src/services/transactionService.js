/**
 * Transaction Service Module
 * Business-Logik und Aggregations-Pipelines für Transaktionen
 */

const Transaction = require('../models/Transaction');

/**
 * Baut ein Filter-Objekt für Transaktions-Queries
 * @param {string} userId - Die User-ID
 * @param {Object} params - Query-Parameter
 * @returns {Object} MongoDB Filter-Objekt
 */
function buildTransactionFilter(userId, params = {}) {
  const { type, category, startDate, endDate, search } = params;
  const filter = { userId };

  // Volltext-Suche
  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  // Type Filter
  if (type && ['income', 'expense'].includes(type)) {
    filter.type = type;
  }

  // Category Filter
  if (category) {
    filter.category = category;
  }

  // Date Range Filter
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        filter.date.$gte = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(end.getTime())) {
        filter.date.$lte = end;
      }
    }
  }

  return filter;
}

/**
 * Baut ein Sort-Objekt für Transaktions-Queries
 * @param {Object} params - Query-Parameter
 * @returns {Object} MongoDB Sort-Objekt
 */
function buildSortObject(params = {}) {
  const { sort = 'date', order = 'desc', search } = params;
  const sortObj = {};

  // Bei Volltext-Suche: Sortiere zuerst nach Relevanz
  if (search && search.trim()) {
    sortObj.score = { $meta: 'textScore' };
    sortObj.date = order === 'asc' ? 1 : -1;
  } else {
    if (sort === 'amount') {
      sortObj.amount = order === 'asc' ? 1 : -1;
    } else {
      sortObj.date = order === 'asc' ? 1 : -1;
    }
  }

  return sortObj;
}

/**
 * Berechnet Trend-Prozent zwischen zwei Werten
 * @param {number} current - Aktueller Wert
 * @param {number} previous - Vorheriger Wert
 * @returns {number|null} Prozentuale Änderung oder null
 */
function calculateTrend(current, previous) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Aggregation: Summary-Statistiken für einen Zeitraum
 * @param {string} userId - Die User-ID
 * @param {Object} dateFilter - Optionales Datums-Filter
 * @returns {Promise<Object>} Summary-Statistiken
 */
async function getSummaryStats(userId, dateFilter = {}) {
  const filter = { userId, ...dateFilter };

  const stats = await Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const result = stats[0] || {
    totalIncome: 0,
    totalExpense: 0,
    transactionCount: 0,
  };

  return {
    totalIncome: parseFloat(result.totalIncome.toFixed(2)),
    totalExpense: parseFloat(result.totalExpense.toFixed(2)),
    balance: parseFloat((result.totalIncome - result.totalExpense).toFixed(2)),
    transactionCount: result.transactionCount,
  };
}

/**
 * Aggregation: Dashboard-Daten
 * @param {string} userId - Die User-ID
 * @returns {Promise<Object>} Dashboard-Daten
 */
async function getDashboardData(userId) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);

  // Summary Pipeline
  const summaryPipeline = [
    { $match: { userId } },
    {
      $facet: {
        currentMonth: [
          { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
          {
            $group: {
              _id: null,
              income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
              expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
              count: { $sum: 1 },
            },
          },
        ],
        lastMonth: [
          { $match: { date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
          {
            $group: {
              _id: null,
              income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
              expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
            },
          },
        ],
        total: [
          {
            $group: {
              _id: null,
              totalTransactions: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  // Trend Pipeline
  const trendPipeline = [
    { $match: { userId, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ];

  // Category Pipeline
  const categoryPipeline = [
    { $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ];

  // Recent Pipeline
  const recentPipeline = [
    { $match: { userId } },
    { $sort: { date: -1, createdAt: -1 } },
    { $limit: 5 },
  ];

  // Execute all aggregations in parallel
  const [summaryResult, trendResult, categoryResult, recentResult] = await Promise.all([
    Transaction.aggregate(summaryPipeline),
    Transaction.aggregate(trendPipeline),
    Transaction.aggregate(categoryPipeline),
    Transaction.aggregate(recentPipeline),
  ]);

  // Process results
  const current = summaryResult[0]?.currentMonth[0] || { income: 0, expense: 0, count: 0 };
  const last = summaryResult[0]?.lastMonth[0] || { income: 0, expense: 0 };
  const totalStats = summaryResult[0]?.total[0] || { totalTransactions: 0 };

  return {
    summary: {
      currentMonth: {
        income: parseFloat(current.income.toFixed(2)),
        expense: parseFloat(current.expense.toFixed(2)),
        balance: parseFloat((current.income - current.expense).toFixed(2)),
        transactionCount: current.count,
      },
      trends: {
        income: calculateTrend(current.income, last.income),
        expense: calculateTrend(current.expense, last.expense),
        balance: calculateTrend(current.income - current.expense, last.income - last.expense),
      },
      totalTransactions: totalStats.totalTransactions,
    },
    monthlyTrend: trendResult.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      income: parseFloat(item.income.toFixed(2)),
      expense: parseFloat(item.expense.toFixed(2)),
    })),
    categoryBreakdown: categoryResult.map((item) => ({
      category: item._id.category,
      type: item._id.type,
      total: parseFloat(item.total.toFixed(2)),
      count: item.count,
    })),
    recentTransactions: recentResult.map((t) => ({
      id: t._id,
      amount: t.amount,
      category: t.category,
      description: t.description,
      type: t.type,
      date: t.date.toISOString().split('T')[0],
    })),
  };
}

/**
 * Prüft ob ein User der Owner einer Transaktion ist
 * @param {Object} transaction - Die Transaktion
 * @param {string} userId - Die User-ID
 * @returns {boolean}
 */
function isOwner(transaction, userId) {
  return transaction.userId.toString() === userId.toString();
}

/**
 * Formatiert eine Transaktion für die Response
 * @param {Object} transaction - Die Transaktion
 * @returns {Object}
 */
function formatTransaction(transaction) {
  return transaction.toJSON();
}

/**
 * Formatiert ein Array von Transaktionen für die Response
 * @param {Array} transactions - Die Transaktionen
 * @returns {Array}
 */
function formatTransactions(transactions) {
  return transactions.map((t) => t.toJSON());
}

module.exports = {
  buildTransactionFilter,
  buildSortObject,
  calculateTrend,
  getSummaryStats,
  getDashboardData,
  isOwner,
  formatTransaction,
  formatTransactions,
};
