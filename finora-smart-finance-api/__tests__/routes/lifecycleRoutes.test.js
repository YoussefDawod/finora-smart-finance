/**
 * @fileoverview Lifecycle Routes Tests
 * @description Unit-Tests für Lifecycle-Status, Quota und Export-Bestätigung
 */

const express = require('express');
const http = require('http');
const request = require('supertest');

// Mock dependencies BEFORE requiring any routes
jest.mock('../../src/models/User');
jest.mock('../../src/models/Transaction');
jest.mock('../../src/services/transactionLifecycleService');
jest.mock('../../src/services/auditLogService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../src/config/env', () => ({
  nodeEnv: 'test',
  port: 3000,
  jwt: { secret: 'test-secret', expiresIn: '7d', accessExpire: 3600, refreshExpire: 604800 },
  frontendUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3000',
}));

// Mock authMiddleware
jest.mock('../../src/middleware/authMiddleware', () => {
  return (req, _res, next) => {
    req.user = req._mockUser || { _id: 'user-123', email: 'test@example.com' };
    next();
  };
});

// Mock transactionQuota
jest.mock('../../src/middleware/transactionQuota', () => ({
  transactionQuota: (_req, _res, next) => next(),
  rollbackQuotaReservation: jest.fn().mockResolvedValue(undefined),
  incrementTransactionCount: jest.fn().mockResolvedValue(1),
  decrementTransactionCount: jest.fn().mockResolvedValue(0),
  getQuotaStatus: jest.fn().mockReturnValue({
    used: 42,
    limit: 150,
    remaining: 108,
    resetDate: '2026-04-01T00:00:00.000Z',
    isLimitReached: false,
  }),
  MONTHLY_TRANSACTION_LIMIT: 150,
}));
// Rate-Limiter deaktivieren damit Tests nicht blockiert werden
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());

const User = require('../../src/models/User');
const lifecycleService = require('../../src/services/transactionLifecycleService');
const lifecycleRoutes = require('../../src/routes/users/lifecycleRoutes');

let server;

beforeAll(done => {
  const app = express();
  app.use(express.json());

  // Inject mock user for auth tests
  app.use((req, _res, next) => {
    req._mockUser = { _id: 'user-123', email: 'test@example.com' };
    next();
  });

  app.use('/users', lifecycleRoutes);
  server = http.createServer(app);
  server.listen(0, done);
});

afterAll(done => {
  server.closeAllConnections();
  server.close(done);
});

describe('Lifecycle Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET /users/lifecycle-status
  // ============================================
  describe('GET /users/lifecycle-status', () => {
    const mockUserDoc = {
      _id: 'user-123',
      name: 'Max Mustermann',
      email: 'test@example.com',
      isVerified: true,
      transactionLifecycle: {
        monthlyTransactionCount: 42,
        retentionNotifications: {},
      },
    };

    it('should return lifecycle status and quota', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUserDoc);
      lifecycleService.getLifecycleStatus = jest.fn().mockResolvedValue({
        retention: {
          phase: 'active',
          hasOldTransactions: false,
          oldTransactionCount: 0,
          daysUntilDeletion: null,
        },
      });

      const res = await request(server).get('/users/lifecycle-status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.retention.phase).toBe('active');
      expect(res.body.data.quota).toBeDefined();
      expect(res.body.data.quota.used).toBe(42);
      expect(res.body.data.quota.limit).toBe(150);
    });

    it('should return reminding phase with days', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUserDoc);
      lifecycleService.getLifecycleStatus = jest.fn().mockResolvedValue({
        retention: {
          phase: 'reminding',
          hasOldTransactions: true,
          oldTransactionCount: 25,
          daysUntilDeletion: 60,
          daysUntilFinalWarning: 53,
          reminderCount: 3,
        },
      });

      const res = await request(server).get('/users/lifecycle-status');

      expect(res.status).toBe(200);
      expect(res.body.data.retention.phase).toBe('reminding');
      expect(res.body.data.retention.daysUntilDeletion).toBe(60);
      expect(res.body.data.retention.oldTransactionCount).toBe(25);
    });

    it('should return finalWarning phase', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUserDoc);
      lifecycleService.getLifecycleStatus = jest.fn().mockResolvedValue({
        retention: {
          phase: 'finalWarning',
          hasOldTransactions: true,
          oldTransactionCount: 10,
          daysUntilDeletion: 3,
        },
      });

      const res = await request(server).get('/users/lifecycle-status');

      expect(res.status).toBe(200);
      expect(res.body.data.retention.phase).toBe('finalWarning');
      expect(res.body.data.retention.daysUntilDeletion).toBe(3);
    });

    it('should return 404 when user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const res = await request(server).get('/users/lifecycle-status');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });

    it('should handle server error', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(server).get('/users/lifecycle-status');

      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // POST /users/export-confirm
  // ============================================
  describe('POST /users/export-confirm', () => {
    const mockUserDoc = {
      _id: 'user-123',
      name: 'Max Mustermann',
      email: 'test@example.com',
      isVerified: true,
      transactionLifecycle: {
        retentionNotifications: {},
      },
    };

    it('should confirm export successfully', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUserDoc);
      lifecycleService.markExportConfirmed = jest.fn().mockResolvedValue({
        success: true,
        message: 'Export-Bestätigung gespeichert',
      });

      const res = await request(server).post('/users/export-confirm');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Export-Bestätigung gespeichert');
      expect(lifecycleService.markExportConfirmed).toHaveBeenCalledWith(mockUserDoc);
    });

    it('should return 404 when user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const res = await request(server).post('/users/export-confirm');

      expect(res.status).toBe(404);
    });

    it('should handle server error', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUserDoc);
      lifecycleService.markExportConfirmed = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(server).post('/users/export-confirm');

      expect(res.status).toBe(500);
    });
  });
});
