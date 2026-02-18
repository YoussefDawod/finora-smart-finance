/**
 * @fileoverview Auth Controller Integration Tests
 * @description Integration tests for refactored authentication endpoints
 */

const authController = require('../../src/controllers/authController');
const registrationService = require('../../src/services/registrationService');
const loginService = require('../../src/services/loginService');
const emailVerificationService = require('../../src/services/emailVerificationService');
const passwordResetService = require('../../src/services/passwordResetService');
const authService = require('../../src/services/authService');
const User = require('../../src/models/User');

// Mock services
jest.mock('../../src/services/registrationService');
jest.mock('../../src/services/loginService');
jest.mock('../../src/services/emailVerificationService');
jest.mock('../../src/services/passwordResetService');
jest.mock('../../src/services/authService');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ link: 'http://test/verify' }),
}));
jest.mock('../../src/config/env', () => ({
  nodeEnv: 'test',
  frontendUrl: 'http://localhost:3000',
  jwt: {
    secret: 'test-secret-key',
    expire: '1h',
    accessExpire: 3600,
    refreshExpire: 604800,
  },
}));

describe('AuthController Integration Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user-123',
        _id: 'user-123',
        email: 'max@example.com',
        name: 'Max Mustermann',
        isVerified: true,
        preferences: {},
        save: jest.fn().mockResolvedValue(true),
      },
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      file: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  // ============================================
  // Registration Endpoint Tests
  // ============================================
  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      req.body = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        password: 'SecurePassword123!',
        passwordConfirm: 'SecurePassword123!',
        consent: true,
      };

      registrationService.validateRegistrationInput.mockResolvedValue({
        valid: true,
        data: { name: 'Max Mustermann', email: 'max@example.com', password: 'SecurePassword123!' },
      });

      registrationService.registerUser.mockResolvedValue({
        user: { _id: 'user-123', email: 'max@example.com', name: 'Max Mustermann' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
        verificationLink: null,
      });

      authService.buildAuthResponse.mockReturnValue({
        accessToken: 'access-token',
        user: { _id: 'user-123', email: 'max@example.com', name: 'Max Mustermann' },
      });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should handle validation error in registration', async () => {
      req.body = {
        name: '',
        email: 'invalid',
        password: 'weak',
      };

      registrationService.validateRegistrationInput.mockResolvedValue({
        valid: false,
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
      });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should handle duplicate email error', async () => {
      req.body = {
        name: 'Max Mustermann',
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        passwordConfirm: 'SecurePassword123!',
        consent: true,
      };

      registrationService.validateRegistrationInput.mockResolvedValue({
        valid: true,
        data: { name: 'Max Mustermann', email: 'existing@example.com', password: 'SecurePassword123!' },
      });

      const duplicateErr = new Error('Duplicate key');
      registrationService.registerUser.mockRejectedValue(duplicateErr);
      registrationService.handleDuplicateError.mockReturnValue({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS',
      });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'EMAIL_EXISTS',
        })
      );
    });
  });

  // ============================================
  // Login Endpoint Tests
  // ============================================
  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      req.body = {
        email: 'max@example.com',
        password: 'SecurePassword123!',
      };

      loginService.validateLoginInput.mockReturnValue({ valid: true });

      loginService.authenticateUser.mockResolvedValue({
        success: true,
        user: {
          _id: 'user-123',
          email: 'max@example.com',
          name: 'Max Mustermann',
          isVerified: true,
        },
      });

      loginService.checkEmailVerification.mockReturnValue({ verified: true });

      loginService.generateLoginSession.mockResolvedValue({
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
        user: { _id: 'user-123', email: 'max@example.com', name: 'Max Mustermann' },
      });

      authService.buildAuthResponse.mockReturnValue({
        accessToken: 'access-token',
        user: { _id: 'user-123', email: 'max@example.com', name: 'Max Mustermann' },
      });

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.any(Object)
      );
    });

    it('should reject invalid credentials', async () => {
      req.body = {
        email: 'max@example.com',
        password: 'wrongpassword',
      };

      loginService.validateLoginInput.mockReturnValue({ valid: true });

      loginService.authenticateUser.mockResolvedValue({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Invalid email or password',
      });

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_CREDENTIALS',
        })
      );
    });

    it('should reject unverified email login', async () => {
      req.body = {
        email: 'unverified@example.com',
        password: 'SecurePassword123!',
      };

      loginService.validateLoginInput.mockReturnValue({ valid: true });

      loginService.authenticateUser.mockResolvedValue({
        success: true,
        user: {
          _id: 'user-123',
          email: 'unverified@example.com',
          isVerified: false,
        },
      });

      loginService.checkEmailVerification.mockReturnValue({
        verified: false,
        code: 'EMAIL_NOT_VERIFIED',
        error: 'Please verify your email first',
      });

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'EMAIL_NOT_VERIFIED',
        })
      );
    });
  });

  // ============================================
  // Email Verification Endpoint Tests
  // ============================================
  describe('POST /auth/verify-email', () => {
    it('should verify email with token', async () => {
      req.body = { token: 'verification-token' };

      const mockUser = {
        isVerified: false,
        verificationToken: undefined,
        verificationExpires: undefined,
        save: jest.fn().mockResolvedValue(true),
        email: 'max@example.com',
      };

      authService.hashToken.mockReturnValue('hashed-token');
      User.findOne.mockResolvedValue(mockUser);

      await authController.verifyEmail(req, res, next);

      expect(mockUser.isVerified).toBe(true);
      expect(res.redirect).toHaveBeenCalled();
    });

    it('should reject invalid verification token', async () => {
      req.body = { token: 'invalid-token' };

      authService.hashToken.mockReturnValue('hashed-invalid');
      User.findOne.mockResolvedValue(null);

      await authController.verifyEmail(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=invalid_token')
      );
    });
  });

  // ============================================
  // Password Change Tests
  // ============================================
  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      passwordResetService.changePassword.mockResolvedValue({
        changed: true,
        message: 'Password changed successfully',
      });

      await authController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ changed: true })
      );
    });

    it('should reject invalid current password', async () => {
      req.body = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      };

      passwordResetService.changePassword.mockResolvedValue({
        changed: false,
        code: 'INVALID_PASSWORD',
        error: 'Current password is incorrect',
      });

      await authController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_PASSWORD',
        })
      );
    });

    it('should validate password change requirements', async () => {
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'OldPassword123!',
      };

      passwordResetService.changePassword.mockResolvedValue({
        changed: false,
        code: 'VALIDATION_ERROR',
        error: 'New password must be different from current password',
      });

      await authController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================
  // Password Reset Request Tests
  // ============================================
  describe('POST /auth/reset-password-request', () => {
    it('should initiate password reset', async () => {
      req.body = { email: 'max@example.com' };

      passwordResetService.initiatePasswordReset.mockResolvedValue({
        sent: true,
        message: 'Password reset email sent',
      });

      await authController.resetPasswordRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ initiated: true })
      );
    });

    it('should handle invalid email in password reset', async () => {
      req.body = { email: 'nonexistent@example.com' };

      passwordResetService.initiatePasswordReset.mockResolvedValue({
        sent: false,
        code: 'USER_NOT_FOUND',
        error: 'User not found',
      });

      await authController.resetPasswordRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================
  // Password Reset Completion Tests
  // ============================================
  describe('POST /auth/reset-password', () => {
    it('should complete password reset with token', async () => {
      req.body = {
        token: 'reset-token',
        newPassword: 'NewPassword123!',
        passwordConfirm: 'NewPassword123!',
      };

      passwordResetService.completePasswordReset.mockResolvedValue({
        reset: true,
        message: 'Password reset successfully',
      });

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ changed: true })
      );
    });

    it('should reject invalid reset token', async () => {
      req.body = {
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
        passwordConfirm: 'NewPassword123!',
      };

      passwordResetService.completePasswordReset.mockResolvedValue({
        reset: false,
        code: 'INVALID_TOKEN',
        error: 'Invalid or expired reset token',
      });

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================
  // Logout Endpoint Tests
  // ============================================
  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      req.user = { id: 'user-123' };

      await authController.logout(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ============================================
  // Send Verification Email Endpoint Tests
  // ============================================
  describe('POST /auth/send-verification', () => {
    it('should send verification email', async () => {
      req.user = {
        id: 'user-123',
        _id: 'user-123',
        isVerified: false,
        email: 'max@example.com',
      };

      emailVerificationService.sendVerificationEmail.mockResolvedValue({
        sent: true,
        message: 'Verification email sent',
      });

      await authController.sendVerificationEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sent: true })
      );
    });

    it('should handle already verified email', async () => {
      req.user = {
        id: 'user-123',
        _id: 'user-123',
        isVerified: true,
        email: 'max@example.com',
      };

      await authController.sendVerificationEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
