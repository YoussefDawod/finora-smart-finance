/**
 * @fileoverview Auth Middleware Tests
 * @description Unit tests for authMiddleware (JWT + isActive check) and requireAdmin
 */

const authMiddleware = require('../../src/middleware/authMiddleware');
const { requireAdmin } = require('../../src/middleware/authMiddleware');
const { verifyAccessToken } = require('../../src/services/authService');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/services/authService');
jest.mock('../../src/models/User');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      requestId: 'test-request-id',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  // ============================================
  // authMiddleware Tests
  // ============================================
  describe('authMiddleware', () => {
    it('should authenticate user with valid Bearer token', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        role: 'user',
        isActive: true,
      };

      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue({ sub: 'user-123' });

      // Mock the chained .select() call
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(User.findById).toHaveBeenCalledWith('user-123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without Authorization header', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'NO_TOKEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with non-Bearer Authorization', async () => {
      req.headers.authorization = 'Basic dXNlcjpwYXNz';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'NO_TOKEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'INVALID_TOKEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user not found in DB', async () => {
      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue({ sub: 'deleted-user' });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'INVALID_USER',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject banned user (isActive === false)', async () => {
      const bannedUser = {
        _id: 'user-banned',
        name: 'Banned User',
        role: 'user',
        isActive: false,
      };

      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue({ sub: 'user-banned' });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(bannedUser),
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'ACCOUNT_BANNED',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow active user (isActive === true)', async () => {
      const activeUser = {
        _id: 'user-active',
        name: 'Active User',
        role: 'user',
        isActive: true,
      };

      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue({ sub: 'user-active' });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(activeUser),
      });

      await authMiddleware(req, res, next);

      expect(req.user).toEqual(activeUser);
      expect(next).toHaveBeenCalled();
    });

    it('should allow user where isActive is undefined (legacy users)', async () => {
      const legacyUser = {
        _id: 'user-legacy',
        name: 'Legacy User',
        role: 'user',
        // isActive is not set (undefined) — should be allowed
      };

      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue({ sub: 'user-legacy' });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(legacyUser),
      });

      await authMiddleware(req, res, next);

      expect(req.user).toEqual(legacyUser);
      expect(next).toHaveBeenCalled();
    });

    it('should exclude passwordHash and refreshTokens from user select', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        _id: 'user-123',
        name: 'User',
        isActive: true,
      });

      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue({ sub: 'user-123' });
      User.findById = jest.fn().mockReturnValue({ select: mockSelect });

      await authMiddleware(req, res, next);

      expect(mockSelect).toHaveBeenCalledWith('-passwordHash -refreshTokens');
    });
  });

  // ============================================
  // requireAdmin Tests
  // ============================================
  describe('requireAdmin', () => {
    it('should allow admin user', () => {
      req.user = { _id: 'admin-1', name: 'Admin', role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject regular user', () => {
      req.user = { _id: 'user-1', name: 'User', role: 'user' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'FORBIDDEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when no user on request (middleware not chained correctly)', () => {
      req.user = undefined;

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'FORBIDDEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when user has no role field (legacy user)', () => {
      req.user = { _id: 'user-1', name: 'No Role' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject null role', () => {
      req.user = { _id: 'user-1', name: 'Null Role', role: null };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty string role', () => {
      req.user = { _id: 'user-1', name: 'Empty Role', role: '' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject role with wrong casing', () => {
      req.user = { _id: 'user-1', name: 'Wrong Case', role: 'Admin' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Module Export Tests
  // ============================================
  describe('Module Exports', () => {
    it('should export authMiddleware as default', () => {
      expect(typeof authMiddleware).toBe('function');
    });

    it('should export requireAdmin as named export', () => {
      expect(typeof requireAdmin).toBe('function');
    });

    it('should allow chaining authMiddleware + requireAdmin', async () => {
      const adminUser = {
        _id: 'admin-1',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
      };

      req.headers.authorization = 'Bearer admin-token';
      verifyAccessToken.mockReturnValue({ sub: 'admin-1' });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(adminUser),
      });

      // Simulate the chain: authMiddleware → requireAdmin
      await authMiddleware(req, res, (err) => {
        if (err) return;
        requireAdmin(req, res, next);
      });

      expect(req.user).toEqual(adminUser);
      expect(next).toHaveBeenCalled();
    });

    it('should block non-admin in chained middleware', async () => {
      const regularUser = {
        _id: 'user-1',
        name: 'Regular User',
        role: 'user',
        isActive: true,
      };

      req.headers.authorization = 'Bearer user-token';
      verifyAccessToken.mockReturnValue({ sub: 'user-1' });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(regularUser),
      });

      // Simulate the chain: authMiddleware → requireAdmin
      await authMiddleware(req, res, (err) => {
        if (err) return;
        requireAdmin(req, res, next);
      });

      // requireAdmin should block
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should block banned admin in chained middleware', async () => {
      const bannedAdmin = {
        _id: 'admin-banned',
        name: 'Banned Admin',
        role: 'admin',
        isActive: false,
      };

      req.headers.authorization = 'Bearer admin-token';
      verifyAccessToken.mockReturnValue({ sub: 'admin-banned' });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(bannedAdmin),
      });

      await authMiddleware(req, res, (err) => {
        if (err) return;
        requireAdmin(req, res, next);
      });

      // authMiddleware should block before requireAdmin
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ACCOUNT_BANNED' })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
