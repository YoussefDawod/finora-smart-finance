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
    it('should successfully export user data with cursor factory', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        email: 'max@example.com',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-28'),
      };

      Transaction.countDocuments = jest.fn().mockResolvedValue(2);
      Transaction.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          cursor: jest.fn().mockReturnValue('mock-cursor'),
        }),
      });

      const result = await dataService.exportUserData('user-123', mockUser);

      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user-123');
      expect(result.user.name).toBe('Max Mustermann');
      expect(result.transactionCount).toBe(2);
      expect(typeof result.getTransactionCursor).toBe('function');

      // Verify cursor factory returns a cursor
      const cursor = result.getTransactionCursor();
      expect(cursor).toBe('mock-cursor');
      expect(Transaction.find).toHaveBeenCalledWith({ userId: 'user-123' });
    });

    it('should export user with no transactions', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        email: 'max@example.com',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-28'),
      };

      Transaction.countDocuments = jest.fn().mockResolvedValue(0);
      Transaction.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          cursor: jest.fn().mockReturnValue('mock-cursor'),
        }),
      });

      const result = await dataService.exportUserData('user-123', mockUser);

      expect(result.success).toBe(true);
      expect(result.transactionCount).toBe(0);
      expect(typeof result.getTransactionCursor).toBe('function');
    });

    it('should handle export errors', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
      };

      Transaction.countDocuments = jest.fn().mockRejectedValue(new Error('Database error'));

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
