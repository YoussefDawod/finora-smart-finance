// config/env.js
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
  development: {
    nodeEnv: 'development',
    port: process.env.PORT || 5000,
    apiUrl: process.env.API_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    mongodb: {
      uri: process.env.MONGODB_URI,
      db: process.env.MONGODB_DB || 'expense-tracker',
    },
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      expire: process.env.JWT_EXPIRE || '7d',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'debug',
      dir: process.env.LOG_DIR || './logs',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    features: {
      stats: process.env.FEATURE_STATS !== 'false',
      bulkDelete: process.env.FEATURE_BULK_DELETE !== 'false',
    },
  },

  production: {
    nodeEnv: 'production',
    port: process.env.PORT || 5000,
    apiUrl: process.env.API_URL || 'https://api.youssefdawod.com',
    frontendUrl: process.env.FRONTEND_URL || 'https://expense-tracker.youssefdawod.com',
    mongodb: {
      uri: process.env.MONGODB_URI,
      db: process.env.MONGODB_DB || 'expense-tracker',
    },
    cors: {
      origin: (process.env.CORS_ORIGIN || 'https://expense-tracker.youssefdawod.com').split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expire: process.env.JWT_EXPIRE || '7d',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      dir: process.env.LOG_DIR || './logs',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50,
    },
    features: {
      stats: process.env.FEATURE_STATS !== 'false',
      bulkDelete: process.env.FEATURE_BULK_DELETE === 'true', // Disabled by default
    },
  },

  test: {
    nodeEnv: 'test',
    port: 5001,
    apiUrl: 'http://localhost:5001',
    frontendUrl: 'http://localhost:5173',
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker-test',
      db: 'expense-tracker-test',
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
    },
    logging: {
      level: 'error',
      dir: './logs',
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 1000,
    },
    features: {
      stats: true,
      bulkDelete: true,
    },
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
