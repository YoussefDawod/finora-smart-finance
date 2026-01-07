// utils/logger.js
const fs = require('fs');
const path = require('path');

// Logs-Verzeichnis erstellen (im Root, nicht in src/)
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

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

// Logger Funktion
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

  // In Datei
  const logFile = getLogFile(level.toLowerCase());
  fs.appendFileSync(logFile, logString + '\n', 'utf8');
};

module.exports = {
  LOG_LEVELS,
  error: (msg, data, requestId) => log(LOG_LEVELS.ERROR, msg, data, requestId),
  warn: (msg, data, requestId) => log(LOG_LEVELS.WARN, msg, data, requestId),
  info: (msg, data, requestId) => log(LOG_LEVELS.INFO, msg, data, requestId),
  debug: (msg, data, requestId) => log(LOG_LEVELS.DEBUG, msg, data, requestId),
};
