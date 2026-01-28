/**
 * @fileoverview Email Verification Service Tests
 * @description Unit tests for email verification and management
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
  // resendVerificationEmail Tests
  // ============================================
  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: false,
        generateVerification: jest.fn().mockReturnValue('new-token'),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({ sent: true });

      const result = await emailVerificationService.resendVerificationEmail('max@example.com');

      expect(result.sent).toBe(true);
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should reject already verified email', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: true,
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await emailVerificationService.resendVerificationEmail('max@example.com');

      expect(result.sent).toBe(true);
      expect(result.alreadyVerified).toBe(true);
    });

    it('should return sent:true when user not found (no enumeration)', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await emailVerificationService.resendVerificationEmail('missing@example.com');

      expect(result.sent).toBe(true);
      expect(result.alreadyVerified).toBeUndefined();
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

      const result = await emailVerificationService.verifyEmailByToken('verification-token');

      expect(result.verified).toBe(true);
      expect(result.user).toBe(mockUser);
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
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
  });

  // ============================================
  // Email Change Tests
  // ============================================
  describe('initiateEmailChange', () => {
    it('should initiate email change', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'old@example.com',
        emailChangeToken: undefined,
        generateEmailAddToken: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      emailService.sendEmailChangeVerification = jest.fn().mockResolvedValue({ sent: true });

      const result = await emailVerificationService.initiateEmailChange(
        mockUser,
        'new@example.com'
      );

      expect(result.sent).toBe(true);
      expect(result.newEmail).toBe('new@example.com');
      expect(mockUser.emailChangeToken).toBeDefined();
      expect(mockUser.emailChangeNewEmail).toBe('new@example.com');
      expect(mockUser.save).toHaveBeenCalled();
      expect(emailService.sendEmailChangeVerification).toHaveBeenCalled();
    });

    it('should reject if user missing', async () => {
      await expect(
        emailVerificationService.initiateEmailChange(null, 'new@example.com')
      ).rejects.toThrow();
    });
  });

  // ============================================
  // verifyEmailChange Tests
  // ============================================
  describe('verifyEmailChange', () => {
    it('should verify and change email', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'old@example.com',
        emailChangeToken: 'hashed-token',
        emailChangeExpires: new Date(Date.now() + 1000 * 60 * 60),
        emailChangeNewEmail: 'new@example.com',
        save: jest.fn().mockResolvedValue(true),
      };

      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await emailVerificationService.verifyEmailChange('change-token');

      expect(result.changed).toBe(true);
      expect(mockUser.email).toBe('new@example.com');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      authService.hashToken = jest.fn().mockReturnValue('hashed-token');
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await emailVerificationService.verifyEmailChange('invalid-token');

      expect(result.changed).toBe(false);
      expect(result.code).toBe('INVALID_TOKEN');
    });
  });

  // ============================================
  // getEmailStatus Tests
  // ============================================
  describe('getEmailStatus', () => {
    it('should return email status for user with email', () => {
      const mockUser = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: true,
        emailChangeNewEmail: null,
        understoodNoEmailReset: false,
      };

      const result = emailVerificationService.getEmailStatus(mockUser);

      expect(result.email).toBe('max@example.com');
      expect(result.isVerified).toBe(true);
      expect(result.pendingEmail).toBeNull();
    });

    it('should return email status for user without email', () => {
      const mockUser = {
        _id: 'user-123',
        email: null,
        isVerified: false,
        emailChangeNewEmail: null,
        understoodNoEmailReset: true,
      };

      const result = emailVerificationService.getEmailStatus(mockUser);

      expect(result.email).toBeNull();
      expect(result.isVerified).toBe(false);
      expect(result.canResetPassword).toBe(false);
      expect(result.understoodNoEmailReset).toBe(true);
    });
  });
});
