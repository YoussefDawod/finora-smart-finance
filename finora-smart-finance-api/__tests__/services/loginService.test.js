/**
 * @fileoverview Login Service Tests
 * @description Unit tests for user login functionality
 */

const loginService = require('../../src/services/loginService');
const User = require('../../src/models/User');
const authService = require('../../src/services/authService');
const emailService = require('../../src/utils/emailService');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/emailService');

describe('LoginService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // validateLoginInput Tests
  // ============================================
  describe('validateLoginInput', () => {
    it('should validate correct login input', () => {
      const result = loginService.validateLoginInput('Max Mustermann', 'Password123!');

      expect(result.valid).toBe(true);
    });

    it('should reject missing name', () => {
      const result = loginService.validateLoginInput('', 'Password123!');

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('should reject missing password', () => {
      const result = loginService.validateLoginInput('Max Mustermann', '');

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('should reject null/undefined inputs', () => {
      expect(loginService.validateLoginInput(null, 'password').valid).toBe(false);
      expect(loginService.validateLoginInput('name', null).valid).toBe(false);
      expect(loginService.validateLoginInput(undefined, 'password').valid).toBe(false);
    });
  });

  // ============================================
  // authenticateUser Tests
  // ============================================
  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await loginService.authenticateUser('Max Mustermann', 'CorrectPassword123!');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('CorrectPassword123!');
    });

    it('should reject non-existent user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await loginService.authenticateUser('NonExistent', 'Password123!');

      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject incorrect password', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await loginService.authenticateUser('Max Mustermann', 'WrongPassword');

      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });
  });

  // ============================================
  // checkEmailVerification Tests
  // ============================================
  describe('checkEmailVerification', () => {
    it('should allow login for verified users with email', () => {
      const user = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: true,
      };

      const result = loginService.checkEmailVerification(user);

      expect(result.verified).toBe(true);
    });

    it('should allow login for users without email', () => {
      const user = {
        _id: 'user-123',
        email: null,
        isVerified: false,
      };

      const result = loginService.checkEmailVerification(user);

      expect(result.verified).toBe(true);
    });

    it('should reject unverified email', () => {
      const user = {
        _id: 'user-123',
        email: 'max@example.com',
        isVerified: false,
      };

      const result = loginService.checkEmailVerification(user);

      expect(result.verified).toBe(false);
      expect(result.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  // ============================================
  // generateLoginSession Tests
  // ============================================
  describe('generateLoginSession', () => {
    it('should generate login session with tokens', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
        email: 'max@example.com',
        isVerified: true,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      authService.generateAuthTokens = jest.fn().mockResolvedValue(mockTokens);
      emailService.sendSecurityAlert = jest.fn().mockResolvedValue(true);

      const result = await loginService.generateLoginSession(mockUser, {
        userAgent: 'Mozilla/5.0',
        ip: '127.0.0.1',
      });

      expect(result.tokens).toEqual(mockTokens);
      expect(result.user).toBe(mockUser);
      expect(authService.generateAuthTokens).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
        })
      );
      expect(mockUser.save).toHaveBeenCalled();
      expect(emailService.sendSecurityAlert).toHaveBeenCalled();
    });

    it('should handle token generation errors', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Max Mustermann',
      };

      authService.generateAuthTokens = jest.fn().mockRejectedValue(new Error('Token generation failed'));

      await expect(
        loginService.generateLoginSession(mockUser, {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
        })
      ).rejects.toThrow('Token generation failed');
    });
  });
});
