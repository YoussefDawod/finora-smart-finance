/**
 * @fileoverview Profile Service Tests
 * @description Unit tests for user profile management
 */

const profileService = require('../../src/services/profileService');
const User = require('../../src/models/User');
const Transaction = require('../../src/models/Transaction');
const authService = require('../../src/services/authService');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/models/Transaction');
jest.mock('../../src/services/authService');

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // getUserProfile Tests
  // ============================================
  describe('getUserProfile', () => {
    it('should return sanitized user profile', () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        email: 'max@example.com',
        createdAt: new Date(),
        passwordHash: 'hashed-password',
        refreshTokens: ['token1', 'token2'],
      };

      authService.sanitizeUserForAuth = jest.fn().mockReturnValue({
        _id: 'user-123',
        name: 'Max Mustermann',
        email: 'max@example.com',
        createdAt: mockUser.createdAt,
      });

      const result = profileService.getUserProfile(mockUser);

      expect(authService.sanitizeUserForAuth).toHaveBeenCalledWith(mockUser);
      expect(result._id).toBe('user-123');
      expect(result.name).toBe('Max Mustermann');
      expect(result.email).toBe('max@example.com');
    });
  });

  // ============================================
  // updateUserProfile Tests
  // ============================================
  describe('updateUserProfile', () => {
    it('should successfully update user name', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Old Name',
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      authService.sanitizeUserForAuth = jest.fn().mockReturnValue({
        _id: 'user-123',
        name: 'Max Mustermann',
      });

      const result = await profileService.updateUserProfile('user-123', {
        name: 'Max Mustermann',
      });

      expect(result.updated).toBe(true);
      expect(mockUser.name).toBe('Max Mustermann');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should reject invalid name', async () => {
      const result = await profileService.updateUserProfile('user-123', {
        name: 'Ab',
      });

      expect(result.updated).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('should reject missing name', async () => {
      const result = await profileService.updateUserProfile('user-123', {
        name: '',
      });

      expect(result.updated).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('should reject non-existent user', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await profileService.updateUserProfile('invalid-user', {
        name: 'Max Mustermann',
      });

      expect(result.updated).toBe(false);
      expect(result.code).toBe('USER_NOT_FOUND');
    });
  });

  // ============================================
  // deleteUserAccount Tests
  // ============================================
  describe('deleteUserAccount', () => {
    it('should successfully delete user account', async () => {
      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 10 });
      User.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'user-123' });

      const result = await profileService.deleteUserAccount(
        'user-123',
        'max@example.com',
        'max@example.com'
      );

      expect(result.deleted).toBe(true);
      expect(Transaction.deleteMany).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user-123');
    });

    it('should reject email mismatch', async () => {
      const result = await profileService.deleteUserAccount(
        'user-123',
        'wrong@example.com',
        'max@example.com'
      );

      expect(result.deleted).toBe(false);
      expect(result.code).toBe('EMAIL_MISMATCH');
    });

    it('should reject missing confirmation email', async () => {
      const result = await profileService.deleteUserAccount(
        'user-123',
        '',
        'max@example.com'
      );

      expect(result.deleted).toBe(false);
      expect(result.code).toBe('MISSING_EMAIL');
    });

    it('should handle deletion errors', async () => {
      Transaction.deleteMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        profileService.deleteUserAccount(
          'user-123',
          'max@example.com',
          'max@example.com'
        )
      ).rejects.toThrow('Database error');
    });
  });
});
