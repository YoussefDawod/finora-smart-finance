/**
 * @fileoverview API Logger
 * @description Structured logging with support for development and production modes.
 * 
 * Features:
 * - Development mode: colorful output, timestamps, bodies, stack traces
 * - Production mode: minimal logging only
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * 
 * @module api/logger
 */

/* eslint-disable no-undef */

// ============================================
// 🎨 COLOR PALETTE
// ============================================

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m',
};

// ============================================
// 📊 LOG LEVELS
// ============================================

const LOG_LEVELS = {
  DEBUG: { level: 0, icon: '🐛', color: COLORS.CYAN },
  INFO: { level: 1, icon: 'ℹ️', color: COLORS.BLUE },
  WARN: { level: 2, icon: '⚠️', color: COLORS.YELLOW },
  ERROR: { level: 3, icon: '❌', color: COLORS.RED },
};

// ============================================
// ⚙️ CONFIGURATION
// ============================================

const isDevelopment = import.meta.env.DEV;
const currentLogLevel = isDevelopment ? LOG_LEVELS.DEBUG.level : LOG_LEVELS.INFO.level;

/**
 * Get formatted timestamp
 * @returns {string}
 */
function getTimestamp() {
  return new Date().toISOString().split('T')[1].slice(0, -1);
}

/**
 * Format log message with styling
 * @param {string} level
 * @param {string} message
 * @returns {string}
 */
function formatMessage(level, message) {
  const { icon, color } = LOG_LEVELS[level];
  const timestamp = isDevelopment ? `${COLORS.DIM}${getTimestamp()}${COLORS.RESET}` : '';
  return `${color}${icon}${COLORS.RESET} ${message} ${timestamp}`;
}

/**
 * Log debug message (development only)
 * @param {string} message
 * @param {*} data - Optional data to log
 */
function debug(message, data) {
  if (LOG_LEVELS.DEBUG.level < currentLogLevel || !isDevelopment) return;
  
  globalThis.console?.log(formatMessage('DEBUG', message));
  if (data && isDevelopment) {
    globalThis.console?.log('  ', data);
  }
}

/**
 * Log info message
 * @param {string} message
 * @param {*} data - Optional data to log
 */
function info(message, data) {
  if (LOG_LEVELS.INFO.level < currentLogLevel) return;
  
  globalThis.console?.log(formatMessage('INFO', message));
  if (data && isDevelopment) {
    globalThis.console?.log('  ', data);
  }
}

/**
 * Log warning message
 * @param {string} message
 * @param {*} data - Optional data to log
 */
function warn(message, data) {
  if (LOG_LEVELS.WARN.level < currentLogLevel) return;
  
  globalThis.console?.warn(formatMessage('WARN', message));
  if (data && isDevelopment) {
    globalThis.console?.warn('  ', data);
  }
}

/**
 * Log error message
 * @param {string} message
 * @param {*} error - Error object or data
 */
function error(message, error) {
  if (LOG_LEVELS.ERROR.level < currentLogLevel) return;
  
  globalThis.console?.error(formatMessage('ERROR', message));
  
  if (error) {
    if (isDevelopment) {
      globalThis.console?.error('  ', error);
      if (error.stack) {
        globalThis.console?.error(`  ${COLORS.GRAY}Stack:${COLORS.RESET}`, error.stack);
      }
    } else if (error.message) {
      globalThis.console?.error('  ', error.message);
    }
  }
}

/**
 * Log API request
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {*} data - Request body
 */
function logRequest(method, url, data) {
  if (!isDevelopment) return;
  
  const msg = `📤 ${method.toUpperCase()} ${url}`;
  debug(msg, data);
}

/**
 * Log API response
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} status - Response status code
 * @param {*} data - Response body
 */
function logResponse(method, url, status, data) {
  if (!isDevelopment) return;
  
  const statusEmoji = status >= 200 && status < 300 ? '✅' : '⚠️';
  const msg = `📥 ${statusEmoji} ${status} ${method.toUpperCase()} ${url}`;
  debug(msg, data);
}

/**
 * Log API error
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Error} err - Error object
 */
function logError(method, url, err) {
  const msg = `API ERROR: ${method?.toUpperCase?.()} ${url} - ${err?.message || 'Unknown error'}`;
  
  if (isDevelopment) {
    error(msg, {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
  } else {
    error(msg);
  }
}

// ============================================
// 📤 EXPORTS
// ============================================

export const logger = {
  debug,
  info,
  warn,
  error,
};

export { logRequest, logResponse, logError };

export default logger;
