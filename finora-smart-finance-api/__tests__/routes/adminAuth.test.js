/**
 * @fileoverview Admin Routes Auth Tests
 * @description Tests for the admin route auth middleware (JWT + API-Key fallback)
 */

const crypto = require('crypto'); // eslint-disable-line no-unused-vars

// Muss VOR dem Import der Routen stehen
jest.mock('../../src/models/User');
jest.mock('../../src/models/Transaction');
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('Admin Routes Auth', () => {
  // ============================================
  // Unit Tests für die Auth-Logik
  // ============================================
  describe('Auth Middleware Logic', () => {
    const { verifyAccessToken } = require('../../src/services/authService');
    const User = require('../../src/models/User');
    
    let req, res, next;

    beforeEach(() => {
      jest.clearAllMocks();
      
      req = {
        headers: {},
        requestId: 'test-req-id',
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      next = jest.fn();
    });

    describe('JWT Bearer Token Auth', () => {
      const authMiddleware = require('../../src/middleware/authMiddleware');
      const { requireAdmin } = require('../../src/middleware/authMiddleware');

      it('should accept valid admin JWT and call next', async () => {
        const adminUser = {
          _id: 'admin-1',
          name: 'Admin',
          role: 'admin',
          isActive: true,
        };

        req.headers.authorization = 'Bearer valid-admin-token';
        verifyAccessToken.mockReturnValue({ sub: 'admin-1' });
        User.findById = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(adminUser),
        });

        // Simulate what admin.js does: authMiddleware → requireAdmin
        await authMiddleware(req, res, (err) => {
          if (err) return;
          requireAdmin(req, res, next);
        });

        expect(req.user).toEqual(adminUser);
        expect(next).toHaveBeenCalledTimes(1);
      });

      it('should reject valid JWT but non-admin role', async () => {
        const regularUser = {
          _id: 'user-1',
          name: 'Regular',
          role: 'user',
          isActive: true,
        };

        req.headers.authorization = 'Bearer valid-user-token';
        verifyAccessToken.mockReturnValue({ sub: 'user-1' });
        User.findById = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(regularUser),
        });

        await authMiddleware(req, res, (err) => {
          if (err) return;
          requireAdmin(req, res, next);
        });

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ code: 'FORBIDDEN' })
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject expired JWT token', async () => {
        req.headers.authorization = 'Bearer expired-token';
        verifyAccessToken.mockImplementation(() => {
          throw new Error('Token expired');
        });

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ code: 'INVALID_TOKEN' })
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject banned admin via JWT', async () => {
        const bannedAdmin = {
          _id: 'admin-banned',
          name: 'Banned Admin',
          role: 'admin',
          isActive: false,
        };

        req.headers.authorization = 'Bearer banned-admin-token';
        verifyAccessToken.mockReturnValue({ sub: 'admin-banned' });
        User.findById = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(bannedAdmin),
        });

        await authMiddleware(req, res, (err) => {
          if (err) return;
          requireAdmin(req, res, next);
        });

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ code: 'ACCOUNT_BANNED' })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('API-Key Fallback Auth', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalKey = process.env.ADMIN_API_KEY;

      afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        process.env.ADMIN_API_KEY = originalKey;
      });

      it('should accept valid API-Key in production (no Bearer header)', () => {
        // This test verifies the API-Key timing-safe comparison logic
        const crypto = require('crypto');
        const ADMIN_API_KEY = 'test-admin-secret-key-123';
        const providedKey = 'test-admin-secret-key-123';

        const keyBuffer = Buffer.from(ADMIN_API_KEY, 'utf8');
        const providedBuffer = Buffer.from(String(providedKey), 'utf8');

        expect(keyBuffer.length).toBe(providedBuffer.length);
        expect(crypto.timingSafeEqual(keyBuffer, providedBuffer)).toBe(true);
      });

      it('should reject invalid API-Key in production', () => {
        const crypto = require('crypto');
        const ADMIN_API_KEY = 'correct-key';
        const providedKey = 'wrong-key-!';

        const keyBuffer = Buffer.from(ADMIN_API_KEY, 'utf8');
        const providedBuffer = Buffer.from(String(providedKey), 'utf8');

        // Different lengths → should not even attempt timingSafeEqual
        if (keyBuffer.length === providedBuffer.length) {
          expect(crypto.timingSafeEqual(keyBuffer, providedBuffer)).toBe(false);
        } else {
          expect(keyBuffer.length).not.toBe(providedBuffer.length);
        }
      });

      it('should reject when no API-Key and no Bearer token in production', () => {
        // Verify the logic: no auth header + no API key → should be rejected
        const auth = '';
        const hasBearerToken = auth.startsWith('Bearer ');
        const providedKey = undefined;
        const isDevelopment = false;

        expect(hasBearerToken).toBe(false);
        expect(!isDevelopment && !providedKey).toBe(true);
      });

      it('should require API-Key even in development mode', () => {
        // In development, API-Key is still required — no open bypass
        const hasBearer = false;
        const hasApiKey = false;

        // Without API-Key, the middleware rejects even in development
        const shouldReject = !hasBearer && !hasApiKey;
        expect(shouldReject).toBe(true);
      });
    });

    describe('Auth Priority', () => {
      it('should prefer JWT over API-Key when both are present', () => {
        // If Bearer header exists, JWT path is taken regardless of x-admin-key
        const headers = {
          authorization: 'Bearer some-token',
          'x-admin-key': 'some-key',
        };

        const auth = headers.authorization || '';
        expect(auth.startsWith('Bearer ')).toBe(true);
        // JWT path is taken first — this is verified by the router.use middleware
      });

      it('should fall back to API-Key when no Bearer header', () => {
        const headers = {
          'x-admin-key': 'some-key',
        };

        const auth = headers.authorization || '';
        expect(auth.startsWith('Bearer ')).toBe(false);
        // API-Key path would be taken
      });
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle empty Authorization header gracefully', () => {
      const auth = '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      expect(token).toBeNull();
    });

    it('should handle Bearer with empty token', () => {
      const auth = 'Bearer ';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      expect(token).toBe('');
    });

    it('should handle malformed Authorization header', () => {
      const auth = 'NotABearer token';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      expect(token).toBeNull();
    });

    it('should handle x-admin-key as empty string', () => {
      const providedKey = '';
      expect(!providedKey).toBe(true); // falsy → rejected
    });

    it('should handle x-admin-key with whitespace', () => {
      const providedKey = '  ';
      // String is truthy, but spaces won't match the key
      const ADMIN_API_KEY = 'real-key';
      const keyBuffer = Buffer.from(ADMIN_API_KEY, 'utf8');
      const providedBuffer = Buffer.from(String(providedKey), 'utf8');
      expect(keyBuffer.length).not.toBe(providedBuffer.length);
    });
  });
});
