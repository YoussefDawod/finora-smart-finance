/**
 * @fileoverview Registration Service Tests
 * @description Unit tests for user registration functionality
 */

const registrationService = require('../../src/services/registrationService');
const User = require('../../src/models/User');
const emailService = require('../../src/utils/emailService');
const authService = require('../../src/services/authService');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/utils/emailService');
jest.mock('../../src/services/authService');

describe('RegistrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // validateRegistrationInput Tests
  // ============================================
  describe('validateRegistrationInput', () => {
    it('should validate correct registration input', async () => {
      const result = await registrationService.validateRegistrationInput(
        'Max Mustermann',
        'SecurePass123!',
        'max@example.com',
        true
      );

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        name: 'Max Mustermann',
        password: 'SecurePass123!',
        email: 'max@example.com',
        understoodNoEmailReset: false,
      });
    });

    it('should reject invalid name', async () => {
      const result = await registrationService.validateRegistrationInput(
        'Ab',
        'SecurePass123!',
        'max@example.com',
        true
      );

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_NAME');
    });

    it('should reject weak password', async () => {
      const result = await registrationService.validateRegistrationInput(
        'Max Mustermann',
        'weak',
        'max@example.com',
        true
      );

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_PASSWORD');
    });

    it('should reject invalid email', async () => {
      const result = await registrationService.validateRegistrationInput(
        'Max Mustermann',
        'SecurePass123!',
        'invalid-email',
        true
      );

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_EMAIL');
    });

    it('should reject when understoodNoEmailReset is not accepted (no email)', async () => {
      const result = await registrationService.validateRegistrationInput(
        'Max Mustermann',
        'SecurePass123!',
        '',
        false
      );

      expect(result.valid).toBe(false);
      expect(result.code).toBe('CHECKBOX_REQUIRED');
    });

    it('should allow missing email when checkbox accepted', async () => {
      const result = await registrationService.validateRegistrationInput(
        'Max Mustermann',
        'SecurePass123!',
        '',
        true
      );

      expect(result.valid).toBe(true);
      expect(result.data.email).toBeNull();
      expect(result.data.understoodNoEmailReset).toBe(true);
    });
  });

  // ============================================
  // registerUser Tests
  // ============================================
  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        name: 'Max Mustermann',
        password: 'SecurePass123!',
        email: 'max@example.com',
        understoodNoEmailReset: true,
      };

      const mockUser = {
        _id: 'user-123',
        name: userData.name,
        email: userData.email,
        isVerified: false,
        understoodNoEmailReset: userData.understoodNoEmailReset,
        generateVerification: jest.fn().mockReturnValue('verification-token'),
        save: jest.fn().mockResolvedValue(true),
        setPassword: jest.fn().mockResolvedValue(true),
      };

      User.mockImplementation(() => mockUser);
      authService.generateAuthTokens = jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({ link: 'verify-link' });

      const result = await registrationService.registerUser(userData, {
        userAgent: 'Mozilla/5.0',
        ip: '127.0.0.1',
      });

      expect(result.user).toBe(mockUser);
      expect(result.tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      // verificationLink only returned in development; we just ensure call happened
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(mockUser, 'verification-token');
      expect(mockUser.setPassword).toHaveBeenCalledWith(userData.password);
      expect(authService.generateAuthTokens).toHaveBeenCalledWith(mockUser, {
        userAgent: 'Mozilla/5.0',
        ip: '127.0.0.1',
      });
    });

    it('should handle registration errors', async () => {
      const userData = {
        name: 'Max Mustermann',
        password: 'SecurePass123!',
        email: 'max@example.com',
        understoodNoEmailReset: true,
      };

      const mockUser = {
        setPassword: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      User.mockImplementation(() => mockUser);

      await expect(
        registrationService.registerUser(userData, {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
        })
      ).rejects.toThrow('Database error');
    });
  });

  // ============================================
  // handleDuplicateError Tests
  // ============================================
  describe('handleDuplicateError', () => {
    it('should handle duplicate email error', () => {
      const error = new Error('Duplicate key error');
      error.code = 11000;
      error.keyPattern = { email: 1 };

      const result = registrationService.handleDuplicateError(error);

      expect(result).not.toBeNull();
      expect(result.code).toBe('EMAIL_EXISTS');
    });

    it('should return null for non-duplicate errors', () => {
      const error = new Error('Some other error');
      const result = registrationService.handleDuplicateError(error);

      expect(result).toBeNull();
    });

    it('should handle duplicate name error', () => {
      const error = new Error('Duplicate key error');
      error.code = 11000;
      error.keyPattern = { name: 1 };

      const result = registrationService.handleDuplicateError(error);

      expect(result).not.toBeNull();
      expect(result.code).toBe('NAME_EXISTS');
    });
  });
});
