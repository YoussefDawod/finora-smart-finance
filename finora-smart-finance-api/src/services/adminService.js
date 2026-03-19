/**
 * Admin Service
 * Reine Business-Logik für Admin-Operationen (kein Express req/res)
 */

const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscriber = require('../models/Subscriber');
const lifecycleService = require('./transactionLifecycleService');
const { sanitizeUser, sanitizeUsers } = require('../utils/userSanitizer');
const { sendAdminCreatedCredentialsEmail } = require('../utils/emailService/adminEmails');
const escapeRegex = require('../utils/escapeRegex');
const logger = require('../utils/logger');

/**
 * Alle Users auflisten (paginiert, filterbar)
 * showSensitive wird in Production automatisch ignoriert (Sicherheitsschutz)
 */
async function listUsers(query, pagination, sort, showSensitive) {
  // Schritt 1.6: showSensitive in Production deaktivieren
  if (showSensitive && process.env.NODE_ENV === 'production') {
    logger.warn(
      'showSensitive=true in Production ignoriert — sensitive Daten werden nicht zurückgegeben'
    );
    showSensitive = false;
  }

  const { page, limit, skip } = pagination;

  const [users, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users: sanitizeUsers(users, { includeSensitive: showSensitive }),
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
}

/**
 * Einzelnen User mit Stats abrufen
 */
async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const transactionCount = await Transaction.countDocuments({ userId: user._id });

  return {
    user: sanitizeUser(user, { includeSensitive: true }),
    stats: {
      transactionCount,
      memberSince: user.createdAt,
      lastActivity: user.lastLogin || user.updatedAt,
    },
  };
}

/**
 * Admin Dashboard Stats
 */
async function getStats() {
  const [
    totalUsers,
    verifiedUsers,
    activeUsers,
    adminUsers,
    usersLast7Days,
    usersLast30Days,
    totalTransactions,
    recentUsers,
    userLanguageBreakdown,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    Transaction.countDocuments(),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt lastLogin isVerified role isActive'),
    User.aggregate([
      { $group: { _id: { $ifNull: ['$preferences.language', 'de'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    overview: {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      activeUsers,
      bannedUsers: totalUsers - activeUsers,
      adminUsers,
      usersLast7Days,
      usersLast30Days,
      totalTransactions,
    },
    recentUsers: sanitizeUsers(recentUsers),
    userLanguageBreakdown,
  };
}

/**
 * Lifecycle-Statistiken für Admin-Dashboard
 * Wraps transactionLifecycleService.getAdminLifecycleStats() mit zusätzlichem Kontext
 */
async function getLifecycleStats() {
  const stats = await lifecycleService.getAdminLifecycleStats();

  // Parallele Abfragen für alle User-Listen
  const [usersInFinalWarningPhase, usersInRemindingPhase, usersWithExport, usersApproachingQuota] =
    await Promise.all([
      // User in finaler Warnphase (noch nicht gelöscht)
      User.find({
        'transactionLifecycle.retentionNotifications.finalWarningSentAt': { $ne: null },
        'transactionLifecycle.retentionNotifications.deletionExecutedAt': null,
      })
        .select('name email transactionLifecycle.retentionNotifications.finalWarningSentAt')
        .limit(50)
        .lean(),

      // User in Erinnerungsphase (Reminder gestartet, aber noch keine finale Warnung)
      User.find({
        'transactionLifecycle.retentionNotifications.reminderStartedAt': { $ne: null },
        'transactionLifecycle.retentionNotifications.finalWarningSentAt': null,
      })
        .select(
          'name email transactionLifecycle.retentionNotifications.reminderStartedAt transactionLifecycle.retentionNotifications.reminderCount'
        )
        .limit(50)
        .lean(),

      // User die exportiert haben
      User.find({
        'transactionLifecycle.retentionNotifications.exportConfirmedAt': { $ne: null },
      })
        .select('name email transactionLifecycle.retentionNotifications.exportConfirmedAt')
        .limit(50)
        .lean(),

      // User nahe am monatlichen Quota-Limit
      User.find({
        'transactionLifecycle.monthlyTransactionCount': { $gte: 120 },
      })
        .select('name email transactionLifecycle.monthlyTransactionCount')
        .limit(50)
        .lean(),
    ]);

  return {
    ...stats,
    config: {
      retentionMonths: lifecycleService.RETENTION_MONTHS,
      gracePeriodMonths: lifecycleService.GRACE_PERIOD_MONTHS,
      finalWarningDays: lifecycleService.FINAL_WARNING_DAYS,
      reminderCooldownDays: lifecycleService.REMINDER_COOLDOWN_DAYS,
      quotaLimit: 150,
    },
    usersInFinalWarningPhase: usersInFinalWarningPhase.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email || null,
      finalWarningSentAt: u.transactionLifecycle?.retentionNotifications?.finalWarningSentAt,
    })),
    usersInRemindingPhase: usersInRemindingPhase.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email || null,
      reminderStartedAt: u.transactionLifecycle?.retentionNotifications?.reminderStartedAt,
      reminderCount: u.transactionLifecycle?.retentionNotifications?.reminderCount || 0,
    })),
    usersWithExport: usersWithExport.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email || null,
      exportConfirmedAt: u.transactionLifecycle?.retentionNotifications?.exportConfirmedAt,
    })),
    usersApproachingQuota: usersApproachingQuota.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email || null,
      monthlyTransactionCount: u.transactionLifecycle?.monthlyTransactionCount || 0,
    })),
  };
}

/**
 * Detaillierter Lifecycle-Status eines einzelnen Users (Admin-Ansicht)
 * @param {string} userId - User-ID
 * @returns {Promise<Object|null>}
 */
async function getUserLifecycleDetail(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const lifecycleStatus = await lifecycleService.getLifecycleStatus(user);
  const { getQuotaStatus } = require('../middleware/transactionQuota');
  const quota = getQuotaStatus(user);

  // Transaktions-Alters-Verteilung
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [totalTx, oldTx, recentTx] = await Promise.all([
    Transaction.countDocuments({ userId: user._id }),
    Transaction.countDocuments({ userId: user._id, date: { $lt: twelveMonthsAgo } }),
    Transaction.countDocuments({ userId: user._id, date: { $gte: twelveMonthsAgo } }),
  ]);

  return {
    user: sanitizeUser(user),
    lifecycle: lifecycleStatus,
    quota,
    transactionBreakdown: {
      total: totalTx,
      olderThan12Months: oldTx,
      within12Months: recentTx,
    },
  };
}

/**
 * Retention-Status eines Users durch Admin zurücksetzen
 * @param {string} userId - User-ID
 * @returns {Promise<Object>}
 */
async function resetUserRetention(userId) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User nicht gefunden', code: 'USER_NOT_FOUND' };

  await lifecycleService.resetRetentionStatus(user);

  logger.info(`Admin: Retention status reset for user ${userId}`);
  return { success: true, message: 'Retention-Status zurückgesetzt' };
}

/**
 * Retention-Verarbeitung manuell auslösen (Admin-Trigger)
 * @returns {Promise<Object>} Processing-Statistiken
 */
async function triggerRetentionProcessing() {
  logger.info('Admin: Manual retention processing triggered');
  const stats = await lifecycleService.processRetentionForAllUsers();
  return stats;
}

/**
 * Generiert ein sicheres Passwort, das alle Anforderungen erfüllt:
 * Groß- und Kleinbuchstaben, Zahlen, Sonderzeichen, min. 12 Zeichen.
 */
function generateSecurePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const all = upper + lower + digits + special;

  // Garantiert je ein Zeichen aus jeder Gruppe
  const pick = charset => charset[crypto.randomInt(0, charset.length)];
  const required = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(special),
    pick(special),
  ];

  // Restliche Zeichen zufällig aus dem Gesamtpool (auf 16 Zeichen auffüllen)
  const extra = Array.from({ length: 8 }, () => pick(all));

  // Mischen via Fisher-Yates auf Basis von crypto.randomInt
  const chars = [...required, ...extra];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Neuen User anlegen
 * @returns {{ user, generatedPassword, emailSent, error? }}
 */
async function createUser(data) {
  const existsByName = await User.findOne({ name: data.name });
  if (existsByName) {
    return { error: 'Name ist bereits vergeben', code: 'NAME_TAKEN' };
  }

  if (data.email) {
    const existsByEmail = await User.findOne({ email: data.email });
    if (existsByEmail) {
      return { error: 'E-Mail ist bereits vergeben', code: 'EMAIL_TAKEN' };
    }
  }

  // Passwort: automatisch generieren oder vom Admin übernehmen
  const plainPassword = data.autoGeneratePassword ? generateSecurePassword() : data.password;

  const user = new User({
    name: data.name,
    ...(data.email && { email: data.email }),
    passwordHash: plainPassword,
    isVerified: data.isVerified ?? false,
    role: data.role || 'user',
    lastName: data.lastName || '',
    phone: data.phone || null,
  });

  await user.save();

  // Auto-Newsletter-Abo (fire & forget, nicht-kritisch)
  if (user.email) {
    Subscriber.findOne({ email: user.email })
      .then(existingSub => {
        if (!existingSub) {
          const sub = new Subscriber({
            email: user.email,
            userId: user._id,
            isConfirmed: true,
            subscribedAt: new Date(),
            confirmedAt: new Date(),
            language: data.emailLanguage || 'de',
          });
          sub.generateUnsubscribeToken();
          return sub.save();
        }
      })
      .catch(() => {});
  }

  // Email-Versand wenn eine Email-Adresse angegeben wurde
  let emailSent = false;
  let activationLink = null;

  if (data.email) {
    let activationToken = null;

    // Wenn noch nicht verifiziert: Aktivierungstoken generieren
    if (!user.isVerified) {
      activationToken = user.generateVerification();
      await user.save();
    }

    const emailResult = await sendAdminCreatedCredentialsEmail(
      user,
      plainPassword,
      activationToken,
      data.emailLanguage
    );
    emailSent = !!emailResult?.sent;
    activationLink = emailResult?.activationLink || null;
    logger.info(`Admin: Credentials email sent=${emailSent} for user ${user.name}`);
  }

  return {
    user: sanitizeUser(user),
    generatedPassword: data.autoGeneratePassword ? plainPassword : null,
    emailSent,
    activationLink,
  };
}

/**
 * User aktualisieren
 */
async function updateUser(userId, updates) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User nicht gefunden', code: 'USER_NOT_FOUND' };

  if (updates.email !== undefined && updates.email !== null) {
    const existsByEmail = await User.findOne({ email: updates.email, _id: { $ne: user._id } });
    if (existsByEmail) {
      return { error: 'E-Mail ist bereits vergeben', code: 'EMAIL_TAKEN' };
    }
  }

  // Verifizierung erfordert eine E-Mail-Adresse
  if (updates.isVerified === true && !user.email && !updates.email) {
    return {
      error: 'Eine E-Mail-Adresse ist erforderlich, um das Konto zu verifizieren',
      code: 'VERIFY_REQUIRES_EMAIL',
    };
  }

  Object.assign(user, updates);
  await user.save();
  logger.info(`Admin: User ${user._id} updated`);

  // Newsletter-Abo wenn User durch Admin verifiziert wird und Email vorhanden
  const emailForSub = updates.email || user.email;
  if (updates.isVerified === true && emailForSub) {
    Subscriber.findOne({ email: emailForSub })
      .then(existingSub => {
        if (!existingSub) {
          const sub = new Subscriber({
            email: emailForSub,
            userId: user._id,
            isConfirmed: true,
            subscribedAt: new Date(),
            confirmedAt: new Date(),
            language: 'de',
          });
          sub.generateUnsubscribeToken();
          return sub.save();
        }
      })
      .catch(() => {});
  }

  return { user: sanitizeUser(user) };
}

/**
 * User löschen (inkl. Transaktionen)
 */
async function deleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User nicht gefunden', code: 'USER_NOT_FOUND' };

  const deletedTransactions = await Transaction.deleteMany({ userId: user._id });

  // DSGVO: AuditLog-Einträge des Users löschen
  const auditLogService = require('./auditLogService');
  await auditLogService.deleteByUserId(user._id);

  await User.findByIdAndDelete(userId);

  logger.warn(
    `Admin: User ${user._id} deleted with ${deletedTransactions.deletedCount} transactions`
  );

  return {
    deletedUser: user.name,
    deletedTransactions: deletedTransactions.deletedCount,
  };
}

/**
 * Passwort eines Users zurücksetzen
 */
async function resetUserPassword(userId, newPassword) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User nicht gefunden', code: 'USER_NOT_FOUND' };

  user.passwordHash = newPassword;
  user.passwordChangedAt = new Date();
  user.lastPasswordChange = new Date();
  await user.save();

  logger.info(`Admin: Password reset for user ${user._id}`);
  return { success: true };
}

/**
 * Alle Users + Transaktionen löschen
 */
async function deleteAllUsers() {
  const userCount = await User.countDocuments();
  const transactionCount = await Transaction.countDocuments();

  await Transaction.deleteMany({});

  // DSGVO: Alle AuditLog-Einträge löschen
  const AuditLog = require('../models/AuditLog');
  await AuditLog.deleteMany({});

  await User.deleteMany({});

  logger.warn(`Admin: ALL USERS DELETED (${userCount} users, ${transactionCount} transactions)`);

  return { deletedUsers: userCount, deletedTransactions: transactionCount };
}

/**
 * User sperren (Ban)
 * @param {string} userId - User-ID
 * @param {string} reason - Sperrgrund
 * @returns {{ user, error? }}
 */
async function banUser(userId, reason = '') {
  const user = await User.findById(userId);
  if (!user) return { error: 'User nicht gefunden', code: 'USER_NOT_FOUND' };

  if (user.role === 'admin') {
    return { error: 'Admin-Accounts können nicht gesperrt werden', code: 'CANNOT_BAN_ADMIN' };
  }

  if (user.isActive === false) {
    return { error: 'User ist bereits gesperrt', code: 'ALREADY_BANNED' };
  }

  user.isActive = false;
  user.bannedAt = new Date();
  user.banReason = reason;
  // Alle Refresh-Tokens ungültig machen (erzwingt Logout)
  user.refreshTokens = [];
  await user.save();

  logger.warn(
    `Admin: User ${user._id} (${user.name}) banned. Reason: ${reason || 'Kein Grund angegeben'}`
  );

  return { user: sanitizeUser(user) };
}

/**
 * User-Sperre aufheben (Unban)
 * @param {string} userId - User-ID
 * @returns {{ user, error? }}
 */
async function unbanUser(userId) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User nicht gefunden', code: 'USER_NOT_FOUND' };

  if (user.isActive !== false) {
    return { error: 'User ist nicht gesperrt', code: 'NOT_BANNED' };
  }

  user.isActive = true;
  user.bannedAt = null;
  user.banReason = '';
  await user.save();

  logger.info(`Admin: User ${user._id} (${user.name}) unbanned`);

  return { user: sanitizeUser(user) };
}

/**
 * Rolle eines Users ändern
 * @param {string} userId - User-ID
 * @param {string} newRole - Neue Rolle ('user' oder 'admin')
 * @param {string} adminId - ID des ausführenden Admins (Selbstschutz)
 * @returns {{ user, error? }}
 */
async function changeUserRole(userId, newRole, adminId) {
  if (!['user', 'admin', 'viewer'].includes(newRole)) {
    return { error: 'Ungültige Rolle. Erlaubt: user, admin, viewer', code: 'INVALID_ROLE' };
  }

  const user = await User.findById(userId);
  if (!user) return { error: 'User nicht gefunden', code: 'USER_NOT_FOUND' };

  // Selbstschutz: Admin kann eigene Rolle nicht ändern
  if (userId === adminId) {
    return { error: 'Du kannst deine eigene Rolle nicht ändern', code: 'SELF_ROLE_CHANGE' };
  }

  // Letzter-Admin-Schutz: Letzter Admin kann nicht degradiert werden
  if (user.role === 'admin' && newRole !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return { error: 'Der letzte Admin kann nicht degradiert werden', code: 'LAST_ADMIN' };
    }
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  logger.info(
    `Admin: User ${user._id} (${user.name}) role changed from '${oldRole}' to '${newRole}'`
  );

  return { user: sanitizeUser(user) };
}

// ============================================
// TRANSACTION-VERWALTUNG
// ============================================

/**
 * Users mit Transaktions-Statistiken (für Admin Transactions-Übersicht)
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=15]
 * @param {string} [options.search] - Suche in name/email
 * @param {string} [options.sort='-transactionCount'] - Sortierung
 */
async function getUsersWithTransactionStats({
  page = 1,
  limit = 15,
  search,
  sort = '-transactionCount',
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));

  // Match stage for user search
  const userMatch = {};
  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim()).slice(0, 100);
    const regex = { $regex: escaped, $options: 'i' };
    userMatch.$or = [{ name: regex }, { email: regex }];
  }

  // Aggregation: get all users with their transaction stats
  const pipeline = [
    // Start with users
    { $match: userMatch },
    // Lookup transactions
    {
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'userId',
        as: 'txs',
      },
    },
    // Compute stats
    {
      $addFields: {
        transactionCount: { $size: '$txs' },
        totalIncome: {
          $sum: {
            $map: {
              input: { $filter: { input: '$txs', cond: { $eq: ['$$this.type', 'income'] } } },
              in: '$$this.amount',
            },
          },
        },
        totalExpense: {
          $sum: {
            $map: {
              input: { $filter: { input: '$txs', cond: { $eq: ['$$this.type', 'expense'] } } },
              in: '$$this.amount',
            },
          },
        },
        lastTransactionDate: { $max: '$txs.date' },
      },
    },
    // Remove txs array (large)
    { $project: { txs: 0, passwordHash: 0, refreshTokens: 0, __v: 0 } },
  ];

  // Sort — Whitelist erlaubter Felder
  const ALLOWED_TX_USER_SORT = new Set([
    'transactionCount',
    'totalIncome',
    'totalExpense',
    'lastTransactionDate',
    'name',
    'email',
    'createdAt',
  ]);
  const rawSortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortField = ALLOWED_TX_USER_SORT.has(rawSortField) ? rawSortField : 'transactionCount';
  const sortDir = sort.startsWith('-') ? -1 : 1;
  pipeline.push({ $sort: { [sortField]: sortDir, _id: 1 } });

  // Count total (before pagination)
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await User.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  // Paginate
  pipeline.push({ $skip: (safePage - 1) * safeLimit });
  pipeline.push({ $limit: safeLimit });

  const users = await User.aggregate(pipeline);

  return {
    users,
    pagination: {
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      limit: safeLimit,
    },
  };
}

/**
 * Alle Transaktionen auflisten (paginiert, filterbar)
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @param {string} [options.userId] - Filter nach User
 * @param {string} [options.type] - 'income' oder 'expense'
 * @param {string} [options.category] - Kategorie-Filter
 * @param {string} [options.startDate] - Startdatum (ISO)
 * @param {string} [options.endDate] - Enddatum (ISO)
 * @param {string} [options.search] - Textsuche in description
 * @param {string} [options.sort='-date'] - Sortierung
 */
async function listTransactions({
  page = 1,
  limit = 50,
  userId,
  type,
  category,
  startDate,
  endDate,
  search,
  sort = '-date',
} = {}) {
  // Whitelist erlaubter Sort-Felder — verhindert Sort-Injection
  const ALLOWED_TX_SORT = new Set(['date', 'amount', 'type', 'category', 'createdAt']);
  const txSortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const safeSort = ALLOWED_TX_SORT.has(txSortField) ? sort : '-date';

  const query = {};

  if (userId) query.userId = userId;
  if (type && ['income', 'expense'].includes(type)) query.type = type;
  if (category) query.category = category;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (search && search.trim()) {
    query.description = { $regex: escapeRegex(search.trim()).slice(0, 100), $options: 'i' };
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit)
      .populate('userId', 'name email'),
    Transaction.countDocuments(query),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      limit: safeLimit,
    },
  };
}

/**
 * Einzelne Transaktion abrufen
 */
async function getTransactionById(transactionId) {
  const transaction = await Transaction.findById(transactionId).populate('userId', 'name email');
  if (!transaction) return null;
  return transaction;
}

/**
 * Transaktion löschen (Admin)
 */
async function deleteTransaction(transactionId) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) return { error: 'Transaktion nicht gefunden', code: 'TRANSACTION_NOT_FOUND' };

  const info = {
    id: transaction._id,
    userId: transaction.userId,
    amount: transaction.amount,
    category: transaction.category,
    type: transaction.type,
    description: transaction.description,
  };

  await Transaction.findByIdAndDelete(transactionId);
  logger.warn(
    `Admin: Transaction ${transactionId} deleted (User: ${info.userId}, ${info.type} ${info.amount} ${info.category})`
  );

  return { deleted: info };
}

/**
 * Transaktions-Statistiken für Admin-Dashboard
 */
async function getTransactionStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalCount,
    last7DaysCount,
    last30DaysCount,
    typeBreakdown,
    categoryBreakdown,
    totalAmounts,
  ] = await Promise.all([
    Transaction.countDocuments(),
    Transaction.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Transaction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        },
      },
    ]),
  ]);

  const amounts = totalAmounts[0] || { totalIncome: 0, totalExpense: 0 };

  return {
    totalCount,
    last7DaysCount,
    last30DaysCount,
    totalIncome: amounts.totalIncome,
    totalExpense: amounts.totalExpense,
    netBalance: amounts.totalIncome - amounts.totalExpense,
    typeBreakdown,
    topCategories: categoryBreakdown,
  };
}

// ============================================
// SUBSCRIBER-VERWALTUNG
// ============================================

/**
 * Alle Newsletter-Abonnenten auflisten (paginiert, filterbar)
 */
async function listSubscribers({
  page = 1,
  limit = 50,
  isConfirmed,
  search,
  language,
  sort = '-createdAt',
} = {}) {
  // Whitelist erlaubter Sort-Felder — verhindert Sort-Injection
  const ALLOWED_SUB_SORT = new Set([
    'createdAt',
    'email',
    'subscribedAt',
    'language',
    'isConfirmed',
  ]);
  const subSortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const safeSort = ALLOWED_SUB_SORT.has(subSortField) ? sort : '-createdAt';

  const query = {};

  if (isConfirmed !== undefined) {
    query.isConfirmed = isConfirmed === 'true' || isConfirmed === true;
  }

  if (language) {
    query.language = language;
  }

  if (search && search.trim()) {
    query.email = { $regex: escapeRegex(search.trim()).slice(0, 100), $options: 'i' };
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [subscribers, total] = await Promise.all([
    Subscriber.find(query)
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit)
      .select('-confirmationToken -confirmationExpires -unsubscribeToken'),
    Subscriber.countDocuments(query),
  ]);

  return {
    subscribers,
    pagination: {
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      limit: safeLimit,
    },
  };
}

/**
 * Einzelnen Subscriber abrufen
 */
async function getSubscriberById(subscriberId) {
  const subscriber = await Subscriber.findById(subscriberId).select(
    '-confirmationToken -confirmationExpires -unsubscribeToken'
  );
  if (!subscriber) return null;
  // Migration-Fallback: Bestehende Subscriber ohne confirmedAt
  const sub = subscriber.toObject();
  if (sub.isConfirmed && !sub.confirmedAt) sub.confirmedAt = sub.subscribedAt;
  return sub;
}

/**
 * Subscriber löschen
 */
async function deleteSubscriber(subscriberId) {
  const subscriber = await Subscriber.findById(subscriberId);
  if (!subscriber) return { error: 'Subscriber nicht gefunden', code: 'SUBSCRIBER_NOT_FOUND' };

  const info = { email: subscriber.email, isConfirmed: subscriber.isConfirmed };
  await Subscriber.findByIdAndDelete(subscriberId);

  logger.warn(`Admin: Subscriber ${subscriberId} (${info.email}) deleted`);
  return { deleted: info };
}

/**
 * Subscriber-Statistiken für Admin-Dashboard
 */
async function getSubscriberStats() {
  const [totalCount, confirmedCount, languageBreakdown, recentSubscribers] = await Promise.all([
    Subscriber.countDocuments(),
    Subscriber.countDocuments({ isConfirmed: true }),
    Subscriber.aggregate([
      { $match: { isConfirmed: true } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Subscriber.find({ isConfirmed: true })
      .sort({ subscribedAt: -1 })
      .limit(5)
      .select('email subscribedAt language'),
  ]);

  return {
    totalCount,
    confirmedCount,
    unconfirmedCount: totalCount - confirmedCount,
    languageBreakdown,
    recentSubscribers,
  };
}

// ============================================
// CSV-EXPORT
// ============================================

/**
 * CSV-Escape: Wert für CSV-Zelle sicher machen
 */
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * User-Liste als CSV exportieren
 * Felder: Name, E-Mail, Rolle, Verifiziert, Aktiv, Registrierung, Letzte Anmeldung
 * KEINE sensiblen Daten (Passwort-Hash, Tokens)
 */
async function exportUsersCSV() {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .select('name email role isVerified isActive createdAt lastLogin')
    .lean();

  const header = 'Name,Email,Role,Verified,Active,Registered,Last Login';
  const rows = users.map(u =>
    [
      csvEscape(u.name),
      csvEscape(u.email || ''),
      csvEscape(u.role),
      u.isVerified ? 'Yes' : 'No',
      u.isActive !== false ? 'Yes' : 'No',
      u.createdAt ? new Date(u.createdAt).toISOString() : '',
      u.lastLogin ? new Date(u.lastLogin).toISOString() : '',
    ].join(',')
  );

  return `${header}\n${rows.join('\n')}`;
}

/**
 * Transaktions-Liste als CSV exportieren
 * Felder: Datum, Beschreibung, Kategorie, Typ, Betrag, User-Name, User-E-Mail
 * KEINE sensiblen Daten
 */
async function exportTransactionsCSV() {
  const transactions = await Transaction.find()
    .sort({ date: -1 })
    .populate('userId', 'name email')
    .lean();

  const header = 'Date,Description,Category,Type,Amount,User Name,User Email';
  const rows = transactions.map(tx =>
    [
      tx.date ? new Date(tx.date).toISOString() : '',
      csvEscape(tx.description || ''),
      csvEscape(tx.category || ''),
      csvEscape(tx.type || ''),
      tx.amount != null ? tx.amount : '',
      csvEscape(tx.userId?.name || ''),
      csvEscape(tx.userId?.email || ''),
    ].join(',')
  );

  return `${header}\n${rows.join('\n')}`;
}

/**
 * Subscriber bearbeiten (Sprache, Bestätigungsstatus)
 * @param {string} subscriberId - Subscriber-ID
 * @param {Object} updates - { language?, isConfirmed? }
 * @returns {Object} { updated } oder { error, code }
 */
async function updateSubscriber(subscriberId, updates) {
  const subscriber = await Subscriber.findById(subscriberId);
  if (!subscriber) return { error: 'Subscriber nicht gefunden', code: 'SUBSCRIBER_NOT_FOUND' };

  // Nur erlaubte Felder änderbar
  if (updates.language && ['de', 'en', 'ar', 'ka'].includes(updates.language)) {
    subscriber.language = updates.language;
  }
  if (typeof updates.isConfirmed === 'boolean') {
    subscriber.isConfirmed = updates.isConfirmed;
    if (updates.isConfirmed && !subscriber.confirmedAt) {
      subscriber.confirmedAt = new Date();
      subscriber.subscribedAt = subscriber.subscribedAt || new Date();
    }
  }

  await subscriber.save();
  logger.info(`Admin: Subscriber ${subscriberId} updated`);
  return { updated: subscriber };
}

/**
 * Bestätigungs-E-Mail erneut senden (Resend)
 * @param {string} subscriberId - Subscriber-ID
 * @returns {Object} { resent, email } oder { error, code }
 */
async function resendConfirmation(subscriberId) {
  const subscriber = await Subscriber.findById(subscriberId);
  if (!subscriber) return { error: 'Subscriber nicht gefunden', code: 'SUBSCRIBER_NOT_FOUND' };
  if (subscriber.isConfirmed)
    return { error: 'Subscriber ist bereits bestätigt', code: 'ALREADY_CONFIRMED' };

  // Neuen Token generieren
  const emailService = require('../utils/emailService');
  const confirmToken = subscriber.generateConfirmationToken();
  const unsubscribeToken = subscriber.generateUnsubscribeToken();
  await subscriber.save();

  await emailService.sendNewsletterConfirmation(
    subscriber.email,
    confirmToken,
    unsubscribeToken,
    subscriber.language
  );

  logger.info(`Admin: Resent confirmation to ${subscriber.email}`);
  return { resent: true, email: subscriber.email };
}

/**
 * Subscriber-CSV-Export
 * @returns {string} CSV-String
 */
async function exportSubscribersCSV() {
  const subscribers = await Subscriber.find()
    .sort({ createdAt: -1 })
    .select('email language isConfirmed subscribedAt confirmedAt createdAt userId')
    .lean();

  const header = 'Email,Language,Confirmed,SubscribedAt,ConfirmedAt,CreatedAt,Type';
  const rows = subscribers.map(s =>
    [
      csvEscape(s.email),
      csvEscape(s.language),
      s.isConfirmed ? 'Yes' : 'No',
      s.subscribedAt ? new Date(s.subscribedAt).toISOString() : '',
      s.confirmedAt ? new Date(s.confirmedAt).toISOString() : '',
      new Date(s.createdAt).toISOString(),
      s.userId ? 'Registered' : 'Guest',
    ].join(',')
  );

  return `${header}\n${rows.join('\n')}`;
}

module.exports = {
  listUsers,
  getUserById,
  getStats,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  deleteAllUsers,
  banUser,
  unbanUser,
  changeUserRole,
  // Transactions
  getUsersWithTransactionStats,
  listTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionStats,
  // Subscribers
  listSubscribers,
  getSubscriberById,
  deleteSubscriber,
  getSubscriberStats,
  updateSubscriber,
  resendConfirmation,
  exportSubscribersCSV,
  // Lifecycle
  getLifecycleStats,
  getUserLifecycleDetail,
  resetUserRetention,
  triggerRetentionProcessing,
  // CSV Export
  exportUsersCSV,
  exportTransactionsCSV,
};
