/**
 * @fileoverview Admin Transaction Service Tests
 * @description Unit-Tests für Admin Transaktions-Verwaltung (list, get, delete, stats)
 */

const adminService = require('../../src/services/adminService');
const Transaction = require('../../src/models/Transaction');

// Mock dependencies
jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Subscriber');
jest.mock('../../src/utils/userSanitizer', () => ({
  sanitizeUser: jest.fn((u) => u),
  sanitizeUsers: jest.fn((u) => u),
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('AdminService – Transaction-Verwaltung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // listTransactions Tests
  // ============================================
  describe('listTransactions', () => {
    const mockTransactions = [
      { _id: 'txn-1', amount: 100, type: 'expense', category: 'groceries', userId: { name: 'Max', email: 'max@test.com' } },
      { _id: 'txn-2', amount: 2500, type: 'income', category: 'salary', userId: { name: 'Max', email: 'max@test.com' } },
    ];

    function setupFindMock(data, total) {
      const chainable = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(data),
      };
      Transaction.find = jest.fn().mockReturnValue(chainable);
      Transaction.countDocuments = jest.fn().mockResolvedValue(total);
      return chainable;
    }

    it('should return paginated transactions with defaults', async () => {
      setupFindMock(mockTransactions, 2);

      const result = await adminService.listTransactions();

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        pages: 1,
        limit: 50,
      });
      expect(Transaction.find).toHaveBeenCalledWith({});
    });

    it('should apply userId filter', async () => {
      setupFindMock(mockTransactions, 2);

      await adminService.listTransactions({ userId: 'user-123' });

      expect(Transaction.find).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should apply type filter for income', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ type: 'income' });

      expect(Transaction.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'income' })
      );
    });

    it('should apply type filter for expense', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ type: 'expense' });

      expect(Transaction.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'expense' })
      );
    });

    it('should ignore invalid type values', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ type: 'invalid' });

      const query = Transaction.find.mock.calls[0][0];
      expect(query.type).toBeUndefined();
    });

    it('should apply category filter', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ category: 'groceries' });

      expect(Transaction.find).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'groceries' })
      );
    });

    it('should apply date range filter (startDate + endDate)', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ startDate: '2025-01-01', endDate: '2025-01-31' });

      const query = Transaction.find.mock.calls[0][0];
      expect(query.date.$gte).toEqual(new Date('2025-01-01'));
      expect(query.date.$lte).toEqual(new Date('2025-01-31'));
    });

    it('should apply only startDate filter', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ startDate: '2025-06-01' });

      const query = Transaction.find.mock.calls[0][0];
      expect(query.date.$gte).toEqual(new Date('2025-06-01'));
      expect(query.date.$lte).toBeUndefined();
    });

    it('should apply only endDate filter', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ endDate: '2025-12-31' });

      const query = Transaction.find.mock.calls[0][0];
      expect(query.date.$lte).toEqual(new Date('2025-12-31'));
      expect(query.date.$gte).toBeUndefined();
    });

    it('should apply search filter (description regex)', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ search: 'Rewe' });

      const query = Transaction.find.mock.calls[0][0];
      expect(query.description).toEqual({ $regex: 'Rewe', $options: 'i' });
    });

    it('should ignore empty/whitespace-only search', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({ search: '   ' });

      const query = Transaction.find.mock.calls[0][0];
      expect(query.description).toBeUndefined();
    });

    it('should respect custom pagination (page, limit)', async () => {
      const chain = setupFindMock([], 200);

      await adminService.listTransactions({ page: 3, limit: 20 });

      expect(chain.skip).toHaveBeenCalledWith(40); // (3-1)*20
      expect(chain.limit).toHaveBeenCalledWith(20);
    });

    it('should cap limit at 100', async () => {
      const chain = setupFindMock([], 0);

      await adminService.listTransactions({ limit: 500 });

      expect(chain.limit).toHaveBeenCalledWith(100);
    });

    it('should default invalid page to 1', async () => {
      const chain = setupFindMock([], 0);

      await adminService.listTransactions({ page: -5 });

      expect(chain.skip).toHaveBeenCalledWith(0); // (1-1)*50
    });

    it('should populate userId with name and email', async () => {
      const chain = setupFindMock(mockTransactions, 2);

      await adminService.listTransactions();

      expect(chain.populate).toHaveBeenCalledWith('userId', 'name email');
    });

    it('should combine multiple filters', async () => {
      setupFindMock([], 0);

      await adminService.listTransactions({
        userId: 'user-abc',
        type: 'expense',
        category: 'food',
        startDate: '2025-01-01',
        search: 'lunch',
      });

      const query = Transaction.find.mock.calls[0][0];
      expect(query.userId).toBe('user-abc');
      expect(query.type).toBe('expense');
      expect(query.category).toBe('food');
      expect(query.date.$gte).toEqual(new Date('2025-01-01'));
      expect(query.description).toEqual({ $regex: 'lunch', $options: 'i' });
    });

    it('should calculate pages correctly', async () => {
      setupFindMock([], 150);

      const result = await adminService.listTransactions({ limit: 50 });

      expect(result.pagination.pages).toBe(3);
    });
  });

  // ============================================
  // getTransactionById Tests
  // ============================================
  describe('getTransactionById', () => {
    it('should return transaction with populated user', async () => {
      const mockTxn = {
        _id: 'txn-1',
        amount: 42.5,
        type: 'expense',
        userId: { name: 'Max', email: 'max@test.com' },
      };
      Transaction.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTxn),
      });

      const result = await adminService.getTransactionById('txn-1');

      expect(result).toEqual(mockTxn);
      expect(Transaction.findById).toHaveBeenCalledWith('txn-1');
    });

    it('should return null when transaction does not exist', async () => {
      Transaction.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await adminService.getTransactionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // deleteTransaction Tests
  // ============================================
  describe('deleteTransaction', () => {
    it('should delete transaction and return info', async () => {
      const mockTxn = {
        _id: 'txn-1',
        userId: 'user-123',
        amount: 100,
        category: 'groceries',
        type: 'expense',
        description: 'Einkauf',
      };
      Transaction.findById = jest.fn().mockResolvedValue(mockTxn);
      Transaction.findByIdAndDelete = jest.fn().mockResolvedValue(mockTxn);

      const result = await adminService.deleteTransaction('txn-1');

      expect(result.deleted).toBeDefined();
      expect(result.deleted.id).toBe('txn-1');
      expect(result.deleted.userId).toBe('user-123');
      expect(result.deleted.amount).toBe(100);
      expect(result.deleted.category).toBe('groceries');
      expect(result.deleted.type).toBe('expense');
      expect(result.deleted.description).toBe('Einkauf');
      expect(Transaction.findByIdAndDelete).toHaveBeenCalledWith('txn-1');
    });

    it('should return error when transaction not found', async () => {
      Transaction.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.deleteTransaction('nonexistent');

      expect(result.error).toBe('Transaktion nicht gefunden');
      expect(result.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should log warning on successful deletion', async () => {
      const logger = require('../../src/utils/logger');
      const mockTxn = {
        _id: 'txn-99',
        userId: 'user-abc',
        amount: 500,
        category: 'salary',
        type: 'income',
        description: 'Gehalt',
      };
      Transaction.findById = jest.fn().mockResolvedValue(mockTxn);
      Transaction.findByIdAndDelete = jest.fn().mockResolvedValue(mockTxn);

      await adminService.deleteTransaction('txn-99');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('txn-99')
      );
    });
  });

  // ============================================
  // getTransactionStats Tests
  // ============================================
  describe('getTransactionStats', () => {
    it('should return complete transaction statistics', async () => {
      Transaction.countDocuments = jest.fn()
        .mockResolvedValueOnce(1000)  // totalCount
        .mockResolvedValueOnce(50)    // last7DaysCount
        .mockResolvedValueOnce(200);  // last30DaysCount

      Transaction.aggregate = jest.fn()
        .mockResolvedValueOnce([
          { _id: 'income', count: 400, totalAmount: 50000 },
          { _id: 'expense', count: 600, totalAmount: 30000 },
        ])  // typeBreakdown
        .mockResolvedValueOnce([
          { _id: 'salary', count: 300, totalAmount: 45000 },
          { _id: 'groceries', count: 200, totalAmount: 8000 },
        ])  // categoryBreakdown (top 10)
        .mockResolvedValueOnce([
          { _id: null, totalIncome: 50000, totalExpense: 30000 },
        ]); // totalAmounts

      const result = await adminService.getTransactionStats();

      expect(result.totalCount).toBe(1000);
      expect(result.last7DaysCount).toBe(50);
      expect(result.last30DaysCount).toBe(200);
      expect(result.totalIncome).toBe(50000);
      expect(result.totalExpense).toBe(30000);
      expect(result.netBalance).toBe(20000);
      expect(result.typeBreakdown).toHaveLength(2);
      expect(result.topCategories).toHaveLength(2);
    });

    it('should handle empty database (no transactions)', async () => {
      Transaction.countDocuments = jest.fn().mockResolvedValue(0);
      Transaction.aggregate = jest.fn()
        .mockResolvedValueOnce([])   // typeBreakdown
        .mockResolvedValueOnce([])   // categoryBreakdown
        .mockResolvedValueOnce([]); // totalAmounts (empty → defaults)

      const result = await adminService.getTransactionStats();

      expect(result.totalCount).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.netBalance).toBe(0);
      expect(result.typeBreakdown).toEqual([]);
      expect(result.topCategories).toEqual([]);
    });

    it('should call countDocuments with date ranges', async () => {
      Transaction.countDocuments = jest.fn().mockResolvedValue(0);
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      await adminService.getTransactionStats();

      // 3 countDocuments calls: total, 7days, 30days
      expect(Transaction.countDocuments).toHaveBeenCalledTimes(3);
      // First call: no filter (total)
      expect(Transaction.countDocuments.mock.calls[0][0]).toBeUndefined();
      // Second call: createdAt >= 7 days ago
      expect(Transaction.countDocuments.mock.calls[1][0]).toHaveProperty('createdAt.$gte');
      // Third call: createdAt >= 30 days ago
      expect(Transaction.countDocuments.mock.calls[2][0]).toHaveProperty('createdAt.$gte');
    });

    it('should call aggregate pipeline for type breakdown', async () => {
      Transaction.countDocuments = jest.fn().mockResolvedValue(0);
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      await adminService.getTransactionStats();

      // 3 aggregate calls: typeBreakdown, categoryBreakdown, totalAmounts
      expect(Transaction.aggregate).toHaveBeenCalledTimes(3);
    });
  });
});
