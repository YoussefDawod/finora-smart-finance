/**
 * @fileoverview Auth Controller Integration Tests
 * @description Integration tests for refactored authentication endpoints
 */

const authController = require('../../src/controllers/authController');
const registrationService = require('../../src/services/registrationService');
const loginService = require('../../src/services/loginService');
const emailVerificationService = require('../../src/services/emailVerificationService');
const passwordResetService = require('../../src/services/passwordResetService');
const profileService = require('../../src/services/profileService');
const dataService = require('../../src/services/dataService');

// Mock services
jest.mock('../../src/services/registrationService');
jest.mock('../../src/services/loginService');
jest.mock('../../src/services/emailVerificationService');
jest.mock('../../src/services/passwordResetService');
jest.mock('../../src/services/profileService');
jest.mock('../../src/services/dataService');

describe('AuthController Integration Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123' },
      headers: {},
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

      registrationService.registerUser = jest.fn().mockResolvedValue({
        success: true,
        user: {
          _id: 'user-123',
          email: 'max@example.com',
          name: 'Max Mustermann',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
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

      registrationService.registerUser = jest.fn().mockResolvedValue({
        success: false,
        code: 'VALIDATION_ERROR',
        error: 'Invalid input',
      });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
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

      registrationService.registerUser = jest.fn().mockResolvedValue({
        success: false,
        code: 'EMAIL_EXISTS',
        error: 'Email already registered',
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

      loginService.authenticateUser = jest.fn().mockResolvedValue({
        success: true,
        user: {
          _id: 'user-123',
          email: 'max@example.com',
          name: 'Max Mustermann',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
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

      loginService.authenticateUser = jest.fn().mockResolvedValue({
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

      loginService.authenticateUser = jest.fn().mockResolvedValue({
        success: false,
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
      req.body = {
        token: 'verification-token',
      };

      emailVerificationService.verifyEmailByToken = jest.fn().mockResolvedValue({
        verified: true,
        message: 'Email verified successfully',
      });

      await authController.verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          verified: true,
        })
      );
    });

    it('should reject invalid verification token', async () => {
      req.body = {
        token: 'invalid-token',
      };

      emailVerificationService.verifyEmailByToken = jest.fn().mockResolvedValue({
        verified: false,
        code: 'INVALID_TOKEN',
        error: 'Invalid or expired token',
      });

      await authController.verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_TOKEN',
        })
      );
    });
  });

  // ============================================
  // Password Reset Endpoint Tests
  // ============================================
  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      req.user = { id: 'user-123' };
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      passwordResetService.changePassword = jest.fn().mockResolvedValue({
        changed: true,
        message: 'Password changed successfully',
      });

      await authController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          changed: true,
        })
      );
    });

    it('should reject invalid current password', async () => {
      req.user = { id: 'user-123' };
      req.body = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      };

      passwordResetService.changePassword = jest.fn().mockResolvedValue({
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
      req.user = { id: 'user-123' };
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'OldPassword123!', // Same as current
      };

      passwordResetService.changePassword = jest.fn().mockResolvedValue({
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
      req.body = {
        email: 'max@example.com',
      };

      passwordResetService.initiatePasswordReset = jest.fn().mockResolvedValue({
        initiated: true,
        message: 'Password reset email sent',
      });

      await authController.resetPasswordRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          initiated: true,
        })
      );
    });

    it('should handle user not found in password reset', async () => {
      req.body = {
        email: 'nonexistent@example.com',
      };

      passwordResetService.initiatePasswordReset = jest.fn().mockResolvedValue({
        initiated: false,
        code: 'USER_NOT_FOUND',
        error: 'User not found',
      });

      await authController.resetPasswordRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
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

      passwordResetService.completePasswordReset = jest.fn().mockResolvedValue({
        changed: true,
        message: 'Password reset successfully',
      });

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          changed: true,
        })
      );
    });

    it('should reject invalid reset token', async () => {
      req.body = {
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
        passwordConfirm: 'NewPassword123!',
      };

      passwordResetService.completePasswordReset = jest.fn().mockResolvedValue({
        changed: false,
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
  // Profile Endpoint Tests
  // ============================================
  describe('GET /auth/profile', () => {
    it('should fetch user profile', async () => {
      req.user = { id: 'user-123' };

      profileService.getUserProfile = jest.fn().mockResolvedValue({
        profile: {
          _id: 'user-123',
          name: 'Max Mustermann',
          email: 'max@example.com',
          isVerified: true,
        },
      });

      await authController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({
            email: 'max@example.com',
          }),
        })
      );
    });

    it('should handle profile fetch error', async () => {
      req.user = { id: 'user-123' };

      profileService.getUserProfile = jest.fn().mockResolvedValue({
        profile: null,
        error: 'User not found',
      });

      await authController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================
  // Update Profile Endpoint Tests
  // ============================================
  describe('PATCH /auth/profile', () => {
    it('should update user profile', async () => {
      req.user = { id: 'user-123' };
      req.body = {
        name: 'Neuer Name',
      };

      profileService.updateUserProfile = jest.fn().mockResolvedValue({
        updated: true,
        profile: {
          _id: 'user-123',
          name: 'Neuer Name',
          email: 'max@example.com',
        },
      });

      await authController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          updated: true,
        })
      );
    });

    it('should validate profile update data', async () => {
      req.user = { id: 'user-123' };
      req.body = {
        name: '',
      };

      profileService.updateUserProfile = jest.fn().mockResolvedValue({
        updated: false,
        code: 'VALIDATION_ERROR',
        error: 'Name cannot be empty',
      });

      await authController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================
  // Delete Account Endpoint Tests
  // ============================================
  describe('DELETE /auth/account', () => {
    it('should delete user account', async () => {
      req.user = { id: 'user-123' };
      req.body = {
        password: 'SecurePassword123!',
      };

      profileService.deleteUserAccount = jest.fn().mockResolvedValue({
        deleted: true,
        message: 'Account deleted successfully',
      });

      await authController.deleteAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted: true,
        })
      );
    });

    it('should reject account deletion with wrong password', async () => {
      req.user = { id: 'user-123' };
      req.body = {
        password: 'WrongPassword123!',
      };

      profileService.deleteUserAccount = jest.fn().mockResolvedValue({
        deleted: false,
        code: 'INVALID_PASSWORD',
        error: 'Invalid password',
      });

      await authController.deleteAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ============================================
  // Data Export Endpoint Tests
  // ============================================
  describe('POST /auth/export-data', () => {
    it('should export user data', async () => {
      req.user = { id: 'user-123' };

      dataService.exportUserData = jest.fn().mockResolvedValue({
        exported: true,
        data: {
          user: { _id: 'user-123', email: 'max@example.com' },
          transactions: [],
        },
      });

      await authController.exportData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exported: true,
        })
      );
    });

    it('should handle data export error', async () => {
      req.user = { id: 'user-123' };

      dataService.exportUserData = jest.fn().mockResolvedValue({
        exported: false,
        error: 'Export failed',
      });

      await authController.exportData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================
  // Send Verification Email Endpoint Tests
  // ============================================
  describe('POST /auth/send-verification', () => {
    it('should send verification email', async () => {
      req.user = { id: 'user-123' };

      emailVerificationService.sendVerificationEmail = jest
        .fn()
        .mockResolvedValue({
          sent: true,
          message: 'Verification email sent',
        });

      await authController.sendVerificationEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sent: true,
        })
      );
    });

    it('should handle already verified email', async () => {
      req.user = { id: 'user-123' };

      emailVerificationService.sendVerificationEmail = jest
        .fn()
        .mockResolvedValue({
          sent: false,
          code: 'EMAIL_VERIFIED',
          error: 'Email already verified',
        });

      await authController.sendVerificationEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
