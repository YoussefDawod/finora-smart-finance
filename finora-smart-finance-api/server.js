require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// Config & Utils
const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const requestLoggerMiddleware = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const { mongoSanitizeMiddleware } = require('./src/middleware/mongoSanitizer');
const { setupSwagger } = require('./src/config/swagger');

// Routes
const v1Routes = require('./src/routes/v1');

// Services & Database
const reportScheduler = require('./src/services/reportScheduler');
const lifecycleScheduler = require('./src/services/lifecycleScheduler');
const connectDB = require('./src/config/database');
const cluster = require('cluster');

const app = express();

// Scheduler-Referenz für Cleanup bei Shutdown
let schedulerInterval = null;

// CORS muss ZUERST kommen - vor allen anderen Middlewares
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  credentials: config.cors.credentials,
  allowedHeaders: config.cors.allowedHeaders,
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Weitere Middleware
app.use(requestLoggerMiddleware);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Security Middleware
// In Development: upgrade-insecure-requests und HSTS deaktivieren,
// da Vite/Express ohne SSL laufen und der Browser sonst http→https erzwingt.
const helmetConfig = config.nodeEnv === 'production'
  ? {
      // Production: Strikte Sicherheitsheader
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:'],
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }
  : {
      hsts: false,
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'upgrade-insecure-requests': null,
        },
      },
    };

// Trust Proxy in Production (Reverse Proxy / Load Balancer)
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet(helmetConfig));

// Permissions-Policy Header (nicht in Helmet v8 enthalten)
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  next();
});
app.use(mongoSanitizeMiddleware);
app.use(hpp());

// Connect to DB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({
    app: 'Finora API',
    message: 'Willkommen bei Finora - Smart Finance API. Frontend läuft separat.',
    docs: '/api/docs',
  });
});
app.get('/api/health', (req, res) => {
  // Production: Nur minimalen Status — kein System-Fingerprinting
  if (config.nodeEnv === 'production') {
    return res.json({
      status: mongoose.connection.readyState === 1 ? 'OK' : 'DEGRADED',
    });
  }

  // Development/Test: Debug-Infos
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: config.nodeEnv,
    uptime: process.uptime(),
    version: require('./package.json').version,
  });
});

// robots.txt — API soll nicht indexiert werden
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

// favicon.ico — leere Antwort statt 404 (Browser fragt automatisch)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// API Documentation (Swagger UI) — nur in Development (L-5)
if (process.env.NODE_ENV === 'development') {
  setupSwagger(app);
}

app.use('/api/v1', v1Routes);

// Abwärtskompatibilität: /api/* → /api/v1/* (301 Redirect)
app.use('/api', (req, res, next) => {
  // health-Endpoint bleibt auf /api/health
  if (req.path === '/health') return next();
  // Bereits versionierte Pfade nicht erneut umleiten (verhindert Redirect-Loop)
  if (req.path.startsWith('/v1')) return next();
  res.redirect(301, `/api/v1${req.path}`);
});

// 404 Handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: 'Route nicht gefunden',
    code: 'NOT_FOUND',
    requestId: req.requestId || 'N/A',
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server - listen on all interfaces (0.0.0.0) for network access
const server = app.listen(config.port, '0.0.0.0', () => {
  // MongoDB-URI sicher loggen — Credentials maskieren
  const safeMongoUrl = (config.mongodb.uri || '')
    .replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  logger.info(`Server started successfully`, {
    port: config.port,
    environment: config.nodeEnv,
    nodeVersion: process.version,
    mongoUrl: safeMongoUrl,
  });

  // Starte Report Scheduler (nur in Produktion oder explizit aktiviert)
  // Im Cluster-Modus nur auf Worker 1 ausführen, um doppelte Reports zu vermeiden
  if (config.nodeEnv === 'production' || process.env.ENABLE_REPORT_SCHEDULER === 'true') {
    if (!cluster.isWorker || cluster.worker.id === 1) {
      initializeReportScheduler();
    }
  }

  // Starte Lifecycle Scheduler (nur in Produktion oder explizit aktiviert)
  // Verarbeitet tägliche Retention-Prüfung (Erinnerungen, Warnungen, Löschungen)
  if (config.nodeEnv === 'production' || process.env.ENABLE_LIFECYCLE_SCHEDULER === 'true') {
    if (!cluster.isWorker || cluster.worker.id === 1) {
      initializeLifecycleScheduler();
    }
  }
});

/**
 * Initialisiert den Report Scheduler
 * - Wöchentliche Reports: Jeden Montag um 8:00 Uhr
 * - Monatliche Reports: Am 1. jedes Monats um 8:00 Uhr
 */
function initializeReportScheduler() {
  logger.info('Initializing report scheduler...');

  const ONE_HOUR = 60 * 60 * 1000;
  let lastWeeklyCheck = null;
  let lastMonthlyCheck = null;

  // Prüfe stündlich ob Reports gesendet werden müssen
  schedulerInterval = setInterval(async () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag
    const dayOfMonth = now.getDate();
    const hour = now.getHours();
    const dateKey = now.toISOString().split('T')[0];

    // Wöchentlicher Report: Montag um 8:00 Uhr
    if (dayOfWeek === 1 && hour >= 8 && lastWeeklyCheck !== dateKey) {
      lastWeeklyCheck = dateKey;
      logger.info('Triggering weekly reports...');
      try {
        await reportScheduler.sendWeeklyReports();
      } catch (error) {
        logger.error('Weekly report scheduler error:', error);
      }
    }

    // Monatlicher Report: 1. des Monats um 8:00 Uhr
    if (dayOfMonth === 1 && hour >= 8 && lastMonthlyCheck !== dateKey) {
      lastMonthlyCheck = dateKey;
      logger.info('Triggering monthly reports...');
      try {
        await reportScheduler.sendMonthlyReports();
      } catch (error) {
        logger.error('Monthly report scheduler error:', error);
      }
    }
  }, ONE_HOUR);

  logger.info('Report scheduler active - Weekly: Mondays 8:00, Monthly: 1st of month 8:00');
}

/**
 * Initialisiert den Lifecycle Scheduler
 * - Tägliche Retention-Verarbeitung um 3:00 Uhr nachts
 * - Sendet Erinnerungen, finale Warnungen, löscht abgelaufene Transaktionen
 */
let lifecycleSchedulerInterval = null;

function initializeLifecycleScheduler() {
  logger.info('Initializing lifecycle scheduler...');

  const ONE_HOUR = 60 * 60 * 1000;

  // Prüfe stündlich ob Retention-Verarbeitung fällig ist
  lifecycleSchedulerInterval = setInterval(async () => {
    try {
      await lifecycleScheduler.checkAndProcessRetention();
    } catch (error) {
      logger.error('Lifecycle scheduler error:', error);
    }
  }, ONE_HOUR);

  logger.info(`Lifecycle scheduler active - Daily at ${lifecycleScheduler.PROCESSING_HOUR}:00`);
}

// Graceful Shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  logger.warn('Shutdown signal received, closing gracefully');

  // Scheduler stoppen
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Report scheduler stopped');
  }
  if (lifecycleSchedulerInterval) {
    clearInterval(lifecycleSchedulerInterval);
    lifecycleSchedulerInterval = null;
    logger.info('Lifecycle scheduler stopped');
  }

  server.close(async () => {
    logger.info('HTTP server closed');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });

  // Force shutdown nach 30 Sekunden
  setTimeout(() => {
    logger.error('Force shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
}

module.exports = app;