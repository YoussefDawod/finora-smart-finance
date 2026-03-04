/**
 * Lifecycle Scheduler Service
 * Steuert die tägliche Ausführung des Retention-Lifecycle-Prozesses.
 *
 * Wird analog zum Report Scheduler in server.js als setInterval registriert.
 * Täglich um 3:00 Uhr wird `processRetentionForAllUsers()` aufgerufen.
 *
 * Zeitplan:
 * - Täglich um 3:00 Uhr nachts (niedrige Last-Periode)
 * - Deduplizierung über `lastProcessingDate` (dateKey), damit pro Tag max. 1× läuft
 */

const logger = require('../utils/logger');
const { processRetentionForAllUsers } = require('./transactionLifecycleService');
const auditLogService = require('./auditLogService');

/** Stunde zu der die Retention-Verarbeitung startet (24h-Format) */
const PROCESSING_HOUR = 3;

/** Tracking: An welchem Tag zuletzt verarbeitet wurde */
let lastProcessingDate = null;

/**
 * Prüft ob die Retention-Verarbeitung heute fällig ist und führt sie ggf. aus.
 * Wird vom Scheduler-Intervall in server.js aufgerufen (alle 60 Minuten).
 *
 * @returns {Promise<{executed: boolean, stats?: Object, reason?: string}>}
 */
async function checkAndProcessRetention() {
  const now = new Date();
  const hour = now.getHours();
  const dateKey = now.toISOString().split('T')[0];

  // Nur einmal pro Tag und erst ab der konfigurierten Stunde
  if (hour < PROCESSING_HOUR) {
    return { executed: false, reason: 'TOO_EARLY' };
  }

  if (lastProcessingDate === dateKey) {
    return { executed: false, reason: 'ALREADY_PROCESSED_TODAY' };
  }

  // Markiere sofort, um Race Conditions zu vermeiden
  lastProcessingDate = dateKey;

  logger.info(`[Lifecycle Scheduler] Starting daily retention processing for ${dateKey}...`);

  try {
    const stats = await processRetentionForAllUsers();

    // Audit-Log nur wenn tatsächlich etwas passiert ist
    if (stats.reminders > 0 || stats.finalWarnings > 0 || stats.deletions > 0) {
      await auditLogService.log({
        action: 'RETENTION_SCHEDULED_RUN',
        performedBy: null,
        details: {
          dateKey,
          ...stats,
        },
      });
    }

    logger.info(
      `[Lifecycle Scheduler] Daily processing complete for ${dateKey}: ` +
        `${stats.processed} processed, ${stats.deletions} deletions`
    );

    return { executed: true, stats };
  } catch (error) {
    logger.error(`[Lifecycle Scheduler] Failed for ${dateKey}: ${error.message}`);
    // Datum zurücksetzen, damit es beim nächsten Intervall erneut versucht wird
    lastProcessingDate = null;
    return { executed: false, reason: error.message };
  }
}

/**
 * Setzt den Scheduler-Status zurück (für Tests)
 */
function resetSchedulerState() {
  lastProcessingDate = null;
}

/**
 * Gibt den letzten Verarbeitungstag zurück (für Monitoring/Admin)
 * @returns {string|null}
 */
function getLastProcessingDate() {
  return lastProcessingDate;
}

module.exports = {
  checkAndProcessRetention,
  resetSchedulerState,
  getLastProcessingDate,
  PROCESSING_HOUR,
};
