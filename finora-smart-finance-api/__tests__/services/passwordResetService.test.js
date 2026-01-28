/**
 * @fileoverview Password Reset Service Tests
 * @description Unit tests for password management functionality
 */

const passwordResetService = require('../../src/services/passwordResetService');
const User = require('../../src/models/User');
const authService = require('../../src/services/authService');
const emailService = require('../../src/utils/emailService');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/emailService');

describe('PasswordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // changePassword Tests
  // ============================================
  describe('changePassword', () => {
    it('should successfully change password with correct current password', async () => {
      const mockUser = {
        _id: 'user-123',
        validatePassword: jest.fn().mockResolvedValue(true),
        setPassword: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await passwordResetService.changePassword(
        'user-123',
        'CurrentPassword123!',
        'NewPassword456!'
      );

      expect(result.changed).toBe(true);
      expect(mockUser.setPassword).toHaveBeenCalledWith('NewPassword456!');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should reject incorrect current password', async () => {
      const mockUser = {
        _id: 'user-123',
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await passwordResetService.changePassword(
        'user-123',
        'WrongPassword',
        'NewPassword456!'
      );

      expect(result.changed).toBe(false);
      expect(result.code).toBe('INVALID_PASSWORD');
    });

    it('should reject weak new password', async () => {
      const mockUser = {
        _id: 'user-123',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await passwordResetService.changePassword(
        'user-123',
        'CurrentPassword123!',
        'weak'
      );

      expect(result.changed).toBe(false);
      expect(result.code).toBe('WEAK_PASSWORD');
    });

    it('should reject non-existent user', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await passwordResetService.changePassword(
        'invalid-user',
        'CurrentPassword123!',
        'NewPassword456!'
      );

      expect(result.changed).toBe(false);
      expect(result.code).toBe('USER_NOT_FOUND');
    });
  });

  // ============================================
  // initiatePasswordReset Tests
  // ============================================
  describe('initiatePasswordReset', () => {
    it('should send password reset email for verified user', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: true,
        canResetPassword: jest.fn().mockReturnValue(true),
        generatePasswordReset: jest.fn().mockReturnValue('reset-token'),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail = jest.fn().mockResolvedValue({ sent: true });

      const result = await passwordResetService.initiatePasswordReset('max@example.com');

      expect(result.sent).toBe(true);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(mockUser, 'reset-token');
    });

    it('should handle non-existent email gracefully (security)', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await passwordResetService.initiatePasswordReset('nonexistent@example.com');

      // Should not reveal if email exists
      expect(result.sent).toBe(true);
    });

    it('should reject unverified email', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: false,
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await passwordResetService.initiatePasswordReset('max@example.com');

      expect(result.sent).toBe(false);
      expect(result.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should reject users who cannot reset password', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: true,
        canResetPassword: jest.fn().mockReturnValue(false),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await passwordResetService.initiatePasswordReset('max@example.com');

      expect(result.sent).toBe(false);
      expect(result.code).toBe('RESET_NOT_ALLOWED');
    });
  });

  // ============================================
  // completePasswordReset Tests
  // ============================================
  describe('completePasswordReset', () => {
    it('should successfully reset password with valid token', async () => {
      const mockUser = {
        _id: 'user-123',
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        setPassword: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
        refreshTokens: ['old'],
        email: 'max@example.com',
        isVerified: true,
      };

      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendSecurityAlert = jest.fn().mockResolvedValue(true);

      const result = await passwordResetService.completePasswordReset(
        'reset-token',
        'NewPassword456!'
      );

      expect(result.reset).toBe(true);
      expect(mockUser.setPassword).toHaveBeenCalledWith('NewPassword456!');
      expect(mockUser.refreshTokens).toEqual([]);
    });

    it('should reject invalid token', async () => {
      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await passwordResetService.completePasswordReset(
        'invalid-token',
        'NewPassword456!'
      );

      expect(result.reset).toBe(false);
      expect(result.code).toBe('INVALID_TOKEN');
    });

    it('should reject expired token', async () => {
      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await passwordResetService.completePasswordReset(
        'reset-token',
        'NewPassword456!'
      );

      expect(result.reset).toBe(false);
      expect(result.code).toBe('INVALID_TOKEN');
    });

    it('should reject missing token', async () => {
      const result = await passwordResetService.completePasswordReset(
        '',
        'NewPassword456!'
      );

      expect(result.reset).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });
  });
});
