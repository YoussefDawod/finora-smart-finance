// utils/logger.js
const fs = require('fs');
const { appendFile, readdir, stat, unlink, rename } = require('fs/promises');
const path = require('path');

// ============================================
// Konfiguration
// ============================================

// Standard-Werte (können über env.js überschrieben werden)
const DEFAULT_MAX_AGE_DAYS = 14;    // Log-Dateien älter als 14 Tage löschen
const DEFAULT_MAX_SIZE_MB = 10;     // Einzelne Datei max. 10 MB, dann rotieren
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // Alle 24h Cleanup ausführen

// Logs-Verzeichnis erstellen (im Root, nicht in src/)
// Sync ist hier akzeptabel – läuft nur einmal beim Start
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Rotation-Config laden (lazy, damit env.js nicht zirkulär importiert wird)
let _rotationConfig = null;
function getRotationConfig() {
  if (!_rotationConfig) {
    try {
      const config = require('../config/env');
      _rotationConfig = {
        maxAgeDays: config.logging?.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS,
        maxSizeMB: config.logging?.maxSizeMB ?? DEFAULT_MAX_SIZE_MB,
      };
    } catch {
      _rotationConfig = {
        maxAgeDays: DEFAULT_MAX_AGE_DAYS,
        maxSizeMB: DEFAULT_MAX_SIZE_MB,
      };
    }
  }
  return _rotationConfig;
}

// ============================================
// Log-Rotation: Alte Dateien aufräumen
// ============================================

/**
 * Löscht Log-Dateien die älter als maxAgeDays sind
 * @returns {Promise<number>} Anzahl gelöschter Dateien
 */
async function cleanupOldLogs() {
  try {
    const { maxAgeDays } = getRotationConfig();
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const files = await readdir(logsDir);
    let deleted = 0;

    for (const file of files) {
      if (!file.endsWith('.log')) continue;

      const filePath = path.join(logsDir, file);
      try {
        const fileStat = await stat(filePath);
        if (fileStat.mtimeMs < cutoff) {
          await unlink(filePath);
          deleted++;
        }
      } catch {
        // Datei möglicherweise bereits gelöscht — ignorieren
      }
    }

    if (deleted > 0) {
      console.log(`[LOG-ROTATION] ${deleted} alte Log-Datei(en) gelöscht (älter als ${maxAgeDays} Tage)`);
    }

    return deleted;
  } catch (err) {
    console.error(`[LOG-ROTATION] Cleanup fehlgeschlagen: ${err.message}`);
    return 0;
  }
}

/**
 * Rotiert eine Log-Datei wenn sie maxSizeMB überschreitet
 * Benennt die aktuelle Datei um (z.B. info-2026-02-18.log → info-2026-02-18.1.log)
 * @param {string} logFile - Pfad zur Log-Datei
 */
async function rotateIfNeeded(logFile) {
  try {
    const { maxSizeMB } = getRotationConfig();
    const maxBytes = maxSizeMB * 1024 * 1024;

    const fileStat = await stat(logFile).catch(() => null);
    if (!fileStat || fileStat.size < maxBytes) return;

    // Nächste freie Rotationsnummer finden
    const dir = path.dirname(logFile);
    const baseName = path.basename(logFile, '.log');
    let rotationNum = 1;

    while (fs.existsSync(path.join(dir, `${baseName}.${rotationNum}.log`))) {
      rotationNum++;
    }

    const rotatedFile = path.join(dir, `${baseName}.${rotationNum}.log`);
    await rename(logFile, rotatedFile);

    console.log(`[LOG-ROTATION] ${path.basename(logFile)} → ${path.basename(rotatedFile)} (${(fileStat.size / 1024 / 1024).toFixed(1)} MB)`);
  } catch {
    // Rotation fehlgeschlagen — nicht kritisch, weiter loggen
  }
}

// ============================================
// Log-Datei & Formatierung
// ============================================

// Log-Datei Path
const getLogFile = (type) => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logsDir, `${type}-${date}.log`);
};

// Timestamp Format
const getTimestamp = () => new Date().toISOString();

// Log-Levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

// ============================================
// Logger Funktion
// ============================================

const log = (level, message, data = null, requestId = null) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level,
    requestId: requestId || 'N/A',
    message,
    data: data || {},
  };

  const logString = JSON.stringify(logEntry);

  // In Console
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m', // Yellow
    INFO: '\x1b[36m', // Cyan
    DEBUG: '\x1b[35m', // Magenta
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level] || ''}[${level}]${reset} ${message}`);

  // In Datei (async, non-blocking)
  const logFile = getLogFile(level.toLowerCase());

  // Vor dem Schreiben: Datei rotieren falls zu groß
  rotateIfNeeded(logFile).finally(() => {
    appendFile(logFile, logString + '\n', 'utf8').catch((err) => {
      console.error(`Failed to write to log file ${logFile}:`, err.message);
    });
  });
};

// ============================================
// Startup: Initiales Cleanup + Scheduler
// ============================================

// Cleanup beim Start (non-blocking)
cleanupOldLogs();

// Periodisches Cleanup (alle 24h)
const cleanupTimer = setInterval(cleanupOldLogs, CLEANUP_INTERVAL_MS);
// Timer soll Prozess-Beendigung nicht blockieren
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

module.exports = {
  LOG_LEVELS,
  error: (msg, data, requestId) => log(LOG_LEVELS.ERROR, msg, data, requestId),
  warn: (msg, data, requestId) => log(LOG_LEVELS.WARN, msg, data, requestId),
  info: (msg, data, requestId) => log(LOG_LEVELS.INFO, msg, data, requestId),
  debug: (msg, data, requestId) => log(LOG_LEVELS.DEBUG, msg, data, requestId),
  // Für Admin-Tasks oder Tests
  cleanupOldLogs,
  rotateIfNeeded,
};
