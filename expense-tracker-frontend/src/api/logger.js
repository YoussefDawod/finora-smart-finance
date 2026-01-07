// src/api/logger.js
import { apiClient } from './client';

const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
  }

  log(level, message, details = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Store locally for debug dashboard
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output
    if (import.meta.env.DEV) {
      const style = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : 'color: blue';
      console.log(`%c[${level.toUpperCase()}] ${message}`, style, details || '');
    }

    // Send critical errors to backend (optional/debounced)
    if (level === 'error' && import.meta.env.PROD) {
      this.sendToBackend(logEntry);
    }
  }

  info(message, details) {
    this.log(LOG_LEVELS.INFO, message, details);
  }

  warn(message, details) {
    this.log(LOG_LEVELS.WARN, message, details);
  }

  error(message, details) {
    this.log(LOG_LEVELS.ERROR, message, details);
  }

  async sendToBackend(logEntry) {
    try {
      // Fire and forget - don't await blocking
      apiClient.post('/logs', logEntry, { retry: false }).catch(() => {});
    } catch (_e) {
      // Ignore logging errors to prevent loops
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
