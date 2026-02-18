// config/env.js
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
  development: {
    nodeEnv: 'development',
    port: process.env.PORT || 5000,
    apiUrl: process.env.API_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    mongodb: {
      uri: process.env.MONGODB_URI,
      db: process.env.MONGODB_DB || 'finora',
    },
    cors: {
      origin: [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:5173', 
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:3001', 
        'http://127.0.0.1:5173',
        // Specific network IPs for testing (current network)
        'http://192.168.188.22:3000',
        'http://192.168.188.22:3001',
        'http://192.168.188.22:5173',
        // Network IPs for mobile testing (regex patterns for any IP in private ranges)
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:\d+$/,
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      expire: process.env.JWT_EXPIRE || '7d',
      accessExpire: parseInt(process.env.JWT_ACCESS_EXPIRE) || 3600,       // 1h in Sekunden
      refreshExpire: parseInt(process.env.JWT_REFRESH_EXPIRE) || 604800,   // 7d in Sekunden
    },
    logging: {
      level: process.env.LOG_LEVEL || 'debug',
      dir: process.env.LOG_DIR || './logs',
      maxAgeDays: parseInt(process.env.LOG_MAX_AGE_DAYS) || 14,   // Log-Dateien nach 14 Tagen löschen
      maxSizeMB: parseInt(process.env.LOG_MAX_SIZE_MB) || 10,     // Einzeldatei max 10 MB
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    features: {
      stats: process.env.FEATURE_STATS !== 'false',
      bulkDelete: process.env.FEATURE_BULK_DELETE !== 'false',
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || '"Finora" <noreply@finora.dawoddev.com>',
    },
    contactEmail: process.env.CONTACT_EMAIL || 'info@finora.dawoddev.com',
  },

  production: {
    nodeEnv: 'production',
    port: process.env.PORT || 5000,
    apiUrl: process.env.API_URL || 'https://api.youssefdawod.com',
    frontendUrl: process.env.FRONTEND_URL || 'https://finora.app',
    mongodb: {
      uri: process.env.MONGODB_URI,
      db: process.env.MONGODB_DB || 'finora',
    },
    cors: {
      origin: (process.env.CORS_ORIGIN || 'https://finora.app').split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expire: process.env.JWT_EXPIRE || '7d',
      accessExpire: parseInt(process.env.JWT_ACCESS_EXPIRE) || 3600,       // 1h in Sekunden
      refreshExpire: parseInt(process.env.JWT_REFRESH_EXPIRE) || 604800,   // 7d in Sekunden
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      dir: process.env.LOG_DIR || './logs',
      maxAgeDays: parseInt(process.env.LOG_MAX_AGE_DAYS) || 30,   // Produktion: 30 Tage aufbewahren
      maxSizeMB: parseInt(process.env.LOG_MAX_SIZE_MB) || 25,     // Produktion: max 25 MB pro Datei
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50,
    },
    features: {
      stats: process.env.FEATURE_STATS !== 'false',
      bulkDelete: process.env.FEATURE_BULK_DELETE === 'true', // Disabled by default
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || '"Finora" <noreply@finora.dawoddev.com>',
    },
    contactEmail: process.env.CONTACT_EMAIL || 'info@finora.dawoddev.com',
  },

  test: {
    nodeEnv: 'test',
    port: 5001,
    apiUrl: 'http://localhost:5001',
    frontendUrl: 'http://localhost:5173',
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finora-test',
      db: 'finora-test',
    },
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    },
    jwt: {
      secret: 'test-secret-key',
      expire: '1h',
      accessExpire: 3600,       // 1h in Sekunden
      refreshExpire: 604800,    // 7d in Sekunden
    },
    logging: {
      level: 'error',
      dir: './logs',
      maxAgeDays: 1,     // Tests: sofort aufräumen
      maxSizeMB: 5,
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 1000,
    },
    features: {
      stats: true,
      bulkDelete: true,
    },
    smtp: {
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from: '"Finora Test" <test@finora.dawoddev.com>',
    },
    contactEmail: 'info@finora.dawoddev.com',
  },
};

// Environment validieren
if (!config[NODE_ENV]) {
  throw new Error(`Invalid NODE_ENV: ${NODE_ENV}. Must be development, production, or test`);
}

// Produktions-Validierung
if (NODE_ENV === 'production') {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

module.exports = config[NODE_ENV];
