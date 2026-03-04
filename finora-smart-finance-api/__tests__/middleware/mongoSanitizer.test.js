/**
 * @fileoverview Mongo Sanitizer Middleware Tests
 * @description Tests for sanitizeObject, hasDangerousKeys and the Express middleware
 */

const {
  sanitizeObject,
  hasDangerousKeys,
  mongoSanitizeMiddleware,
} = require('../../src/middleware/mongoSanitizer');

describe('MongoSanitizer', () => {
  // ============================================
  // sanitizeObject
  // ============================================
  describe('sanitizeObject', () => {
    it('should remove keys starting with $', () => {
      const obj = { $gt: 100, name: 'safe' };
      sanitizeObject(obj);
      expect(obj).toEqual({ name: 'safe' });
    });

    it('should remove keys containing a dot', () => {
      const obj = { 'a.b': 'inject', name: 'safe' };
      sanitizeObject(obj);
      expect(obj).toEqual({ name: 'safe' });
    });

    it('should remove nested dangerous keys recursively', () => {
      const obj = { filter: { $ne: null, role: 'admin' } };
      sanitizeObject(obj);
      expect(obj).toEqual({ filter: { role: 'admin' } });
    });

    it('should handle deeply nested dangerous keys', () => {
      const obj = { a: { b: { $where: 'true' } } };
      sanitizeObject(obj);
      expect(obj).toEqual({ a: { b: {} } });
    });

    it('should leave clean objects untouched', () => {
      const obj = { name: 'Max', age: 30, nested: { ok: true } };
      sanitizeObject(obj);
      expect(obj).toEqual({ name: 'Max', age: 30, nested: { ok: true } });
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => sanitizeObject(null)).not.toThrow();
      expect(() => sanitizeObject(undefined)).not.toThrow();
    });

    it('should handle non-object primitives', () => {
      expect(() => sanitizeObject('string')).not.toThrow();
      expect(() => sanitizeObject(42)).not.toThrow();
    });

    it('should handle empty objects', () => {
      const obj = {};
      sanitizeObject(obj);
      expect(obj).toEqual({});
    });
  });

  // ============================================
  // hasDangerousKeys
  // ============================================
  describe('hasDangerousKeys', () => {
    it('should return true for $ prefixed keys', () => {
      expect(hasDangerousKeys({ $gt: 1 })).toBe(true);
    });

    it('should return true for dot-containing keys', () => {
      expect(hasDangerousKeys({ 'a.b': 'x' })).toBe(true);
    });

    it('should return true for nested dangerous keys', () => {
      expect(hasDangerousKeys({ filter: { $ne: null } })).toBe(true);
    });

    it('should return true for deeply nested dangerous keys', () => {
      expect(hasDangerousKeys({ a: { b: { c: { $regex: '.*' } } } })).toBe(true);
    });

    it('should return false for safe objects', () => {
      expect(hasDangerousKeys({ name: 'Max', age: 30 })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(hasDangerousKeys(null)).toBe(false);
      expect(hasDangerousKeys(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(hasDangerousKeys('string')).toBe(false);
      expect(hasDangerousKeys(42)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(hasDangerousKeys({})).toBe(false);
    });
  });

  // ============================================
  // mongoSanitizeMiddleware (integration)
  // ============================================
  describe('mongoSanitizeMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { body: {}, params: {}, query: {}, ip: '127.0.0.1', path: '/test' };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();
    });

    it('should call next() for clean requests', () => {
      req.body = { name: 'Max' };
      req.query = { page: '1' };
      mongoSanitizeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should sanitize body in-place and call next', () => {
      req.body = { $gt: 1, name: 'safe' };
      mongoSanitizeMiddleware(req, res, next);
      expect(req.body).toEqual({ name: 'safe' });
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize params in-place and call next', () => {
      req.params = { 'a.b': 'inject', id: '123' };
      mongoSanitizeMiddleware(req, res, next);
      expect(req.params).toEqual({ id: '123' });
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 for dangerous query params', () => {
      req.query = { $gt: '100' };
      mongoSanitizeMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid query parameters',
        code: 'INVALID_QUERY',
        requestId: 'N/A',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 for nested dangerous query params', () => {
      req.query = { filter: { $ne: null } };
      mongoSanitizeMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing body/params/query gracefully', () => {
      req = { ip: '127.0.0.1', path: '/test' };
      mongoSanitizeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
