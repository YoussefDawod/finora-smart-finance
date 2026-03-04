/**
 * @fileoverview Transaction Controller Tests
 * @description Unit-Tests für alle Transaction-Endpoints (CRUD + Stats)
 */

const transactionController = require('../../src/controllers/transactionController');
const Transaction = require('../../src/models/Transaction');
const User = require('../../src/models/User');
const transactionService = require('../../src/services/transactionService');
const emailService = require('../../src/utils/emailService');
const budgetAlertService = require('../../src/services/budgetAlertService');

// Mock dependencies
jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/User');
jest.mock('../../src/services/transactionService');
jest.mock('../../src/utils/emailService');
jest.mock('../../src/services/budgetAlertService');
jest.mock('../../src/middleware/transactionQuota', () => ({
  rollbackQuotaReservation: jest.fn().mockResolvedValue(undefined),
  decrementTransactionCount: jest.fn().mockResolvedValue(0),
  getQuotaStatus: jest.fn().mockReturnValue({
    used: 1, limit: 150, remaining: 149, resetDate: '2026-04-01T00:00:00.000Z', isLimitReached: false,
  }),
  MONTHLY_TRANSACTION_LIMIT: 150,
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../src/config/env', () => ({
  nodeEnv: 'test',
}));

const { rollbackQuotaReservation, decrementTransactionCount, getQuotaStatus } = require('../../src/middleware/transactionQuota');

describe('TransactionController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      quotaReserved: true,
      quotaSnapshot: {
        used: 1, limit: 150, remaining: 149, resetDate: '2026-04-01T00:00:00.000Z', isLimitReached: false,
      },
      user: {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: true,
        preferences: {
          emailNotifications: true,
          notificationCategories: { alerts: true },
          budget: { monthlyLimit: 1000 },
        },
        save: jest.fn().mockResolvedValue(true),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Default mocks
    transactionService.formatTransaction = jest.fn((t) => t);
    transactionService.formatTransactions = jest.fn((t) => t);
    transactionService.isOwner = jest.fn().mockReturnValue(true);
    transactionService.buildTransactionFilter = jest.fn().mockReturnValue({ userId: 'user-123' });
    transactionService.buildSortObject = jest.fn().mockReturnValue({ date: -1 });
  });

  // ============================================
  // getSummary Tests
  // ============================================
  describe('GET /stats/summary', () => {
    it('should return summary stats', async () => {
      const mockStats = {
        totalIncome: 5000,
        totalExpense: 3200,
        balance: 1800,
        transactionCount: 42,
      };
      transactionService.getSummaryStats = jest.fn().mockResolvedValue(mockStats);

      await transactionController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should pass date filters to service', async () => {
      req.query = { startDate: '2026-01-01', endDate: '2026-01-31' };
      transactionService.getSummaryStats = jest.fn().mockResolvedValue({});

      await transactionController.getSummary(req, res);

      expect(transactionService.buildTransactionFilter).toHaveBeenCalledWith(
        'user-123',
        { startDate: '2026-01-01', endDate: '2026-01-31' }
      );
    });

    it('should handle server error', async () => {
      transactionService.getSummaryStats = jest.fn().mockRejectedValue(new Error('DB error'));

      await transactionController.getSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SERVER_ERROR' })
      );
    });
  });

  // ============================================
  // getQuota Tests
  // ============================================
  describe('GET /quota', () => {
    it('should return quota status based on actual DB count', async () => {
      Transaction.countDocuments.mockResolvedValue(5);

      await transactionController.getQuota(req, res);

      expect(Transaction.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          createdAt: expect.objectContaining({ $gte: expect.any(Date) }),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          used: 5,
          limit: 150,
          remaining: 145,
          isLimitReached: false,
        }),
      });
    });

    it('should sync stored counter when it differs from DB count', async () => {
      Transaction.countDocuments.mockResolvedValue(10);
      req.user.transactionLifecycle = { monthlyTransactionCount: 3 };

      await transactionController.getQuota(req, res);

      expect(req.user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ used: 10 }),
      });
    });

    it('should handle server error', async () => {
      Transaction.countDocuments.mockRejectedValue(new Error('DB error'));

      await transactionController.getQuota(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SERVER_ERROR' })
      );
    });
  });

  // ============================================
  // getDashboard Tests
  // ============================================
  describe('GET /stats/dashboard', () => {
    it('should return dashboard data', async () => {
      const mockData = { summary: {}, chart: [], recentTransactions: [] };
      transactionService.getDashboardData = jest.fn().mockResolvedValue(mockData);

      await transactionController.getDashboard(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    it('should parse month/year query params', async () => {
      req.query = { month: '6', year: '2026' };
      transactionService.getDashboardData = jest.fn().mockResolvedValue({});

      await transactionController.getDashboard(req, res);

      expect(transactionService.getDashboardData).toHaveBeenCalledWith(
        'user-123',
        { month: 6, year: 2026 }
      );
    });

    it('should ignore invalid month values', async () => {
      req.query = { month: '13', year: '2026' };
      transactionService.getDashboardData = jest.fn().mockResolvedValue({});

      await transactionController.getDashboard(req, res);

      expect(transactionService.getDashboardData).toHaveBeenCalledWith(
        'user-123',
        { year: 2026 }
      );
    });

    it('should handle server error', async () => {
      transactionService.getDashboardData = jest.fn().mockRejectedValue(new Error('fail'));

      await transactionController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================
  // createTransaction Tests
  // ============================================
  describe('POST /transactions', () => {
    const validTransaction = {
      amount: 42.50,
      category: 'Lebensmittel',
      description: 'Einkauf Rewe',
      type: 'expense',
      date: '2026-02-18',
    };

    it('should create a new transaction and include quota', async () => {
      req.body = validTransaction;

      const mockCreated = {
        _id: 'txn-1',
        userId: 'user-123',
        ...validTransaction,
      };
      Transaction.create = jest.fn().mockResolvedValue(mockCreated);
      emailService.sendTransactionNotification = jest.fn().mockResolvedValue({});
      budgetAlertService.checkBudgetAfterTransaction = jest.fn().mockResolvedValue({});
      budgetAlertService.checkNegativeBalanceAlert = jest.fn().mockResolvedValue({});

      await transactionController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Transaktion erstellt',
          quota: expect.objectContaining({
            used: expect.any(Number),
            limit: 150,
            remaining: expect.any(Number),
          }),
        })
      );
      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          amount: 42.50,
          category: 'Lebensmittel',
        })
      );
    });

    it('should return 400 on validation error', async () => {
      req.body = { amount: -10 }; // Invalid

      await transactionController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'VALIDATION_ERROR' })
      );
    });

    it('should trigger budget alert for expense', async () => {
      req.body = validTransaction;
      const mockCreated = {
        _id: 'txn-1',
        userId: 'user-123',
        ...validTransaction,
      };
      Transaction.create = jest.fn().mockResolvedValue(mockCreated);
      emailService.sendTransactionNotification = jest.fn().mockResolvedValue({});
      budgetAlertService.checkBudgetAfterTransaction = jest.fn().mockResolvedValue({});
      budgetAlertService.checkNegativeBalanceAlert = jest.fn().mockResolvedValue({});

      await transactionController.createTransaction(req, res);

      expect(budgetAlertService.checkBudgetAfterTransaction).toHaveBeenCalledWith(
        req.user,
        mockCreated
      );
      expect(budgetAlertService.checkNegativeBalanceAlert).toHaveBeenCalledWith(
        req.user,
        mockCreated
      );
    });

    it('should not send notifications for unverified users', async () => {
      req.user.isVerified = false;
      req.body = validTransaction;
      Transaction.create = jest.fn().mockResolvedValue({ _id: 'txn-1', ...validTransaction });

      await transactionController.createTransaction(req, res);

      expect(emailService.sendTransactionNotification).not.toHaveBeenCalled();
      expect(budgetAlertService.checkBudgetAfterTransaction).not.toHaveBeenCalled();
    });

    it('should still create transaction if notification fails', async () => {
      req.body = validTransaction;
      Transaction.create = jest.fn().mockResolvedValue({ _id: 'txn-1', ...validTransaction });
      emailService.sendTransactionNotification = jest.fn().mockRejectedValue(new Error('SMTP fail'));
      budgetAlertService.checkBudgetAfterTransaction = jest.fn().mockResolvedValue({});
      budgetAlertService.checkNegativeBalanceAlert = jest.fn().mockResolvedValue({});

      await transactionController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle mongoose ValidationError', async () => {
      req.body = validTransaction;
      const mongooseError = new Error('Validation failed');
      mongooseError.name = 'ValidationError';
      mongooseError.errors = {
        amount: { message: 'Amount muss > 0 sein' },
      };
      Transaction.create = jest.fn().mockRejectedValue(mongooseError);

      await transactionController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: ['Amount muss > 0 sein'],
        })
      );
    });
  });

  // ============================================
  // getTransactions Tests
  // ============================================
  describe('GET /transactions', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [
        { _id: 'txn-1', amount: 100, category: 'Gehalt', type: 'income' },
        { _id: 'txn-2', amount: 42, category: 'Lebensmittel', type: 'expense' },
      ];

      Transaction.countDocuments = jest.fn().mockResolvedValue(2);
      Transaction.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTransactions),
      });

      await transactionController.getTransactions(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: expect.objectContaining({
            page: expect.any(Number),
            total: 2,
          }),
        })
      );
    });

    it('should handle search queries with text score', async () => {
      req.query = { search: 'Rewe' };
      Transaction.countDocuments = jest.fn().mockResolvedValue(1);
      Transaction.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await transactionController.getTransactions(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ searchQuery: 'Rewe' })
      );
    });

    it('should handle server error', async () => {
      Transaction.countDocuments = jest.fn().mockRejectedValue(new Error('DB error'));

      await transactionController.getTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================
  // getTransactionById Tests
  // ============================================
  describe('GET /transactions/:id', () => {
    it('should return a single transaction', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const mockTxn = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user-123',
        amount: 42,
        category: 'Lebensmittel',
      };
      Transaction.findById = jest.fn().mockResolvedValue(mockTxn);

      await transactionController.getTransactionById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 400 for invalid ID format', async () => {
      req.params.id = 'not-a-valid-id';

      await transactionController.getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'INVALID_ID' })
      );
    });

    it('should return 404 when transaction not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      Transaction.findById = jest.fn().mockResolvedValue(null);

      await transactionController.getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NOT_FOUND' })
      );
    });

    it('should return 403 for unauthorized access', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      Transaction.findById = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', userId: 'other-user' });
      transactionService.isOwner = jest.fn().mockReturnValue(false);

      await transactionController.getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'FORBIDDEN' })
      );
    });
  });

  // ============================================
  // updateTransaction Tests
  // ============================================
  describe('PUT /transactions/:id', () => {
    it('should update a transaction', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { amount: 99.99, description: 'Aktualisiert' };

      const mockTxn = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user-123',
        amount: 42,
        save: jest.fn().mockResolvedValue(true),
      };
      Transaction.findById = jest.fn().mockResolvedValue(mockTxn);

      await transactionController.updateTransaction(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Transaktion aktualisiert',
        })
      );
      expect(mockTxn.save).toHaveBeenCalled();
    });

    it('should return 400 for invalid update data', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { amount: -50 }; // Invalid

      const mockTxn = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user-123',
        save: jest.fn(),
      };
      Transaction.findById = jest.fn().mockResolvedValue(mockTxn);

      await transactionController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if transaction not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { amount: 100 };
      Transaction.findById = jest.fn().mockResolvedValue(null);

      await transactionController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle mongoose ValidationError on save', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { description: 'Valid update' };

      const mockTxn = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user-123',
        save: jest.fn().mockImplementation(() => {
          const err = new Error('Validation failed');
          err.name = 'ValidationError';
          err.errors = { description: { message: 'Too short' } };
          throw err;
        }),
      };
      Transaction.findById = jest.fn().mockResolvedValue(mockTxn);

      await transactionController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: ['Too short'],
        })
      );
    });
  });

  // ============================================
  // deleteTransaction Tests
  // ============================================
  describe('DELETE /transactions/:id', () => {
    it('should delete a transaction and decrement quota', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const mockTxn = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user-123',
        createdAt: new Date(),
      };
      Transaction.findById = jest.fn().mockResolvedValue(mockTxn);
      Transaction.findByIdAndDelete = jest.fn().mockResolvedValue(true);

      await transactionController.deleteTransaction(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Transaktion gelöscht',
          data: expect.objectContaining({ id: '507f1f77bcf86cd799439011' }),
        })
      );
      expect(Transaction.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(decrementTransactionCount).toHaveBeenCalledWith(req.user, mockTxn.createdAt);
    });

    it('should return 404 if transaction not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      Transaction.findById = jest.fn().mockResolvedValue(null);

      await transactionController.deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for unauthorized delete', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      Transaction.findById = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
      transactionService.isOwner = jest.fn().mockReturnValue(false);

      await transactionController.deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ============================================
  // deleteAllTransactions Tests
  // ============================================
  describe('DELETE /transactions (Bulk)', () => {
    it('should delete all user transactions and reset quota', async () => {
      req.query = { confirm: 'true' };
      req.body = { password: 'Password123!' };
      req.user.transactionLifecycle = { monthlyTransactionCount: 42 };

      const mockDbUser = {
        _id: 'user-123',
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockDbUser),
      });
      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 15 });

      await transactionController.deleteAllTransactions(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ deletedCount: 15 }),
        })
      );
      expect(Transaction.deleteMany).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(req.user.transactionLifecycle.monthlyTransactionCount).toBe(0);
      expect(req.user.save).toHaveBeenCalled();
    });

    it('should return 400 without confirmation flag', async () => {
      req.query = {};

      await transactionController.deleteAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'MISSING_CONFIRMATION' })
      );
    });

    it('should return 400 without password (L-8)', async () => {
      req.query = { confirm: 'true' };
      req.body = {};

      await transactionController.deleteAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CONFIRMATION_REQUIRED' })
      );
    });

    it('should return 400 for wrong password (L-8)', async () => {
      req.query = { confirm: 'true' };
      req.body = { password: 'WrongPassword!' };

      const mockDbUser = {
        _id: 'user-123',
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockDbUser),
      });

      await transactionController.deleteAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'INVALID_PASSWORD' })
      );
    });

    it('should reject confirm=false', async () => {
      req.query = { confirm: 'false' };

      await transactionController.deleteAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle server error', async () => {
      req.query = { confirm: 'true' };
      req.body = { password: 'Password123!' };

      const mockDbUser = {
        _id: 'user-123',
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockDbUser),
      });
      Transaction.deleteMany = jest.fn().mockRejectedValue(new Error('DB error'));

      await transactionController.deleteAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
