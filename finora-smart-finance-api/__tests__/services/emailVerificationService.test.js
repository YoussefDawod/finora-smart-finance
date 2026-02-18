/**
 * @fileoverview Email Verification Service Tests
 * @description Unit tests for email verification
 */

const emailVerificationService = require('../../src/services/emailVerificationService');
const User = require('../../src/models/User');
const authService = require('../../src/services/authService');
const emailService = require('../../src/utils/emailService');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/emailService');

describe('EmailVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // sendVerificationEmail Tests
  // ============================================
  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        generateVerification: jest.fn().mockReturnValue('verification-token'),
        save: jest.fn().mockResolvedValue(true),
      };
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({ sent: true });

      const result = await emailVerificationService.sendVerificationEmail(mockUser);

      expect(result.sent).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should reject non-existent user', async () => {
      await expect(emailVerificationService.sendVerificationEmail(null)).rejects.toThrow();
    });
  });

  // ============================================
  // verifyEmailByToken Tests
  // ============================================
  describe('verifyEmailByToken', () => {
    it('should verify email with valid token', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: false,
        verificationToken: 'hashed-token',
        verificationExpires: new Date(Date.now() + 1000 * 60 * 60),
        save: jest.fn().mockResolvedValue(true),
      };

      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendWelcomeEmail = jest.fn().mockResolvedValue({ sent: true });

      const result = await emailVerificationService.verifyEmailByToken('verification-token');

      expect(result.verified).toBe(true);
      expect(result.user).toBe(mockUser);
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUser);
    });

    it('should still verify even if welcome email fails', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: false,
        verificationToken: 'hashed-token',
        verificationExpires: new Date(Date.now() + 1000 * 60 * 60),
        save: jest.fn().mockResolvedValue(true),
      };

      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendWelcomeEmail = jest.fn().mockRejectedValue(new Error('SMTP error'));

      const result = await emailVerificationService.verifyEmailByToken('verification-token');

      expect(result.verified).toBe(true);
      expect(mockUser.isVerified).toBe(true);
    });

    it('should reject invalid token', async () => {
      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await emailVerificationService.verifyEmailByToken('invalid-token');

      expect(result.verified).toBe(false);
      expect(result.code).toBe('INVALID_TOKEN');
    });

    it('should reject expired token', async () => {
      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await emailVerificationService.verifyEmailByToken('expired-token');

      expect(result.verified).toBe(false);
      expect(result.code).toBe('INVALID_TOKEN');
    });

    it('should reject missing token', async () => {
      const result = await emailVerificationService.verifyEmailByToken(null);

      expect(result.verified).toBe(false);
      expect(result.code).toBe('MISSING_TOKEN');
    });
  });
});
