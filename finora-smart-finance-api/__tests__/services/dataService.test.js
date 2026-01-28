/**
 * @fileoverview Data Service Tests
 * @description Unit tests for data export and deletion operations
 */

const dataService = require('../../src/services/dataService');
const Transaction = require('../../src/models/Transaction');

// Mock dependencies
jest.mock('../../src/models/Transaction');

describe('DataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // exportUserData Tests
  // ============================================
  describe('exportUserData', () => {
    it('should successfully export user data', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        email: 'max@example.com',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-28'),
      };

      const mockTransactions = [
        {
          _id: 'trans-1',
          amount: 100,
          category: 'groceries',
          description: 'Weekly groceries',
          type: 'expense',
          date: new Date('2025-01-20'),
          tags: ['food'],
          notes: 'test',
          createdAt: new Date('2025-01-20'),
          updatedAt: new Date('2025-01-20'),
        },
        {
          _id: 'trans-2',
          amount: 2000,
          category: 'salary',
          description: 'Monthly salary',
          type: 'income',
          date: new Date('2025-01-01'),
          tags: ['work'],
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];

      Transaction.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTransactions),
      });

      const result = await dataService.exportUserData('user-123', mockUser);

      expect(result.success).toBe(true);
      expect(result.export.user.id).toBe('user-123');
      expect(result.export.user.name).toBe('Max Mustermann');
      expect(result.export.transactions).toHaveLength(2);
      expect(result.export.transactions[0].amount).toBe(100);
      expect(result.export.transactions[1].amount).toBe(2000);
    });

    it('should export user with no transactions', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        email: 'max@example.com',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-28'),
      };

      Transaction.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await dataService.exportUserData('user-123', mockUser);

      expect(result.success).toBe(true);
      expect(result.export.transactions).toHaveLength(0);
    });

    it('should handle export errors', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
      };

      Transaction.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(dataService.exportUserData('user-123', mockUser)).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ============================================
  // deleteAllTransactions Tests
  // ============================================
  describe('deleteAllTransactions', () => {
    it('should successfully delete all transactions', async () => {
      const mockUser = {
        _id: 'user-123',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

      const result = await dataService.deleteAllTransactions('user-123', 'Password123!', mockUser);

      expect(result.deleted).toBe(true);
      expect(result.deletedCount).toBe(5);
      expect(Transaction.deleteMany).toHaveBeenCalledWith({ userId: 'user-123' });
    });

    it('should reject when password is missing', async () => {
      const mockUser = {
        _id: 'user-123',
      };

      const result = await dataService.deleteAllTransactions('user-123', '', mockUser);

      expect(result.deleted).toBe(false);
      expect(result.code).toBe('MISSING_PASSWORD');
    });

    it('should reject incorrect password', async () => {
      const mockUser = {
        _id: 'user-123',
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      const result = await dataService.deleteAllTransactions(
        'user-123',
        'WrongPassword',
        mockUser
      );

      expect(result.deleted).toBe(false);
      expect(result.code).toBe('INVALID_PASSWORD');
    });

    it('should handle deletion errors', async () => {
      const mockUser = {
        _id: 'user-123',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      Transaction.deleteMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        dataService.deleteAllTransactions('user-123', 'Password123!', mockUser)
      ).rejects.toThrow('Database error');
    });

    it('should handle case where user has no transactions', async () => {
      const mockUser = {
        _id: 'user-123',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

      const result = await dataService.deleteAllTransactions('user-123', 'Password123!', mockUser);

      expect(result.deleted).toBe(true);
      expect(result.deletedCount).toBe(0);
    });
  });
});
