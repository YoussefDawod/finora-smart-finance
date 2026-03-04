/**
 * @fileoverview Admin Controller Tests – Transactions & Subscribers
 * @description Unit-Tests für neue Admin-Endpunkte (Transaktionen + Subscriber)
 */

const adminController = require('../../src/controllers/adminController');
const adminService = require('../../src/services/adminService');
const auditLog = require('../../src/services/auditLogService');

// Mock dependencies
jest.mock('../../src/services/adminService');
jest.mock('../../src/services/auditLogService', () => ({
  log: jest.fn(),
  getLogs: jest.fn(),
  getStats: jest.fn(),
}));
jest.mock('../../src/utils/responseHelper', () => ({
  sendError: jest.fn((res, req, opts) => {
    res.status(opts.status || 400).json({ success: false, error: opts.error, code: opts.code });
  }),
  handleServerError: jest.fn((res, req, context, error) => {
    res.status(500).json({ success: false, code: 'SERVER_ERROR' });
  }),
}));
jest.mock('../../src/validators/adminValidation', () => ({
  validateUserQuery: jest.fn(() => ({ errors: null, query: {}, pagination: { page: 1, limit: 50, skip: 0 }, sort: '-createdAt', showSensitive: false })),
  validateCreateUser: jest.fn(() => ({ errors: null })),
  validateUpdateUser: jest.fn(() => ({ errors: null })),
}));
jest.mock('../../src/validators/authValidation', () => ({
  validatePassword: jest.fn(),
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

describe('AdminController – Transactions & Subscribers', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: 'admin-123',
        name: 'Admin User',
        role: 'admin',
      },
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ============================================
  // TRANSACTION ENDPOINTS
  // ============================================

  describe('GET /api/admin/transactions', () => {
    it('should return paginated transactions', async () => {
      const mockData = {
        transactions: [{ _id: 'txn-1', amount: 100 }],
        pagination: { total: 1, page: 1, pages: 1, limit: 50 },
      };
      adminService.listTransactions.mockResolvedValue(mockData);

      await adminController.listTransactions(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('should pass all query params to service', async () => {
      req.query = {
        page: '2',
        limit: '20',
        userId: 'user-abc',
        type: 'expense',
        category: 'food',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        search: 'Rewe',
        sort: '-amount',
      };
      adminService.listTransactions.mockResolvedValue({ transactions: [], pagination: {} });

      await adminController.listTransactions(req, res);

      expect(adminService.listTransactions).toHaveBeenCalledWith({
        page: '2',
        limit: '20',
        userId: 'user-abc',
        type: 'expense',
        category: 'food',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        search: 'Rewe',
        sort: '-amount',
      });
    });

    it('should handle server error', async () => {
      adminService.listTransactions.mockRejectedValue(new Error('DB fail'));

      await adminController.listTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('GET /api/admin/transactions/stats', () => {
    it('should return transaction statistics', async () => {
      const mockStats = {
        totalCount: 1000,
        totalIncome: 50000,
        totalExpense: 30000,
        netBalance: 20000,
      };
      adminService.getTransactionStats.mockResolvedValue(mockStats);

      await adminController.getTransactionStats(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockStats });
    });

    it('should handle server error', async () => {
      adminService.getTransactionStats.mockRejectedValue(new Error('fail'));

      await adminController.getTransactionStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('GET /api/admin/transactions/:id', () => {
    it('should return transaction details', async () => {
      const mockTxn = { _id: 'txn-1', amount: 42.5, type: 'expense' };
      adminService.getTransactionById.mockResolvedValue(mockTxn);
      req.params.id = 'txn-1';

      await adminController.getTransaction(req, res);

      expect(adminService.getTransactionById).toHaveBeenCalledWith('txn-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTxn });
    });

    it('should return 404 when transaction not found', async () => {
      adminService.getTransactionById.mockResolvedValue(null);
      req.params.id = 'nonexistent';

      await adminController.getTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle server error', async () => {
      adminService.getTransactionById.mockRejectedValue(new Error('fail'));
      req.params.id = 'txn-1';

      await adminController.getTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('DELETE /api/admin/transactions/:id', () => {
    it('should delete transaction and return info', async () => {
      const mockDeleted = {
        deleted: {
          id: 'txn-1',
          userId: 'user-123',
          amount: 100,
          category: 'groceries',
          type: 'expense',
        },
      };
      adminService.deleteTransaction.mockResolvedValue(mockDeleted);
      req.params.id = 'txn-1';

      await adminController.deleteTransactionAdmin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaktion erfolgreich gelöscht',
        data: mockDeleted.deleted,
      });
    });

    it('should create audit log entry on delete', async () => {
      adminService.deleteTransaction.mockResolvedValue({
        deleted: { id: 'txn-1', userId: 'user-123', amount: 50, category: 'food', type: 'expense' },
      });
      req.params.id = 'txn-1';

      await adminController.deleteTransactionAdmin(req, res);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TRANSACTION_DELETED',
          adminId: 'admin-123',
          adminName: 'Admin User',
          targetUserId: 'user-123',
          details: expect.objectContaining({
            transactionId: 'txn-1',
          }),
        })
      );
    });

    it('should return 404 when transaction not found', async () => {
      adminService.deleteTransaction.mockResolvedValue({
        error: 'Transaktion nicht gefunden',
        code: 'TRANSACTION_NOT_FOUND',
      });
      req.params.id = 'nonexistent';

      await adminController.deleteTransactionAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle server error', async () => {
      adminService.deleteTransaction.mockRejectedValue(new Error('fail'));
      req.params.id = 'txn-1';

      await adminController.deleteTransactionAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should use API-Key fallback for admin info', async () => {
      req.user = null; // No JWT — API-Key auth
      adminService.deleteTransaction.mockResolvedValue({
        deleted: { id: 'txn-1', userId: 'user-123', amount: 50, category: 'food', type: 'expense' },
      });
      req.params.id = 'txn-1';

      await adminController.deleteTransactionAdmin(req, res);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: null,
          adminName: 'System/API-Key',
        })
      );
    });
  });

  // ============================================
  // SUBSCRIBER ENDPOINTS
  // ============================================

  describe('GET /api/admin/subscribers', () => {
    it('should return paginated subscribers', async () => {
      const mockData = {
        subscribers: [{ _id: 'sub-1', email: 'anna@test.com' }],
        pagination: { total: 1, page: 1, pages: 1, limit: 50 },
      };
      adminService.listSubscribers.mockResolvedValue(mockData);

      await adminController.listSubscribers(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('should pass all query params to service', async () => {
      req.query = {
        page: '1',
        limit: '25',
        isConfirmed: 'true',
        search: 'anna',
        language: 'de',
        sort: '-email',
      };
      adminService.listSubscribers.mockResolvedValue({ subscribers: [], pagination: {} });

      await adminController.listSubscribers(req, res);

      expect(adminService.listSubscribers).toHaveBeenCalledWith({
        page: '1',
        limit: '25',
        isConfirmed: 'true',
        search: 'anna',
        language: 'de',
        sort: '-email',
      });
    });

    it('should handle server error', async () => {
      adminService.listSubscribers.mockRejectedValue(new Error('fail'));

      await adminController.listSubscribers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('GET /api/admin/subscribers/stats', () => {
    it('should return subscriber statistics', async () => {
      const mockStats = { totalCount: 500, confirmedCount: 400, unconfirmedCount: 100 };
      adminService.getSubscriberStats.mockResolvedValue(mockStats);

      await adminController.getSubscriberStats(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockStats });
    });

    it('should handle server error', async () => {
      adminService.getSubscriberStats.mockRejectedValue(new Error('fail'));

      await adminController.getSubscriberStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('GET /api/admin/subscribers/:id', () => {
    it('should return subscriber details', async () => {
      const mockSub = { _id: 'sub-1', email: 'anna@test.com', isConfirmed: true };
      adminService.getSubscriberById.mockResolvedValue(mockSub);
      req.params.id = 'sub-1';

      await adminController.getSubscriber(req, res);

      expect(adminService.getSubscriberById).toHaveBeenCalledWith('sub-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockSub });
    });

    it('should return 404 when subscriber not found', async () => {
      adminService.getSubscriberById.mockResolvedValue(null);
      req.params.id = 'nonexistent';

      await adminController.getSubscriber(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle server error', async () => {
      adminService.getSubscriberById.mockRejectedValue(new Error('fail'));
      req.params.id = 'sub-1';

      await adminController.getSubscriber(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('DELETE /api/admin/subscribers/:id', () => {
    it('should delete subscriber and return info', async () => {
      adminService.deleteSubscriber.mockResolvedValue({
        deleted: { email: 'anna@test.com', isConfirmed: true },
      });
      req.params.id = 'sub-1';

      await adminController.deleteSubscriberAdmin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscriber erfolgreich gelöscht',
        data: { email: 'anna@test.com', isConfirmed: true },
      });
    });

    it('should create SUBSCRIBER_DELETED audit log entry on delete', async () => {
      adminService.deleteSubscriber.mockResolvedValue({
        deleted: { email: 'anna@test.com', isConfirmed: true },
      });
      req.params.id = 'sub-1';

      await adminController.deleteSubscriberAdmin(req, res);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUBSCRIBER_DELETED',
          adminId: 'admin-123',
          adminName: 'Admin User',
          details: expect.objectContaining({
            subscriberId: 'sub-1',
            email: 'anna@test.com',
            status: 'confirmed',
          }),
        })
      );
    });

    it('should return 404 when subscriber not found', async () => {
      adminService.deleteSubscriber.mockResolvedValue({
        error: 'Subscriber nicht gefunden',
        code: 'SUBSCRIBER_NOT_FOUND',
      });
      req.params.id = 'nonexistent';

      await adminController.deleteSubscriberAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle server error', async () => {
      adminService.deleteSubscriber.mockRejectedValue(new Error('fail'));
      req.params.id = 'sub-1';

      await adminController.deleteSubscriberAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
