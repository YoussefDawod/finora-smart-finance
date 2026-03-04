/**
 * @fileoverview Transaction Quota Middleware Tests
 * @description Unit-Tests für das monatliche Transaktionslimit (150/Monat)
 *              mit atomarem Check+Increment und Fail-Closed
 */

const {
  transactionQuota,
  rollbackQuotaReservation,
  incrementTransactionCount,
  decrementTransactionCount,
  getQuotaStatus,
  MONTHLY_TRANSACTION_LIMIT,
  isNewMonth,
  getNextMonthReset,
  getCurrentMonthStart,
} = require('../../src/middleware/transactionQuota');

// Mock User Model
const User = require('../../src/models/User');
jest.mock('../../src/models/User');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('TransactionQuota', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 0,
          monthlyCountResetAt: new Date(),
        },
      },
      requestId: 'test-request-id',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  // ============================================
  // Helper Functions
  // ============================================
  describe('isNewMonth', () => {
    it('should return true when resetDate is null', () => {
      expect(isNewMonth(null)).toBe(true);
    });

    it('should return true when resetDate is undefined', () => {
      expect(isNewMonth(undefined)).toBe(true);
    });

    it('should return false when resetDate is in current month', () => {
      const now = new Date();
      expect(isNewMonth(now)).toBe(false);
    });

    it('should return true when resetDate is in a previous month', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(isNewMonth(lastMonth)).toBe(true);
    });

    it('should return true when resetDate is in a previous year', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      expect(isNewMonth(lastYear)).toBe(true);
    });

    it('should return false for date at start of current month', () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      expect(isNewMonth(startOfMonth)).toBe(false);
    });
  });

  describe('getNextMonthReset', () => {
    it('should return the first day of next month', () => {
      const result = getNextMonthReset();
      const now = new Date();
      const expectedMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
      const expectedYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

      expect(result.getUTCDate()).toBe(1);
      expect(result.getUTCMonth()).toBe(expectedMonth);
      expect(result.getUTCFullYear()).toBe(expectedYear);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
    });

    it('should return a date in the future', () => {
      const result = getNextMonthReset();
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getCurrentMonthStart', () => {
    it('should return the first day of the current month at UTC midnight', () => {
      const result = getCurrentMonthStart();
      const now = new Date();

      expect(result.getUTCDate()).toBe(1);
      expect(result.getUTCMonth()).toBe(now.getMonth());
      expect(result.getUTCFullYear()).toBe(now.getFullYear());
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
    });
  });

  describe('MONTHLY_TRANSACTION_LIMIT', () => {
    it('should be 150', () => {
      expect(MONTHLY_TRANSACTION_LIMIT).toBe(150);
    });
  });

  // ============================================
  // transactionQuota Middleware (Atomic)
  // ============================================
  describe('transactionQuota middleware', () => {
    it('should atomically reserve a slot and call next() when under limit', async () => {
      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: {
          monthlyTransactionCount: 51,
          monthlyCountResetAt: new Date(),
        },
      });

      await transactionQuota(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.quotaReserved).toBe(true);
      expect(req.quotaSnapshot).toEqual(
        expect.objectContaining({
          used: 51,
          limit: 150,
          remaining: 99,
        })
      );
    });

    it('should set quotaSnapshot with correct values', async () => {
      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: {
          monthlyTransactionCount: 1,
          monthlyCountResetAt: new Date(),
        },
      });

      await transactionQuota(req, res, next);

      expect(req.quotaSnapshot).toEqual({
        used: 1,
        limit: 150,
        remaining: 149,
        resetDate: expect.any(String),
        isLimitReached: false,
      });
    });

    it('should reset and reserve when new month (Attempt 2)', async () => {
      // Attempt 1 fails (no match for same month)
      User.findOneAndUpdate.mockResolvedValueOnce(null);
      // Attempt 2 succeeds (new month reset)
      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: {
          monthlyTransactionCount: 1,
          monthlyCountResetAt: new Date(),
        },
      });

      await transactionQuota(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.quotaReserved).toBe(true);
      expect(req.quotaSnapshot.used).toBe(1);
      expect(User.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('should block with 429 when limit reached (both attempts fail)', async () => {
      // Both atomic attempts return null → limit reached
      User.findOneAndUpdate
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      // findById for current count
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            transactionLifecycle: { monthlyTransactionCount: 150 },
          }),
        }),
      });

      await transactionQuota(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'TRANSACTION_QUOTA_EXCEEDED',
          details: expect.objectContaining({
            limit: 150,
            used: 150,
            resetDate: expect.any(String),
          }),
        })
      );
    });

    it('should use atomic $inc with $lt guard in first attempt', async () => {
      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: {
          monthlyTransactionCount: 1,
          monthlyCountResetAt: new Date(),
        },
      });

      await transactionQuota(req, res, next);

      const firstCall = User.findOneAndUpdate.mock.calls[0];
      // Filter has $lt condition for race-condition prevention
      expect(firstCall[0]).toEqual(
        expect.objectContaining({
          _id: 'user-123',
          'transactionLifecycle.monthlyTransactionCount': { $lt: 150 },
        })
      );
      // Update uses atomic $inc
      expect(firstCall[1]).toEqual({
        $inc: { 'transactionLifecycle.monthlyTransactionCount': 1 },
      });
      // Returns new document
      expect(firstCall[2]).toEqual({ new: true });
    });

    it('should return 401 when no user on request', async () => {
      req.user = null;

      await transactionQuota(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'AUTH_REQUIRED',
        })
      );
    });

    it('should fail-closed with 500 on DB errors (NOT fail-open)', async () => {
      User.findOneAndUpdate.mockRejectedValueOnce(new Error('DB connection lost'));

      await transactionQuota(req, res, next);

      // MUST NOT call next (fail-closed, not fail-open)
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'QUOTA_CHECK_FAILED',
        })
      );
    });

    it('should include future resetDate in 429 response', async () => {
      User.findOneAndUpdate
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            transactionLifecycle: { monthlyTransactionCount: 150 },
          }),
        }),
      });

      await transactionQuota(req, res, next);

      const response = res.json.mock.calls[0][0];
      const resetDate = new Date(response.details.resetDate);
      expect(resetDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle user without transactionLifecycle (legacy user)', async () => {
      req.user.transactionLifecycle = undefined;

      // Attempt 1 fails, Attempt 2 succeeds (new month for legacy user)
      User.findOneAndUpdate
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          transactionLifecycle: {
            monthlyTransactionCount: 1,
            monthlyCountResetAt: new Date(),
          },
        });

      await transactionQuota(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.quotaReserved).toBe(true);
    });

    it('should mark isLimitReached true at exactly 150', async () => {
      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: {
          monthlyTransactionCount: 150,
          monthlyCountResetAt: new Date(),
        },
      });

      await transactionQuota(req, res, next);

      expect(req.quotaSnapshot.isLimitReached).toBe(true);
      expect(req.quotaSnapshot.remaining).toBe(0);
    });
  });

  // ============================================
  // rollbackQuotaReservation
  // ============================================
  describe('rollbackQuotaReservation', () => {
    it('should atomically decrement quota with $gt: 0 guard', async () => {
      User.findOneAndUpdate.mockResolvedValueOnce({});

      await rollbackQuotaReservation('user-123');

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: 'user-123',
          'transactionLifecycle.monthlyTransactionCount': { $gt: 0 },
        },
        {
          $inc: { 'transactionLifecycle.monthlyTransactionCount': -1 },
        }
      );
    });

    it('should not throw on DB error', async () => {
      User.findOneAndUpdate.mockRejectedValueOnce(new Error('DB error'));

      await expect(rollbackQuotaReservation('user-123')).resolves.not.toThrow();
    });
  });

  // ============================================
  // incrementTransactionCount (Atomic)
  // ============================================
  describe('incrementTransactionCount', () => {
    it('should atomically increment count with $inc', async () => {
      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 5,
          monthlyCountResetAt: new Date(),
        },
      };

      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: { monthlyTransactionCount: 6 },
      });

      const result = await incrementTransactionCount(user);

      expect(result).toBe(6);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'user-123' },
        { $inc: { 'transactionLifecycle.monthlyTransactionCount': 1 } },
        { new: true }
      );
    });

    it('should reset and set to 1 when new month', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 120,
          monthlyCountResetAt: lastMonth,
        },
      };

      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: { monthlyTransactionCount: 1 },
      });

      const result = await incrementTransactionCount(user);

      expect(result).toBe(1);
      const call = User.findOneAndUpdate.mock.calls[0];
      expect(call[1]).toEqual(
        expect.objectContaining({
          $set: expect.objectContaining({
            'transactionLifecycle.monthlyTransactionCount': 1,
          }),
        })
      );
    });

    it('should handle user without transactionLifecycle', async () => {
      const user = {
        _id: 'user-123',
        transactionLifecycle: undefined,
      };

      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: { monthlyTransactionCount: 1 },
      });

      const result = await incrementTransactionCount(user);

      expect(result).toBe(1);
    });

    it('should return -1 on DB error without throwing', async () => {
      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 5,
          monthlyCountResetAt: new Date(),
        },
      };

      User.findOneAndUpdate.mockRejectedValueOnce(new Error('DB error'));

      const result = await incrementTransactionCount(user);

      expect(result).toBe(-1);
    });
  });

  // ============================================
  // decrementTransactionCount (Atomic)
  // ============================================
  describe('decrementTransactionCount', () => {
    it('should atomically decrement when transaction is from current month', async () => {
      const now = new Date();
      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 10,
          monthlyCountResetAt: now,
        },
      };

      User.findOneAndUpdate.mockResolvedValueOnce({
        transactionLifecycle: { monthlyTransactionCount: 9 },
      });

      const result = await decrementTransactionCount(user, now);

      expect(result).toBe(9);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: 'user-123',
          'transactionLifecycle.monthlyTransactionCount': { $gt: 0 },
        },
        {
          $inc: { 'transactionLifecycle.monthlyTransactionCount': -1 },
        },
        { new: true }
      );
    });

    it('should not decrement when transaction is from a different month', async () => {
      const now = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 10,
          monthlyCountResetAt: now,
        },
      };

      const result = await decrementTransactionCount(user, lastMonth);

      expect(result).toBe(10);
      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should return current count when no resetAt date', async () => {
      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 10,
          monthlyCountResetAt: null,
        },
      };

      const result = await decrementTransactionCount(user, new Date());

      expect(result).toBe(10);
      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should return current count when no transactionCreatedAt', async () => {
      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 10,
          monthlyCountResetAt: new Date(),
        },
      };

      const result = await decrementTransactionCount(user, null);

      expect(result).toBe(10);
      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should return -1 on DB error without throwing', async () => {
      const now = new Date();
      const user = {
        _id: 'user-123',
        transactionLifecycle: {
          monthlyTransactionCount: 10,
          monthlyCountResetAt: now,
        },
      };

      User.findOneAndUpdate.mockRejectedValueOnce(new Error('DB error'));

      const result = await decrementTransactionCount(user, now);

      expect(result).toBe(-1);
    });
  });

  // ============================================
  // getQuotaStatus
  // ============================================
  describe('getQuotaStatus', () => {
    it('should return correct status with 0 transactions', () => {
      const user = {
        transactionLifecycle: {
          monthlyTransactionCount: 0,
          monthlyCountResetAt: new Date(),
        },
      };

      const status = getQuotaStatus(user);

      expect(status).toEqual({
        used: 0,
        limit: 150,
        remaining: 150,
        resetDate: expect.any(String),
        isLimitReached: false,
      });
    });

    it('should return correct status with 100 transactions', () => {
      const user = {
        transactionLifecycle: {
          monthlyTransactionCount: 100,
          monthlyCountResetAt: new Date(),
        },
      };

      const status = getQuotaStatus(user);

      expect(status).toEqual({
        used: 100,
        limit: 150,
        remaining: 50,
        resetDate: expect.any(String),
        isLimitReached: false,
      });
    });

    it('should show limit reached at 150', () => {
      const user = {
        transactionLifecycle: {
          monthlyTransactionCount: 150,
          monthlyCountResetAt: new Date(),
        },
      };

      const status = getQuotaStatus(user);

      expect(status.used).toBe(150);
      expect(status.remaining).toBe(0);
      expect(status.isLimitReached).toBe(true);
    });

    it('should show 0 used when new month (not yet reset)', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const user = {
        transactionLifecycle: {
          monthlyTransactionCount: 130,
          monthlyCountResetAt: lastMonth,
        },
      };

      const status = getQuotaStatus(user);

      expect(status.used).toBe(0);
      expect(status.remaining).toBe(150);
      expect(status.isLimitReached).toBe(false);
    });

    it('should handle user without transactionLifecycle', () => {
      const user = {};

      const status = getQuotaStatus(user);

      expect(status.used).toBe(0);
      expect(status.limit).toBe(150);
      expect(status.remaining).toBe(150);
      expect(status.isLimitReached).toBe(false);
    });

    it('should include a valid future resetDate', () => {
      const user = {
        transactionLifecycle: {
          monthlyTransactionCount: 50,
          monthlyCountResetAt: new Date(),
        },
      };

      const status = getQuotaStatus(user);
      const resetDate = new Date(status.resetDate);

      expect(resetDate.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
