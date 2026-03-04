/**
 * @fileoverview MongoDB Connection with Retry Logic
 * @description Connects to MongoDB with configurable retries.
 *              Registers event listeners for disconnect / reconnect / error.
 */

const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// Give the driver more time to reconnect after sleep/network changes (default: 10s)
mongoose.set('bufferTimeoutMS', 30000);

// MongoDB connection event monitoring
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected – driver will auto-reconnect');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

mongoose.connection.on('error', err => {
  logger.error('MongoDB connection error', { error: err.message });
});

/**
 * Connect to MongoDB with exponential backoff retry logic.
 * @param {number} retries - Maximum number of connection attempts (default: 7)
 */
async function connectDB(retries = 7) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(config.mongodb.uri, {
        dbName: config.mongodb.db,
        retryWrites: true,
        w: 'majority',
        serverSelectionTimeoutMS: 10000,
      });
      logger.info('MongoDB connected successfully', {
        environment: config.nodeEnv,
        db: config.mongodb.db,
      });
      return;
    } catch (err) {
      // Exponential backoff: 3s, 6s, 12s, 24s, 48s, 60s, 60s (capped)
      const delay = Math.min(3000 * Math.pow(2, i), 60000);
      const delaySec = (delay / 1000).toFixed(0);
      logger.warn(`MongoDB connection attempt ${i + 1}/${retries} failed`, {
        error: err.message,
        retryIn: `${delaySec} seconds`,
      });
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('MongoDB connection failed after retries', { attempts: retries });
  process.exit(1);
}

module.exports = connectDB;
