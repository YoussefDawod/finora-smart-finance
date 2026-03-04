/**
 * @fileoverview Error Handler Tests
 * @description Tests für zentrale API-Fehlerbehandlung
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseApiError,
  getErrorMessage,
  logError,
  isUnauthorized,
  isForbidden,
  isNetworkError,
} from '@/api/errorHandler';

// ============================================================================
// MOCK i18next
// ============================================================================
vi.mock('i18next', () => ({
  default: { t: (key) => key },
}));

// ============================================================================
// TESTS
// ============================================================================
describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // parseApiError
  // ──────────────────────────────────────────────────────────
  describe('parseApiError', () => {
    it('returns NETWORK_ERROR when no response', () => {
      const result = parseApiError({ message: 'Network Error' });
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.status).toBe(0);
      expect(result.message).toBe('errors.networkError');
    });

    it('returns TIMEOUT for ECONNABORTED', () => {
      const result = parseApiError({ code: 'ECONNABORTED' });
      expect(result.code).toBe('TIMEOUT');
      expect(result.status).toBe(0);
      expect(result.message).toBe('errors.timeout');
    });

    it('returns NETWORK_ERROR for null/undefined error', () => {
      const result = parseApiError(null);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('returns VALIDATION_ERROR for 422 with details', () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { email: 'invalid' } },
        },
      };
      const result = parseApiError(error);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.status).toBe(422);
      expect(result.details).toEqual({ email: 'invalid' });
      expect(result.message).toContain('errors.validationError');
    });

    it('returns VALIDATION_ERROR for 422 without details', () => {
      const error = { response: { status: 422, data: {} } };
      const result = parseApiError(error);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('errors.validationError');
    });

    it('returns AUTH_ERROR for 401', () => {
      const error = { response: { status: 401, data: {} } };
      const result = parseApiError(error);
      expect(result.code).toBe('AUTH_ERROR');
      expect(result.status).toBe(401);
    });

    it('returns FORBIDDEN for 403', () => {
      const error = { response: { status: 403, data: {} } };
      const result = parseApiError(error);
      expect(result.code).toBe('FORBIDDEN');
      expect(result.status).toBe(403);
    });

    it('returns NOT_FOUND for 404', () => {
      const error = { response: { status: 404, data: {} } };
      const result = parseApiError(error);
      expect(result.code).toBe('NOT_FOUND');
      expect(result.status).toBe(404);
    });

    it('returns SERVER_ERROR for 500', () => {
      const error = { response: { status: 500, data: {} } };
      const result = parseApiError(error);
      expect(result.code).toBe('SERVER_ERROR');
      expect(result.status).toBe(500);
    });

    it('returns SERVER_ERROR for 503', () => {
      const error = { response: { status: 503, data: {} } };
      const result = parseApiError(error);
      expect(result.code).toBe('SERVER_ERROR');
      expect(result.status).toBe(503);
    });

    it('returns UNKNOWN_ERROR with sanitized fallback for unhandled status (L-11)', () => {
      const error = {
        response: { status: 418, data: { message: "I'm a teapot" } },
      };
      const result = parseApiError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
      // L-11: Raw server messages are no longer exposed — always uses i18n fallback
      expect(result.message).toBe('errors.unexpectedError');
      expect(result.status).toBe(418);
    });

    it('returns UNKNOWN_ERROR with fallback for unhandled status without message', () => {
      const error = { response: { status: 418, data: {} } };
      const result = parseApiError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('errors.unexpectedError');
    });

    it('returns sanitized fallback when data.error is present but no known code (L-11)', () => {
      const error = {
        response: { status: 418, data: { error: 'Custom error' } },
      };
      const result = parseApiError(error);
      // L-11: Raw server messages are no longer exposed
      expect(result.message).toBe('errors.unexpectedError');
    });

    // ──────────────────────────────────────────────────────────
    // API_ERROR_CODE_MAP tests (L-11)
    // ──────────────────────────────────────────────────────────
    it('maps INVALID_CREDENTIALS code to sanitized i18n message on 401', () => {
      const error = {
        response: { status: 401, data: { code: 'INVALID_CREDENTIALS', message: 'Bad creds' } },
      };
      const result = parseApiError(error);
      expect(result.code).toBe('AUTH_ERROR');
      expect(result.message).toBe('errors.api.invalidCredentials');
    });

    it('maps ACCOUNT_LOCKED code to sanitized i18n message on 401', () => {
      const error = {
        response: { status: 401, data: { code: 'ACCOUNT_LOCKED', message: 'Locked out' } },
      };
      const result = parseApiError(error);
      expect(result.code).toBe('AUTH_ERROR');
      expect(result.message).toBe('errors.api.accountLocked');
    });

    it('maps EMAIL_NOT_VERIFIED code on 403', () => {
      const error = {
        response: { status: 403, data: { code: 'EMAIL_NOT_VERIFIED' } },
      };
      const result = parseApiError(error);
      expect(result.code).toBe('FORBIDDEN');
      expect(result.message).toBe('errors.api.emailNotVerified');
    });

    it('maps NAME_EXISTS code on 400 to sanitized message', () => {
      const error = {
        response: { status: 400, data: { code: 'NAME_EXISTS', message: 'Name taken' } },
      };
      const result = parseApiError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('errors.api.nameExists');
    });

    it('maps EMAIL_EXISTS code on 409 to sanitized message', () => {
      const error = {
        response: { status: 409, data: { code: 'EMAIL_EXISTS', message: 'Email taken' } },
      };
      const result = parseApiError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('errors.api.emailExists');
    });

    it('maps INVALID_TOKEN on 400', () => {
      const error = {
        response: { status: 400, data: { code: 'INVALID_TOKEN', message: 'Token bad' } },
      };
      const result = parseApiError(error);
      expect(result.message).toBe('errors.api.invalidToken');
    });

    it('falls back to generic message for unknown backend code', () => {
      const error = {
        response: { status: 400, data: { code: 'SOME_UNKNOWN_CODE', message: 'secret info' } },
      };
      const result = parseApiError(error);
      expect(result.message).toBe('errors.unexpectedError');
    });
  });

  // ──────────────────────────────────────────────────────────
  // getErrorMessage
  // ──────────────────────────────────────────────────────────
  describe('getErrorMessage', () => {
    it.each([
      ['NETWORK_ERROR', 'errors.networkError'],
      ['TIMEOUT', 'errors.timeout'],
      ['VALIDATION_ERROR', 'errors.validationError'],
      ['AUTH_ERROR', 'errors.authRequired'],
      ['FORBIDDEN', 'errors.forbidden'],
      ['NOT_FOUND', 'errors.notFound'],
      ['SERVER_ERROR', 'errors.serverError'],
      ['UNKNOWN_ERROR', 'errors.unexpectedError'],
    ])('returns correct message for %s', (code, expected) => {
      expect(getErrorMessage(code)).toBe(expected);
    });

    it('returns fallback for unknown code', () => {
      expect(getErrorMessage('INVALID_CODE')).toBe('errors.unexpectedError');
    });
  });

  // ──────────────────────────────────────────────────────────
  // logError
  // ──────────────────────────────────────────────────────────
  describe('logError', () => {
    it('logs error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logError(new Error('test'), { endpoint: '/api/test' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('does not throw with empty context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => logError(new Error('test'))).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Type Check Helpers
  // ──────────────────────────────────────────────────────────
  describe('isUnauthorized', () => {
    it('returns true for 401', () => {
      expect(isUnauthorized({ response: { status: 401 } })).toBe(true);
    });

    it('returns false for other status', () => {
      expect(isUnauthorized({ response: { status: 403 } })).toBe(false);
    });

    it('returns false when no response', () => {
      expect(isUnauthorized({})).toBe(false);
    });

    it('handles null', () => {
      expect(isUnauthorized(null)).toBe(false);
    });
  });

  describe('isForbidden', () => {
    it('returns true for 403', () => {
      expect(isForbidden({ response: { status: 403 } })).toBe(true);
    });

    it('returns false for other status', () => {
      expect(isForbidden({ response: { status: 401 } })).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('returns true when no response', () => {
      expect(isNetworkError({ message: 'Network Error' })).toBe(true);
    });

    it('returns false when response exists', () => {
      expect(isNetworkError({ response: { status: 500 } })).toBe(false);
    });

    it('returns true for null', () => {
      expect(isNetworkError(null)).toBe(true);
    });
  });
});
