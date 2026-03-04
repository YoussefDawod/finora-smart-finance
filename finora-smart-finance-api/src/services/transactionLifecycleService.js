/**
 * Transaction Lifecycle Service
 * Zentrale Business-Logik für den Transaktions-Lebenszyklus:
 *
 * 1. Retention-Management: Jährliche Löschung mit 3-Monats-Puffer + 1-Woche-Finale
 * 2. Erinnerungen: Wöchentliche Emails + Login-Toast für User ohne Email
 * 3. Smart-Löschung: Unterscheidet ob User vorher exportiert hat
 * 4. Lifecycle-Status: API-Endpunkt-Daten für Frontend + Admin
 *
 * Zeitlinie:
 *   Monat 1-12:      Transaktionen sind aktiv
 *   Monat 12+:       Retention-Fenster beginnt → wöchentliche Erinnerungen
 *   Monat 15:         3-Monats-Puffer abgelaufen → finale Warnung (1 Woche)
 *   Monat 15 + 7d:   Endgültige Löschung → Smart-Bestätigung
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auditLogService = require('./auditLogService');
const logger = require('../utils/logger');

// ============================================
// KONSTANTEN
// ============================================

/** Retention-Zeitraum: Transaktionen werden nach X Monaten zum Löschen vorgemerkt */
const RETENTION_MONTHS = 12;

/** Puffer-Zeitraum: User hat X Monate Zeit zum Exportieren */
const GRACE_PERIOD_MONTHS = 3;

/** Finale Warnung: X Tage vor endgültiger Löschung */
const FINAL_WARNING_DAYS = 7;

/** Erinnerungs-Cooldown: Mindestens X Tage zwischen wöchentlichen Erinnerungen */
const REMINDER_COOLDOWN_DAYS = 7;

/** Login-Toast-Cooldown: Mindestens X Tage zwischen Login-Toasts */
const LOGIN_TOAST_COOLDOWN_DAYS = 1;

// ============================================
// HILFSFUNKTIONEN
// ============================================

/**
 * Berechnet das Datum X Monate in der Vergangenheit
 * @param {number} months - Anzahl Monate
 * @returns {Date}
 */
function monthsAgo(months) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

/**
 * Berechnet das Datum X Tage in der Vergangenheit
 * @param {number} days - Anzahl Tage
 * @returns {Date}
 */
function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Prüft ob ein User Transaktionen hat die älter als der Retention-Zeitraum sind
 * @param {string} userId - User ID
 * @returns {Promise<{hasOldTransactions: boolean, oldestDate: Date|null, count: number}>}
 */
async function checkOldTransactions(userId) {
  const cutoffDate = monthsAgo(RETENTION_MONTHS);

  const result = await Transaction.aggregate([
    { $match: { userId: userId, date: { $lt: cutoffDate } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        oldestDate: { $min: '$date' },
      },
    },
  ]);

  if (result.length === 0) {
    return { hasOldTransactions: false, oldestDate: null, count: 0 };
  }

  return {
    hasOldTransactions: true,
    oldestDate: result[0].oldestDate,
    count: result[0].count,
  };
}

/**
 * Prüft ob der 3-Monats-Puffer abgelaufen ist
 * @param {Object} retentionNotifications - User retention notifications
 * @returns {boolean}
 */
function isGracePeriodExpired(retentionNotifications) {
  if (!retentionNotifications?.reminderStartedAt) return false;

  const gracePeriodEnd = new Date(retentionNotifications.reminderStartedAt);
  gracePeriodEnd.setMonth(gracePeriodEnd.getMonth() + GRACE_PERIOD_MONTHS);

  return new Date() >= gracePeriodEnd;
}

/**
 * Prüft ob die finale 1-Woche-Frist abgelaufen ist
 * @param {Object} retentionNotifications - User retention notifications
 * @returns {boolean}
 */
function isFinalWeekExpired(retentionNotifications) {
  if (!retentionNotifications?.finalWarningSentAt) return false;

  const finalDeadline = new Date(retentionNotifications.finalWarningSentAt);
  finalDeadline.setDate(finalDeadline.getDate() + FINAL_WARNING_DAYS);

  return new Date() >= finalDeadline;
}

/**
 * Prüft ob seit der letzten Erinnerung genug Zeit vergangen ist (7 Tage Cooldown)
 * @param {Object} retentionNotifications - User retention notifications
 * @returns {boolean}
 */
function canSendReminder(retentionNotifications) {
  if (!retentionNotifications?.lastReminderSentAt) return true;

  const cooldownEnd = new Date(retentionNotifications.lastReminderSentAt);
  cooldownEnd.setDate(cooldownEnd.getDate() + REMINDER_COOLDOWN_DAYS);

  return new Date() >= cooldownEnd;
}

// ============================================
// KERN-FUNKTIONEN
// ============================================

/**
 * Verarbeitet den Retention-Lifecycle für ALLE User.
 * Wird täglich vom Cron-Job aufgerufen.
 *
 * Pro User wird geprüft:
 * 1. Hat der User alte Transaktionen (>12 Monate)?
 * 2. Wenn ja: In welcher Phase befinden wir uns?
 *    a) Erinnerungs-Phase → wöchentliche Email/Toast-Flag
 *    b) Finale-Warnung → 1-Woche-Warnung senden
 *    c) Lösch-Phase → Transaktionen löschen + Bestätigung
 *
 * @returns {Promise<Object>} Statistiken
 */
async function processRetentionForAllUsers() {
  logger.info('[Lifecycle] Starting daily retention processing...');

  const stats = {
    processed: 0,
    reminders: 0,
    finalWarnings: 0,
    deletions: 0,
    errors: 0,
    skipped: 0,
  };

  try {
    // Finde alle aktiven User (nicht gebannt, keine Admins die nur verwalten)
    const users = await User.find({
      isActive: true,
      role: 'user',
    }).select('_id name email isVerified preferences transactionLifecycle');

    logger.info(`[Lifecycle] Processing ${users.length} active users`);

    for (const user of users) {
      try {
        await processRetentionForUser(user, stats);
        stats.processed++;
      } catch (error) {
        logger.error(`[Lifecycle] Error processing user ${user._id}: ${error.message}`);
        stats.errors++;
      }
    }
  } catch (error) {
    logger.error(`[Lifecycle] Fatal error in retention processing: ${error.message}`);
    stats.errors++;
  }

  logger.info(
    `[Lifecycle] Retention processing complete: ${stats.processed} processed, ` +
      `${stats.reminders} reminders, ${stats.finalWarnings} final warnings, ` +
      `${stats.deletions} deletions, ${stats.skipped} skipped, ${stats.errors} errors`
  );

  return stats;
}

/**
 * Verarbeitet den Retention-Lifecycle für einen einzelnen User.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @param {Object} stats - Statistik-Objekt (wird mutiert)
 */
async function processRetentionForUser(user, stats) {
  const { hasOldTransactions, oldestDate, count } = await checkOldTransactions(user._id);

  if (!hasOldTransactions) {
    // Keine alten Transaktionen → Retention-Status zurücksetzen falls nötig
    if (user.transactionLifecycle?.retentionNotifications?.reminderStartedAt) {
      await resetRetentionStatus(user);
    }
    stats.skipped++;
    return;
  }

  const retention = user.transactionLifecycle?.retentionNotifications || {};

  // Phase 1: Erinnerungen starten (wenn noch nicht gestartet)
  if (!retention.reminderStartedAt) {
    await startRetentionReminders(user, oldestDate, count);
    stats.reminders++;
    return;
  }

  // Hat der User bereits exportiert? → Keine Erinnerungen mehr, aber Löschung läuft weiter
  const hasExported = !!retention.exportConfirmedAt;

  // Phase 3: Finale Woche abgelaufen → LÖSCHEN
  if (retention.finalWarningSentAt && isFinalWeekExpired(retention)) {
    await deleteExpiredTransactions(user, hasExported);
    stats.deletions++;
    return;
  }

  // Phase 2: 3-Monats-Puffer abgelaufen → Finale Warnung senden
  if (isGracePeriodExpired(retention) && !retention.finalWarningSentAt) {
    await sendFinalWarning(user, count);
    stats.finalWarnings++;
    return;
  }

  // Phase 1 (fortlaufend): Wöchentliche Erinnerung senden (nicht wenn Final Warning bereits gesendet)
  if (!hasExported && !retention.finalWarningSentAt && canSendReminder(retention)) {
    await sendWeeklyRetentionReminder(user, oldestDate, count);
    stats.reminders++;
    return;
  }

  stats.skipped++;
}

/**
 * Startet die Retention-Erinnerungen für einen User.
 * Setzt `reminderStartedAt` und sendet die erste Erinnerung.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @param {Date} oldestDate - Ältestes Transaktionsdatum
 * @param {number} count - Anzahl alter Transaktionen
 */
async function startRetentionReminders(user, oldestDate, count) {
  const now = new Date();

  // Lifecycle-Felder aktualisieren
  if (!user.transactionLifecycle) {
    user.transactionLifecycle = {};
  }
  if (!user.transactionLifecycle.retentionNotifications) {
    user.transactionLifecycle.retentionNotifications = {};
  }

  user.transactionLifecycle.retentionNotifications.reminderStartedAt = now;
  user.transactionLifecycle.retentionNotifications.lastReminderSentAt = now;
  user.transactionLifecycle.retentionNotifications.reminderCount = 1;

  await user.save();

  // Email senden (falls User Email hat und verifiziert ist)
  await sendRetentionEmail(user, 'reminder', { oldestDate, count, reminderNumber: 1 });

  logger.info(
    `[Lifecycle] Retention started for user ${user._id}: ${count} old transactions (oldest: ${oldestDate?.toISOString()})`
  );
}

/**
 * Sendet eine wöchentliche Retention-Erinnerung.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @param {Date} oldestDate - Ältestes Transaktionsdatum
 * @param {number} count - Anzahl alter Transaktionen
 */
async function sendWeeklyRetentionReminder(user, oldestDate, count) {
  const retention = user.transactionLifecycle.retentionNotifications;
  const reminderCount = (retention.reminderCount || 0) + 1;

  retention.lastReminderSentAt = new Date();
  retention.reminderCount = reminderCount;

  await user.save();

  await sendRetentionEmail(user, 'reminder', { oldestDate, count, reminderNumber: reminderCount });

  // AuditLog
  await auditLogService.log({
    action: 'RETENTION_REMINDER_SENT',
    adminName: 'System/Lifecycle',
    targetUserId: user._id,
    targetUserName: user.name,
    details: { reminderCount, transactionCount: count, oldestDate },
  });

  logger.info(`[Lifecycle] Retention reminder #${reminderCount} sent to user ${user._id}`);
}

/**
 * Sendet die finale Warnung (1 Woche vor Löschung).
 *
 * @param {Object} user - Mongoose User-Dokument
 * @param {number} count - Anzahl alter Transaktionen
 */
async function sendFinalWarning(user, count) {
  if (!user.transactionLifecycle) {
    user.transactionLifecycle = {};
  }
  if (!user.transactionLifecycle.retentionNotifications) {
    user.transactionLifecycle.retentionNotifications = {};
  }

  user.transactionLifecycle.retentionNotifications.finalWarningSentAt = new Date();

  await user.save();

  await sendRetentionEmail(user, 'finalWarning', { count, daysRemaining: FINAL_WARNING_DAYS });

  // AuditLog
  await auditLogService.log({
    action: 'RETENTION_FINAL_WARNING_SENT',
    adminName: 'System/Lifecycle',
    targetUserId: user._id,
    targetUserName: user.name,
    details: { transactionCount: count, daysRemaining: FINAL_WARNING_DAYS },
  });

  logger.info(
    `[Lifecycle] Final warning sent to user ${user._id}: ${count} transactions, ${FINAL_WARNING_DAYS} days remaining`
  );
}

/**
 * Löscht abgelaufene Transaktionen und sendet eine Smart-Bestätigung.
 * Unterscheidet ob der User vorher exportiert hat oder nicht.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @param {boolean} hasExported - Ob der User vorher exportiert hat
 */
async function deleteExpiredTransactions(user, hasExported) {
  const cutoffDate = monthsAgo(RETENTION_MONTHS);

  // Statistiken VOR Löschung
  const deletionStats = await Transaction.aggregate([
    { $match: { userId: user._id, date: { $lt: cutoffDate } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        oldestDate: { $min: '$date' },
        newestDate: { $max: '$date' },
      },
    },
  ]);

  const stats = deletionStats[0] || { count: 0, totalIncome: 0, totalExpense: 0 };

  // Löschung durchführen
  const result = await Transaction.deleteMany({
    userId: user._id,
    date: { $lt: cutoffDate },
  });

  // Lifecycle-Felder aktualisieren
  if (!user.transactionLifecycle) {
    user.transactionLifecycle = {};
  }
  if (!user.transactionLifecycle.retentionNotifications) {
    user.transactionLifecycle.retentionNotifications = {};
  }

  const now = new Date();
  user.transactionLifecycle.retentionNotifications.deletionExecutedAt = now;
  user.transactionLifecycle.retentionNotifications.deletionNotificationSentAt = now;

  // Retention-Status zurücksetzen für nächsten Zyklus
  user.transactionLifecycle.retentionNotifications.reminderStartedAt = null;
  user.transactionLifecycle.retentionNotifications.lastReminderSentAt = null;
  user.transactionLifecycle.retentionNotifications.reminderCount = 0;
  user.transactionLifecycle.retentionNotifications.finalWarningSentAt = null;
  user.transactionLifecycle.retentionNotifications.exportConfirmedAt = null;

  await user.save();

  // Smart-Email: Unterscheidet ob User exportiert hat
  await sendRetentionEmail(user, hasExported ? 'deletionExported' : 'deletionNotExported', {
    count: stats.count,
    totalIncome: stats.totalIncome,
    totalExpense: stats.totalExpense,
    oldestDate: stats.oldestDate,
    newestDate: stats.newestDate,
  });

  // AuditLog
  await auditLogService.log({
    action: 'TRANSACTIONS_AUTO_DELETED',
    adminName: 'System/Lifecycle',
    targetUserId: user._id,
    targetUserName: user.name,
    details: {
      deletedCount: result.deletedCount,
      hasExported,
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      cutoffDate: cutoffDate.toISOString(),
    },
  });

  logger.info(
    `[Lifecycle] Deleted ${result.deletedCount} expired transactions for user ${user._id} (exported: ${hasExported})`
  );
}

/**
 * Sendet eine Retention-bezogene Email an den User.
 * Delegiert an das Email-Service-Modul (wird in Phase 6/7 erstellt).
 * Falls kein Email-Modul vorhanden: Fire-and-forget Logging.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @param {string} type - 'reminder' | 'finalWarning' | 'deletionExported' | 'deletionNotExported'
 * @param {Object} data - Zusätzliche Daten für das Template
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
async function sendRetentionEmail(user, type, data) {
  // User hat keine Email → kann nicht per Mail benachrichtigt werden
  if (!user.email || !user.isVerified) {
    return { sent: false, reason: 'NO_VERIFIED_EMAIL' };
  }

  // Email-Benachrichtigungen deaktiviert
  if (!user.preferences?.emailNotifications) {
    return { sent: false, reason: 'NOTIFICATIONS_DISABLED' };
  }

  try {
    // Versuche das Lifecycle-Email-Modul zu laden (wird in Phase 7 erstellt)
    const lifecycleEmails = require('../utils/emailService/lifecycleEmails');
    return await lifecycleEmails.sendLifecycleEmail(user, type, data);
  } catch (error) {
    // Modul existiert noch nicht → nur loggen (wird in Phase 7 erstellt)
    if (error.code === 'MODULE_NOT_FOUND') {
      logger.debug(
        `[Lifecycle] Email module not yet available (Phase 7), skipping ${type} email for user ${user._id}`
      );
      return { sent: false, reason: 'EMAIL_MODULE_NOT_READY' };
    }
    logger.error(`[Lifecycle] Failed to send ${type} email to user ${user._id}: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

/**
 * Setzt den Retention-Status eines Users zurück.
 * Wird aufgerufen wenn keine alten Transaktionen mehr vorhanden sind.
 *
 * @param {Object} user - Mongoose User-Dokument
 */
async function resetRetentionStatus(user) {
  if (!user.transactionLifecycle?.retentionNotifications) return;

  user.transactionLifecycle.retentionNotifications.reminderStartedAt = null;
  user.transactionLifecycle.retentionNotifications.lastReminderSentAt = null;
  user.transactionLifecycle.retentionNotifications.reminderCount = 0;
  user.transactionLifecycle.retentionNotifications.finalWarningSentAt = null;
  // exportConfirmedAt und deletionExecutedAt bleiben als Historie

  await user.save();
  logger.debug(`[Lifecycle] Retention status reset for user ${user._id}`);
}

// ============================================
// EXPORT-BESTÄTIGUNG
// ============================================

/**
 * Markiert dass der User seine Daten exportiert hat.
 * Stoppt weitere Erinnerungen (aber nicht die Löschung nach Fristablauf).
 *
 * @param {Object} user - Mongoose User-Dokument
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function markExportConfirmed(user) {
  if (!user.transactionLifecycle) {
    user.transactionLifecycle = {};
  }
  if (!user.transactionLifecycle.retentionNotifications) {
    user.transactionLifecycle.retentionNotifications = {};
  }

  user.transactionLifecycle.retentionNotifications.exportConfirmedAt = new Date();

  await user.save();

  // AuditLog
  await auditLogService.log({
    action: 'USER_EXPORT_CONFIRMED',
    adminName: 'System/Lifecycle',
    targetUserId: user._id,
    targetUserName: user.name,
    details: { confirmedAt: new Date().toISOString() },
  });

  logger.info(`[Lifecycle] Export confirmed for user ${user._id}`);

  return { success: true, message: 'Export-Bestätigung gespeichert' };
}

// ============================================
// STATUS-ABFRAGEN
// ============================================

/**
 * Gibt den vollständigen Lifecycle-Status eines Users zurück.
 * Wird für API-Responses und Frontend-Anzeige verwendet.
 *
 * @param {Object} user - Mongoose User-Dokument
 * @returns {Promise<Object>} Lifecycle-Status
 */
async function getLifecycleStatus(user) {
  const { hasOldTransactions, oldestDate, count } = await checkOldTransactions(user._id);
  const retention = user.transactionLifecycle?.retentionNotifications || {};

  let phase = 'active'; // Keine alten Transaktionen
  let daysUntilDeletion = null;
  let daysUntilFinalWarning = null;

  if (hasOldTransactions) {
    if (retention.finalWarningSentAt) {
      // Phase 3: Finale Woche
      phase = 'finalWarning';
      const deadline = new Date(retention.finalWarningSentAt);
      deadline.setDate(deadline.getDate() + FINAL_WARNING_DAYS);
      daysUntilDeletion = Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));
    } else if (retention.reminderStartedAt && isGracePeriodExpired(retention)) {
      // Phase 2+: Grace-Period abgelaufen, aber Final-Warning noch nicht gesendet
      phase = 'gracePeriodExpired';
      daysUntilDeletion = FINAL_WARNING_DAYS;
    } else if (retention.reminderStartedAt) {
      // Phase 1: Erinnerungen laufen
      phase = 'reminding';
      const gracePeriodEnd = new Date(retention.reminderStartedAt);
      gracePeriodEnd.setMonth(gracePeriodEnd.getMonth() + GRACE_PERIOD_MONTHS);
      const daysToGraceEnd = Math.max(
        0,
        Math.ceil((gracePeriodEnd - new Date()) / (1000 * 60 * 60 * 24))
      );
      daysUntilFinalWarning = daysToGraceEnd;
      daysUntilDeletion = daysToGraceEnd + FINAL_WARNING_DAYS;
    } else {
      // Alte Transaktionen vorhanden, aber Erinnerungen noch nicht gestartet
      phase = 'pending';
    }
  }

  return {
    retention: {
      phase,
      hasOldTransactions,
      oldTransactionCount: count,
      oldestTransactionDate: oldestDate?.toISOString() || null,
      reminderStartedAt: retention.reminderStartedAt?.toISOString() || null,
      reminderCount: retention.reminderCount || 0,
      lastReminderSentAt: retention.lastReminderSentAt?.toISOString() || null,
      finalWarningSentAt: retention.finalWarningSentAt?.toISOString() || null,
      exportConfirmedAt: retention.exportConfirmedAt?.toISOString() || null,
      deletionExecutedAt: retention.deletionExecutedAt?.toISOString() || null,
      daysUntilDeletion,
      daysUntilFinalWarning,
    },
  };
}

/**
 * Prüft ob der User beim Login eine Toast-Benachrichtigung erhalten soll.
 * Wird im Login-Flow aufgerufen.
 *
 * Bedingungen für Toast:
 * - User hat alte Transaktionen (>12 Monate)
 * - User hat KEINE verifizierte Email (sonst bekommt er Emails)
 * - Oder: User hat Emails deaktiviert
 * - Cooldown: Max 1x pro Tag
 *
 * @param {Object} user - Mongoose User-Dokument
 * @returns {Promise<{showToast: boolean, notification?: Object}>}
 */
async function getLoginNotification(user) {
  const { hasOldTransactions, count } = await checkOldTransactions(user._id);

  if (!hasOldTransactions) {
    return { showToast: false };
  }

  const retention = user.transactionLifecycle?.retentionNotifications || {};
  const hasVerifiedEmail = user.email && user.isVerified;
  const emailsEnabled = user.preferences?.emailNotifications;

  // User bekommt bereits Emails → kein Toast nötig
  if (hasVerifiedEmail && emailsEnabled) {
    return { showToast: false };
  }

  // Cooldown prüfen
  if (retention.lastLoginToastShownAt) {
    const cooldownEnd = new Date(retention.lastLoginToastShownAt);
    cooldownEnd.setDate(cooldownEnd.getDate() + LOGIN_TOAST_COOLDOWN_DAYS);
    if (new Date() < cooldownEnd) {
      return { showToast: false };
    }
  }

  // Toast-Datum aktualisieren
  if (!user.transactionLifecycle) {
    user.transactionLifecycle = {};
  }
  if (!user.transactionLifecycle.retentionNotifications) {
    user.transactionLifecycle.retentionNotifications = {};
  }
  user.transactionLifecycle.retentionNotifications.lastLoginToastShownAt = new Date();
  await user.save();

  // Notification-Typ basierend auf Phase
  let severity = 'warning';
  let type = 'retention_reminder';

  if (retention.finalWarningSentAt) {
    severity = 'error';
    type = 'retention_final_warning';
  }

  return {
    showToast: true,
    notification: {
      type,
      severity,
      transactionCount: count,
      action: 'export',
    },
  };
}

// ============================================
// ADMIN-STATISTIKEN
// ============================================

/**
 * Gibt Lifecycle-Statistiken für das Admin-Dashboard zurück.
 *
 * @returns {Promise<Object>} Lifecycle-Stats
 */
async function getAdminLifecycleStats() {
  try {
    const cutoffDate = monthsAgo(RETENTION_MONTHS);

    // User mit alten Transaktionen (aggregiert)
    const usersWithOldTx = await Transaction.aggregate([
      { $match: { date: { $lt: cutoffDate } } },
      { $group: { _id: '$userId' } },
      { $count: 'total' },
    ]);

    // User in verschiedenen Retention-Phasen
    const usersInReminding = await User.countDocuments({
      'transactionLifecycle.retentionNotifications.reminderStartedAt': { $ne: null },
      'transactionLifecycle.retentionNotifications.finalWarningSentAt': null,
    });

    const usersInFinalWarning = await User.countDocuments({
      'transactionLifecycle.retentionNotifications.finalWarningSentAt': { $ne: null },
    });

    const usersExported = await User.countDocuments({
      'transactionLifecycle.retentionNotifications.exportConfirmedAt': { $ne: null },
    });

    // Löschungen diesen Monat
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const deletionsThisMonth = await User.countDocuments({
      'transactionLifecycle.retentionNotifications.deletionExecutedAt': { $gte: startOfMonth },
    });

    // User die Quota-Limit nahe sind (>= 120/150)
    const usersApproachingLimit = await User.countDocuments({
      'transactionLifecycle.monthlyTransactionCount': { $gte: 120 },
    });

    const usersAtLimit = await User.countDocuments({
      'transactionLifecycle.monthlyTransactionCount': { $gte: 150 },
    });

    return {
      usersWithOldTransactions: usersWithOldTx[0]?.total || 0,
      usersInReminding,
      usersInFinalWarning,
      usersExported,
      deletionsThisMonth,
      usersApproachingLimit,
      usersAtLimit,
    };
  } catch (error) {
    logger.error(`[Lifecycle] Failed to get admin stats: ${error.message}`);
    return {
      usersWithOldTransactions: 0,
      usersInReminding: 0,
      usersInFinalWarning: 0,
      usersExported: 0,
      deletionsThisMonth: 0,
      usersApproachingLimit: 0,
      usersAtLimit: 0,
    };
  }
}

module.exports = {
  // Kern-Lifecycle
  processRetentionForAllUsers,
  processRetentionForUser,

  // Aktionen
  deleteExpiredTransactions,
  sendFinalWarning,
  sendWeeklyRetentionReminder,
  startRetentionReminders,
  markExportConfirmed,
  resetRetentionStatus,

  // Status-Abfragen
  getLifecycleStatus,
  getLoginNotification,
  getAdminLifecycleStats,

  // Hilfsfunktionen (exportiert für Tests)
  checkOldTransactions,
  isGracePeriodExpired,
  isFinalWeekExpired,
  canSendReminder,
  monthsAgo,
  daysAgo,

  // Konstanten (exportiert für Tests + Konfiguration)
  RETENTION_MONTHS,
  GRACE_PERIOD_MONTHS,
  FINAL_WARNING_DAYS,
  REMINDER_COOLDOWN_DAYS,
  LOGIN_TOAST_COOLDOWN_DAYS,
};
