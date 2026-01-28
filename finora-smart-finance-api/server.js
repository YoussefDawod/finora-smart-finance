require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

// Config & Utils
const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const requestLoggerMiddleware = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');

// Routes
const transactionRoutes = require('./src/routes/transactions');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const adminRoutes = require('./src/routes/admin');
const User = require('./src/models/User');

// Services
const reportScheduler = require('./src/services/reportScheduler');

const app = express();

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
app.use(express.json());

// MongoDB Connection mit Retry-Logik
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(config.mongodb.uri, {
        dbName: config.mongodb.db,
        retryWrites: true,
        w: 'majority',
      });
      logger.info('✅ MongoDB connected successfully', {
        environment: config.nodeEnv,
        db: config.mongodb.db,
      });
      return;
    } catch (err) {
      logger.warn(`MongoDB connection attempt ${i + 1}/${retries} failed`, {
        error: err.message,
        retryIn: '5 seconds',
      });
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
  logger.error('❌ MongoDB connection failed after retries', {
    attempts: retries,
  });
  process.exit(1);
};

// Connect to DB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({
    app: 'Finora API',
    message: 'Willkommen bei Finora - Smart Finance API. Frontend läuft separat.',
    docs: '/api/health',
  });
});
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: config.nodeEnv,
    uptime: process.uptime(),
    version: require('./package.json').version,
  });
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes); // Admin routes (nur Development)

// Direct verification via backend link; redirects to frontend after success/failure
app.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const frontend = config.frontendUrl || 'http://localhost:3001';
  if (!token) return res.redirect(`${frontend}/verify-email?status=missing`);

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ verificationToken: tokenHash, verificationExpires: { $gt: new Date() } });
    if (!user) return res.redirect(`${frontend}/verify-email?status=invalid`);

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return res.redirect(`${frontend}/verify-email?status=done`);
  } catch {
    return res.redirect(`${frontend}/verify-email?status=error`);
  }
});

// 404 Handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    error: 'Route nicht gefunden',
    path: req.path,
    code: 'NOT_FOUND',
    requestId: req.requestId,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server - listen on all interfaces (0.0.0.0) for network access
const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🚀 Server started successfully`, {
    port: config.port,
    environment: config.nodeEnv,
    nodeVersion: process.version,
    mongoUrl: config.mongodb.uri.substring(0, 40) + '...',
  });

  // Starte Report Scheduler (nur in Produktion oder explizit aktiviert)
  if (config.nodeEnv === 'production' || process.env.ENABLE_REPORT_SCHEDULER === 'true') {
    initializeReportScheduler();
  }
});

/**
 * Initialisiert den Report Scheduler
 * - Wöchentliche Reports: Jeden Montag um 8:00 Uhr
 * - Monatliche Reports: Am 1. jedes Monats um 8:00 Uhr
 */
function initializeReportScheduler() {
  logger.info('📊 Initializing report scheduler...');

  const ONE_HOUR = 60 * 60 * 1000;
  let lastWeeklyCheck = null;
  let lastMonthlyCheck = null;

  // Prüfe stündlich ob Reports gesendet werden müssen
  setInterval(async () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag
    const dayOfMonth = now.getDate();
    const hour = now.getHours();
    const dateKey = now.toISOString().split('T')[0];

    // Wöchentlicher Report: Montag um 8:00 Uhr
    if (dayOfWeek === 1 && hour >= 8 && lastWeeklyCheck !== dateKey) {
      lastWeeklyCheck = dateKey;
      logger.info('📊 Triggering weekly reports...');
      try {
        await reportScheduler.sendWeeklyReports();
      } catch (error) {
        logger.error('Weekly report scheduler error:', error);
      }
    }

    // Monatlicher Report: 1. des Monats um 8:00 Uhr
    if (dayOfMonth === 1 && hour >= 8 && lastMonthlyCheck !== dateKey) {
      lastMonthlyCheck = dateKey;
      logger.info('📊 Triggering monthly reports...');
      try {
        await reportScheduler.sendMonthlyReports();
      } catch (error) {
        logger.error('Monthly report scheduler error:', error);
      }
    }
  }, ONE_HOUR);

  logger.info('📊 Report scheduler active - Weekly: Mondays 8:00, Monthly: 1st of month 8:00');
}

// Graceful Shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  logger.warn('Shutdown signal received, closing gracefully');
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