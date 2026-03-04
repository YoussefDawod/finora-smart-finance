/**
 * @fileoverview Auth Service Unit Tests
 * @description Tests für JWT-Signing, Verification, Algorithm-Enforcement und Token-Handling
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock config vor dem Import von authService
jest.mock('../../src/config/env', () => ({
  jwt: {
    secret: 'test-secret-key',
    accessExpire: 3600,
    refreshExpire: 604800,
  },
}));

const authService = require('../../src/services/authService');

describe('AuthService', () => {
  // ============================================
  // JWT_ALGORITHM Konstante
  // ============================================
  describe('JWT_ALGORITHM', () => {
    it('should export JWT_ALGORITHM as HS256', () => {
      expect(authService.JWT_ALGORITHM).toBe('HS256');
    });

    it('should be a string', () => {
      expect(typeof authService.JWT_ALGORITHM).toBe('string');
    });
  });

  // ============================================
  // signAccessToken
  // ============================================
  describe('signAccessToken', () => {
    const mockUser = {
      _id: { toString: () => 'user-123' },
      name: 'Max Mustermann',
      email: 'max@example.com',
      role: 'user',
    };

    it('should return a valid JWT string', () => {
      const token = authService.signAccessToken(mockUser);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature
    });

    it('should sign with HS256 algorithm', () => {
      const token = authService.signAccessToken(mockUser);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header.alg).toBe('HS256');
    });

    it('should include correct payload claims', () => {
      const token = authService.signAccessToken(mockUser);
      const payload = jwt.verify(token, 'test-secret-key', { algorithms: ['HS256'] });

      expect(payload.sub).toBe('user-123');
      expect(payload.name).toBe('Max Mustermann');
      expect(payload.role).toBe('user');
      // email wird bewusst NICHT im JWT gespeichert (H-9: Datensparsamkeit)
      expect(payload.email).toBeUndefined();
    });

    it('should not include email in JWT payload (data minimization)', () => {
      const token = authService.signAccessToken(mockUser);
      const payload = jwt.verify(token, 'test-secret-key', { algorithms: ['HS256'] });

      // JWT ist base64-encoded (nicht verschlüsselt) — keine sensiblen Daten speichern
      expect(payload.email).toBeUndefined();
    });

    it('should include role claim defaulting to user', () => {
      const userNoRole = { _id: { toString: () => 'user-no-role' }, name: 'NoRole', email: null };
      const token = authService.signAccessToken(userNoRole);
      const payload = jwt.verify(token, 'test-secret-key', { algorithms: ['HS256'] });

      expect(payload.role).toBe('user');
    });

    it('should include admin role when user is admin', () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const token = authService.signAccessToken(adminUser);
      const payload = jwt.verify(token, 'test-secret-key', { algorithms: ['HS256'] });

      expect(payload.role).toBe('admin');
    });

    it('should include expiration claim', () => {
      const token = authService.signAccessToken(mockUser);
      const payload = jwt.verify(token, 'test-secret-key', { algorithms: ['HS256'] });

      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect(payload.exp - payload.iat).toBe(3600);
    });

    it('should NOT use "none" algorithm', () => {
      const token = authService.signAccessToken(mockUser);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header.alg).not.toBe('none');
    });
  });

  // ============================================
  // verifyAccessToken
  // ============================================
  describe('verifyAccessToken', () => {
    const mockUser = {
      _id: { toString: () => 'user-456' },
      name: 'Test User',
      email: 'test@example.com',
    };

    it('should verify a valid HS256-signed token', () => {
      const token = authService.signAccessToken(mockUser);
      const payload = authService.verifyAccessToken(token);

      expect(payload.sub).toBe('user-456');
      expect(payload.name).toBe('Test User');
      // email nicht im Payload (Datensparsamkeit)
      expect(payload.email).toBeUndefined();
    });

    it('should reject tokens signed with wrong secret', () => {
      const token = jwt.sign(
        { sub: 'user-456' },
        'wrong-secret',
        { algorithm: 'HS256', expiresIn: 3600 }
      );

      expect(() => authService.verifyAccessToken(token)).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject expired tokens', () => {
      const token = jwt.sign(
        { sub: 'user-456' },
        'test-secret-key',
        { algorithm: 'HS256', expiresIn: -1 }
      );

      expect(() => authService.verifyAccessToken(token)).toThrow(jwt.TokenExpiredError);
    });

    it('should reject tokens with "none" algorithm (Algorithm Confusion Attack)', () => {
      // Manuell einen unsignierten Token mit "none"-Algorithmus erstellen
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'hacker-123', name: 'Hacker' })).toString('base64url');
      const unsignedToken = `${header}.${payload}.`;

      expect(() => authService.verifyAccessToken(unsignedToken)).toThrow();
    });

    it('should reject tokens signed with HS384 algorithm', () => {
      const token = jwt.sign(
        { sub: 'user-456' },
        'test-secret-key',
        { algorithm: 'HS384', expiresIn: 3600 }
      );

      expect(() => authService.verifyAccessToken(token)).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject tokens signed with HS512 algorithm', () => {
      const token = jwt.sign(
        { sub: 'user-456' },
        'test-secret-key',
        { algorithm: 'HS512', expiresIn: 3600 }
      );

      expect(() => authService.verifyAccessToken(token)).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject malformed tokens', () => {
      expect(() => authService.verifyAccessToken('not-a-jwt')).toThrow();
      expect(() => authService.verifyAccessToken('')).toThrow();
      expect(() => authService.verifyAccessToken('a.b')).toThrow();
    });

    it('should reject tampered tokens', () => {
      const token = authService.signAccessToken(mockUser);
      // Payload manipulieren (ein Zeichen ändern)
      const parts = token.split('.');
      parts[1] = parts[1].slice(0, -1) + (parts[1].slice(-1) === 'A' ? 'B' : 'A');
      const tamperedToken = parts.join('.');

      expect(() => authService.verifyAccessToken(tamperedToken)).toThrow();
    });

    it('should return payload with iat and exp claims', () => {
      const token = authService.signAccessToken(mockUser);
      const payload = authService.verifyAccessToken(token);

      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(typeof payload.iat).toBe('number');
      expect(typeof payload.exp).toBe('number');
    });
  });

  // ============================================
  // signAccessToken + verifyAccessToken Roundtrip
  // ============================================
  describe('Sign → Verify Roundtrip', () => {
    it('should produce a token that verifyAccessToken accepts', () => {
      const mockUser = {
        _id: { toString: () => 'roundtrip-user' },
        name: 'Roundtrip',
        email: 'roundtrip@test.com',
        role: 'user',
      };

      const token = authService.signAccessToken(mockUser);
      const payload = authService.verifyAccessToken(token);

      expect(payload.sub).toBe('roundtrip-user');
      expect(payload.name).toBe('Roundtrip');
      expect(payload.role).toBe('user');
    });
  });

  // ============================================
  // generateRefreshToken
  // ============================================
  describe('generateRefreshToken', () => {
    it('should return a hex string', () => {
      const token = authService.generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should return 64 character hex string (32 bytes)', () => {
      const token = authService.generateRefreshToken();
      expect(token).toHaveLength(64);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set(Array.from({ length: 10 }, () => authService.generateRefreshToken()));
      expect(tokens.size).toBe(10);
    });
  });

  // ============================================
  // hashToken
  // ============================================
  describe('hashToken', () => {
    it('should return a SHA256 hash', () => {
      const hash = authService.hashToken('test-token');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64); // SHA256 = 64 hex chars
    });

    it('should produce consistent hashes', () => {
      const hash1 = authService.hashToken('same-token');
      const hash2 = authService.hashToken('same-token');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = authService.hashToken('token-a');
      const hash2 = authService.hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  // ============================================
  // sanitizeUserForAuth
  // ============================================
  describe('sanitizeUserForAuth', () => {
    const mockUser = {
      _id: { toString: () => 'user-789' },
      email: 'max@example.com',
      name: 'Max',
      isVerified: true,
      role: 'user',
      isActive: true,
      understoodNoEmailReset: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
      passwordHash: 'should-not-appear',
      refreshTokens: ['should-not-appear'],
    };

    it('should return safe user data without sensitive fields', () => {
      const sanitized = authService.sanitizeUserForAuth(mockUser);

      expect(sanitized.id).toBe('user-789');
      expect(sanitized.name).toBe('Max');
      expect(sanitized.email).toBe('max@example.com');
      expect(sanitized.isVerified).toBe(true);
      expect(sanitized.role).toBe('user');
      expect(sanitized.isActive).toBe(true);
      expect(sanitized.hasEmail).toBe(true);
      expect(sanitized.canResetPassword).toBe(true);
      expect(sanitized.passwordHash).toBeUndefined();
      expect(sanitized.refreshTokens).toBeUndefined();
    });

    it('should set hasEmail to false when no email', () => {
      const noEmailUser = { ...mockUser, email: null };
      const sanitized = authService.sanitizeUserForAuth(noEmailUser);

      expect(sanitized.hasEmail).toBe(false);
      expect(sanitized.email).toBeNull();
      expect(sanitized.canResetPassword).toBe(false);
    });

    it('should set canResetPassword to false when not verified', () => {
      const unverifiedUser = { ...mockUser, isVerified: false };
      const sanitized = authService.sanitizeUserForAuth(unverifiedUser);

      expect(sanitized.canResetPassword).toBe(false);
    });

    it('should default role to user when undefined', () => {
      const noRoleUser = { ...mockUser, role: undefined };
      const sanitized = authService.sanitizeUserForAuth(noRoleUser);

      expect(sanitized.role).toBe('user');
    });

    it('should default isActive to true when undefined', () => {
      const noActiveUser = { ...mockUser, isActive: undefined };
      const sanitized = authService.sanitizeUserForAuth(noActiveUser);

      expect(sanitized.isActive).toBe(true);
    });

    it('should show isActive false when user is banned', () => {
      const bannedUser = { ...mockUser, isActive: false };
      const sanitized = authService.sanitizeUserForAuth(bannedUser);

      expect(sanitized.isActive).toBe(false);
    });
  });

  // ============================================
  // validateRefreshToken
  // ============================================
  describe('validateRefreshToken', () => {
    it('should validate a matching non-expired token', () => {
      const rawToken = 'test-refresh-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockUser = {
        refreshTokens: [
          { tokenHash, expiresAt: new Date(Date.now() + 60000) },
        ],
      };

      const result = authService.validateRefreshToken(mockUser, rawToken);
      expect(result.valid).toBe(true);
      expect(result.stored).toBeDefined();
    });

    it('should reject a non-matching token', () => {
      const mockUser = {
        refreshTokens: [
          { tokenHash: 'different-hash', expiresAt: new Date(Date.now() + 60000) },
        ],
      };

      const result = authService.validateRefreshToken(mockUser, 'wrong-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject an expired token', () => {
      const rawToken = 'expired-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockUser = {
        refreshTokens: [
          { tokenHash, expiresAt: new Date(Date.now() - 60000) },
        ],
      };

      const result = authService.validateRefreshToken(mockUser, rawToken);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('abgelaufen');
    });
  });

  // ============================================
  // buildAuthResponse
  // ============================================
  describe('buildAuthResponse', () => {
    it('should build a complete auth response', () => {
      const tokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresIn: 3600,
      };

      const user = {
        _id: { toString: () => 'user-123' },
        email: 'test@test.com',
        name: 'Test',
        isVerified: true,
        understoodNoEmailReset: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = authService.buildAuthResponse(tokens, user);

      expect(response.accessToken).toBe('access-123');
      expect(response.refreshToken).toBe('refresh-456');
      expect(response.expiresIn).toBe(3600);
      expect(response.user).toBeDefined();
      expect(response.user.id).toBe('user-123');
    });
  });

  // ============================================
  // Exported Constants
  // ============================================
  describe('Exported Constants', () => {
    it('should export ACCESS_TTL_SECONDS', () => {
      expect(authService.ACCESS_TTL_SECONDS).toBe(3600);
    });

    it('should export REFRESH_TTL_SECONDS', () => {
      expect(authService.REFRESH_TTL_SECONDS).toBe(604800);
    });
  });
});
