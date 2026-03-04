/**
 * @fileoverview Admin Service Tests
 * @description Unit tests for admin operations: ban, unban, changeRole, getStats, createUser
 */

const adminService = require('../../src/services/adminService');
const User = require('../../src/models/User');
const Transaction = require('../../src/models/Transaction');
const lifecycleService = require('../../src/services/transactionLifecycleService');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/models/Transaction');
jest.mock('../../src/services/transactionLifecycleService');
jest.mock('../../src/services/auditLogService', () => ({
  log: jest.fn().mockResolvedValue(null),
  deleteByUserId: jest.fn().mockResolvedValue(0),
}));
jest.mock('../../src/models/AuditLog', () => ({
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
}));
jest.mock('../../src/middleware/transactionQuota', () => ({
  getQuotaStatus: jest.fn().mockReturnValue({
    used: 42,
    limit: 150,
    remaining: 108,
    resetDate: '2026-04-01T00:00:00.000Z',
    isLimitReached: false,
  }),
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // banUser Tests
  // ============================================
  describe('banUser', () => {
    it('should ban a regular user successfully', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        role: 'user',
        isActive: true,
        bannedAt: null,
        banReason: '',
        refreshTokens: ['token1', 'token2'],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'user-123',
          name: 'Test User',
          role: 'user',
          isActive: false,
          bannedAt: expect.any(Date),
          banReason: 'Spam',
        }),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await adminService.banUser('user-123', 'Spam');

      expect(result.error).toBeUndefined();
      expect(result.user).toBeDefined();
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.banReason).toBe('Spam');
      expect(mockUser.bannedAt).toBeInstanceOf(Date);
      expect(mockUser.refreshTokens).toEqual([]);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should reject banning a non-existent user', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.banUser('non-existent');

      expect(result.error).toBe('User nicht gefunden');
      expect(result.code).toBe('USER_NOT_FOUND');
    });

    it('should reject banning an admin user', async () => {
      const mockAdmin = {
        _id: 'admin-123',
        name: 'Admin',
        role: 'admin',
        isActive: true,
      };

      User.findById = jest.fn().mockResolvedValue(mockAdmin);

      const result = await adminService.banUser('admin-123');

      expect(result.error).toBe('Admin-Accounts können nicht gesperrt werden');
      expect(result.code).toBe('CANNOT_BAN_ADMIN');
    });

    it('should reject banning an already banned user', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Banned User',
        role: 'user',
        isActive: false,
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await adminService.banUser('user-123');

      expect(result.error).toBe('User ist bereits gesperrt');
      expect(result.code).toBe('ALREADY_BANNED');
    });
  });

  // ============================================
  // unbanUser Tests
  // ============================================
  describe('unbanUser', () => {
    it('should unban a banned user successfully', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Banned User',
        isActive: false,
        bannedAt: new Date(),
        banReason: 'Spam',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'user-123',
          name: 'Banned User',
          isActive: true,
          bannedAt: null,
          banReason: '',
        }),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await adminService.unbanUser('user-123');

      expect(result.error).toBeUndefined();
      expect(result.user).toBeDefined();
      expect(mockUser.isActive).toBe(true);
      expect(mockUser.bannedAt).toBeNull();
      expect(mockUser.banReason).toBe('');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should reject unbanning a non-existent user', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.unbanUser('non-existent');

      expect(result.error).toBe('User nicht gefunden');
      expect(result.code).toBe('USER_NOT_FOUND');
    });

    it('should reject unbanning a user that is not banned', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Active User',
        isActive: true,
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await adminService.unbanUser('user-123');

      expect(result.error).toBe('User ist nicht gesperrt');
      expect(result.code).toBe('NOT_BANNED');
    });
  });

  // ============================================
  // changeUserRole Tests
  // ============================================
  describe('changeUserRole', () => {
    it('should change user role to admin', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Regular User',
        role: 'user',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'user-123',
          name: 'Regular User',
          role: 'admin',
        }),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await adminService.changeUserRole('user-123', 'admin', 'admin-999');

      expect(result.error).toBeUndefined();
      expect(result.user).toBeDefined();
      expect(mockUser.role).toBe('admin');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should change admin role to user', async () => {
      const mockUser = {
        _id: 'admin-123',
        name: 'Admin User',
        role: 'admin',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'admin-123',
          name: 'Admin User',
          role: 'user',
        }),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      User.countDocuments = jest.fn().mockResolvedValue(2); // Mehr als 1 Admin

      const result = await adminService.changeUserRole('admin-123', 'user', 'admin-999');

      expect(result.error).toBeUndefined();
      expect(mockUser.role).toBe('user');
    });

    it('should reject invalid role', async () => {
      const result = await adminService.changeUserRole('user-123', 'superadmin', 'admin-999');

      expect(result.error).toBe('Ungültige Rolle. Erlaubt: user, admin');
      expect(result.code).toBe('INVALID_ROLE');
    });

    it('should reject self role change', async () => {
      const mockUser = {
        _id: 'admin-123',
        name: 'Self Admin',
        role: 'admin',
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await adminService.changeUserRole('admin-123', 'user', 'admin-123');

      expect(result.error).toBe('Du kannst deine eigene Rolle nicht ändern');
      expect(result.code).toBe('SELF_ROLE_CHANGE');
    });

    it('should reject demoting the last admin', async () => {
      const mockUser = {
        _id: 'admin-123',
        name: 'Last Admin',
        role: 'admin',
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      User.countDocuments = jest.fn().mockResolvedValue(1); // Nur 1 Admin

      const result = await adminService.changeUserRole('admin-123', 'user', 'admin-999');

      expect(result.error).toBe('Der letzte Admin kann nicht degradiert werden');
      expect(result.code).toBe('LAST_ADMIN');
    });

    it('should reject if user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.changeUserRole('non-existent', 'admin', 'admin-999');

      expect(result.error).toBe('User nicht gefunden');
      expect(result.code).toBe('USER_NOT_FOUND');
    });
  });

  // ============================================
  // listUsers Tests (showSensitive Production-Schutz)
  // ============================================
  describe('listUsers', () => {
    const mockPagination = { page: 1, limit: 10, skip: 0 };
    const mockSort = { createdAt: -1 };

    beforeEach(() => {
      const mockUsers = [{ _id: 'u1', name: 'Test', toObject: () => ({ _id: 'u1', name: 'Test' }) }];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers),
      };
      User.find = jest.fn().mockReturnValue(mockQuery);
      User.countDocuments = jest.fn().mockResolvedValue(1);
    });

    it('should ignore showSensitive in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const logger = require('../../src/utils/logger');

      await adminService.listUsers({}, mockPagination, mockSort, true);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('showSensitive=true in Production ignoriert')
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow showSensitive in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const logger = require('../../src/utils/logger');
      logger.warn.mockClear();

      await adminService.listUsers({}, mockPagination, mockSort, true);

      expect(logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('showSensitive=true in Production ignoriert')
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  // ============================================
  // getStats Tests
  // ============================================
  describe('getStats', () => {
    it('should return extended stats with role and active counts', async () => {
      const mockRecentUsers = [
        {
          name: 'User 1',
          email: 'user1@test.com',
          createdAt: new Date(),
          lastLogin: null,
          isVerified: true,
          role: 'user',
          isActive: true,
          toObject: jest.fn().mockReturnValue({
            name: 'User 1',
            email: 'user1@test.com',
            role: 'user',
            isActive: true,
          }),
        },
      ];

      // Mock alle countDocuments Aufrufe
      User.countDocuments = jest.fn()
        .mockResolvedValueOnce(10)   // totalUsers
        .mockResolvedValueOnce(8)    // verifiedUsers
        .mockResolvedValueOnce(9)    // activeUsers
        .mockResolvedValueOnce(1)    // adminUsers
        .mockResolvedValueOnce(3)    // usersLast7Days
        .mockResolvedValueOnce(5);   // usersLast30Days

      Transaction.countDocuments = jest.fn().mockResolvedValue(100);

      User.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockRecentUsers),
          }),
        }),
      });

      User.aggregate = jest.fn().mockResolvedValue([
        { _id: 'de', count: 8 },
        { _id: 'en', count: 2 },
      ]);

      const result = await adminService.getStats();

      expect(result.overview.totalUsers).toBe(10);
      expect(result.overview.verifiedUsers).toBe(8);
      expect(result.overview.activeUsers).toBe(9);
      expect(result.overview.bannedUsers).toBe(1);
      expect(result.overview.adminUsers).toBe(1);
      expect(result.overview.usersLast7Days).toBe(3);
      expect(result.overview.usersLast30Days).toBe(5);
      expect(result.overview.totalTransactions).toBe(100);
      expect(result.recentUsers).toBeDefined();
      expect(result.userLanguageBreakdown).toHaveLength(2);
      expect(result.userLanguageBreakdown[0]).toEqual({ _id: 'de', count: 8 });
    });
  });

  // ============================================
  // createUser Tests (mit role)
  // ============================================
  describe('createUser', () => {
    it('should create user with specified role', () => {
      const data = {
        name: 'New Admin',
        password: 'SecurePass123!',
        email: 'admin@test.com',
        role: 'admin',
      };

      expect(data.role).toBe('admin');
    });

    it('should default role to user when not specified', () => {
      const data = { name: 'Regular', password: 'Pass123!' };
      expect(data.role || 'user').toBe('user');
    });
  });

  // ============================================
  // deleteUser Tests (Schutz-Check)
  // ============================================
  describe('deleteUser', () => {
    it('should delete a user and their transactions', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Delete Me',
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
      User.findByIdAndDelete = jest.fn().mockResolvedValue(true);

      const auditLogService = require('../../src/services/auditLogService');
      const result = await adminService.deleteUser('user-123');

      expect(result.deletedUser).toBe('Delete Me');
      expect(result.deletedTransactions).toBe(5);
      expect(auditLogService.deleteByUserId).toHaveBeenCalledWith('user-123');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user-123');
    });

    it('should return error for non-existent user', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.deleteUser('non-existent');

      expect(result.error).toBe('User nicht gefunden');
      expect(result.code).toBe('USER_NOT_FOUND');
    });
  });

  // ============================================
  // getLifecycleStats Tests
  // ============================================
  describe('getLifecycleStats', () => {
    /** Helper: erzeugt eine chainable Query-Mock */
    function createQueryMock(resolvedData) {
      return {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(resolvedData),
      };
    }

    /** Standard-Setup für alle 4 User.find-Aufrufe */
    function setupFindMocks({ finalWarning = [], reminding = [], exported = [], quota = [] } = {}) {
      User.find = jest.fn()
        .mockReturnValueOnce(createQueryMock(finalWarning))
        .mockReturnValueOnce(createQueryMock(reminding))
        .mockReturnValueOnce(createQueryMock(exported))
        .mockReturnValueOnce(createQueryMock(quota));
    }

    beforeEach(() => {
      lifecycleService.getAdminLifecycleStats.mockResolvedValue({
        usersWithOldTransactions: 5,
        usersInReminding: 3,
        usersInFinalWarning: 1,
        usersExported: 2,
        deletionsThisMonth: 0,
        usersApproachingLimit: 4,
        usersAtLimit: 1,
      });

      // Konstanten setzen
      lifecycleService.RETENTION_MONTHS = 12;
      lifecycleService.GRACE_PERIOD_MONTHS = 3;
      lifecycleService.FINAL_WARNING_DAYS = 7;
      lifecycleService.REMINDER_COOLDOWN_DAYS = 7;
    });

    it('should return lifecycle stats with all user lists', async () => {
      setupFindMocks({
        finalWarning: [
          {
            _id: 'u1',
            name: 'User1',
            email: 'u1@test.com',
            transactionLifecycle: {
              retentionNotifications: { finalWarningSentAt: new Date('2026-02-20') },
            },
          },
        ],
        reminding: [
          {
            _id: 'u3',
            name: 'User3',
            email: 'u3@test.com',
            transactionLifecycle: {
              retentionNotifications: { reminderStartedAt: new Date('2026-01-15'), reminderCount: 2 },
            },
          },
        ],
        exported: [
          {
            _id: 'u4',
            name: 'User4',
            email: 'u4@test.com',
            transactionLifecycle: {
              retentionNotifications: { exportConfirmedAt: new Date('2026-02-10') },
            },
          },
        ],
        quota: [
          {
            _id: 'u2',
            name: 'User2',
            email: null,
            transactionLifecycle: { monthlyTransactionCount: 140 },
          },
        ],
      });

      const result = await adminService.getLifecycleStats();

      // Base stats durchgereicht
      expect(result.usersWithOldTransactions).toBe(5);
      expect(result.usersInReminding).toBe(3);

      // Final warning users
      expect(result.usersInFinalWarningPhase).toHaveLength(1);
      expect(result.usersInFinalWarningPhase[0]).toEqual({
        _id: 'u1',
        name: 'User1',
        email: 'u1@test.com',
        finalWarningSentAt: expect.any(Date),
      });

      // Reminding users
      expect(result.usersInRemindingPhase).toHaveLength(1);
      expect(result.usersInRemindingPhase[0]).toEqual({
        _id: 'u3',
        name: 'User3',
        email: 'u3@test.com',
        reminderStartedAt: expect.any(Date),
        reminderCount: 2,
      });

      // Exported users
      expect(result.usersWithExport).toHaveLength(1);
      expect(result.usersWithExport[0]).toEqual({
        _id: 'u4',
        name: 'User4',
        email: 'u4@test.com',
        exportConfirmedAt: expect.any(Date),
      });

      // Quota users
      expect(result.usersApproachingQuota).toHaveLength(1);
      expect(result.usersApproachingQuota[0]).toEqual({
        _id: 'u2',
        name: 'User2',
        email: null,
        monthlyTransactionCount: 140,
      });
    });

    it('should return config object with lifecycle constants', async () => {
      setupFindMocks();

      const result = await adminService.getLifecycleStats();

      expect(result.config).toEqual({
        retentionMonths: 12,
        gracePeriodMonths: 3,
        finalWarningDays: 7,
        reminderCooldownDays: 7,
        quotaLimit: 150,
      });
    });

    it('should handle empty user lists gracefully', async () => {
      setupFindMocks();

      const result = await adminService.getLifecycleStats();

      expect(result.usersInFinalWarningPhase).toEqual([]);
      expect(result.usersInRemindingPhase).toEqual([]);
      expect(result.usersWithExport).toEqual([]);
      expect(result.usersApproachingQuota).toEqual([]);
    });

    it('should handle users with missing email gracefully', async () => {
      setupFindMocks({
        reminding: [
          {
            _id: 'u5',
            name: 'NoEmail',
            transactionLifecycle: {
              retentionNotifications: { reminderStartedAt: new Date(), reminderCount: 0 },
            },
          },
        ],
      });

      const result = await adminService.getLifecycleStats();

      expect(result.usersInRemindingPhase[0].email).toBeNull();
      expect(result.usersInRemindingPhase[0].reminderCount).toBe(0);
    });

    it('should run all 4 User.find queries in parallel', async () => {
      setupFindMocks();

      await adminService.getLifecycleStats();

      // 4 Aufrufe von User.find (finalWarning, reminding, exported, quota)
      expect(User.find).toHaveBeenCalledTimes(4);
    });
  });

  // ============================================
  // getUserLifecycleDetail Tests
  // ============================================
  describe('getUserLifecycleDetail', () => {
    it('should return null for non-existent user', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.getUserLifecycleDetail('non-existent');

      expect(result).toBeNull();
    });

    it('should return detailed lifecycle status', async () => {
      const mockUser = {
        _id: 'user-1',
        name: 'Test User',
        transactionLifecycle: {
          monthlyTransactionCount: 42,
          monthlyCountResetAt: new Date(),
          retentionNotifications: {},
        },
        toObject: jest.fn().mockReturnValue({
          _id: 'user-1',
          name: 'Test User',
          transactionLifecycle: {
            monthlyTransactionCount: 42,
            retentionNotifications: {},
          },
        }),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      lifecycleService.getLifecycleStatus.mockResolvedValue({
        retention: {
          phase: 'active',
          hasOldTransactions: false,
          oldTransactionCount: 0,
        },
      });

      Transaction.countDocuments = jest.fn()
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(10)   // old
        .mockResolvedValueOnce(90);  // recent

      const result = await adminService.getUserLifecycleDetail('user-1');

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.lifecycle.retention.phase).toBe('active');
      expect(result.quota.used).toBe(42);
      expect(result.transactionBreakdown).toEqual({
        total: 100,
        olderThan12Months: 10,
        within12Months: 90,
      });
    });
  });

  // ============================================
  // resetUserRetention Tests
  // ============================================
  describe('resetUserRetention', () => {
    it('should return error for non-existent user', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.resetUserRetention('non-existent');

      expect(result.error).toBe('User nicht gefunden');
      expect(result.code).toBe('USER_NOT_FOUND');
    });

    it('should reset retention successfully', async () => {
      const mockUser = {
        _id: 'user-1',
        transactionLifecycle: {
          retentionNotifications: {
            reminderStartedAt: new Date(),
            finalWarningSentAt: new Date(),
          },
        },
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      lifecycleService.resetRetentionStatus.mockResolvedValue();

      const result = await adminService.resetUserRetention('user-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Retention-Status zurückgesetzt');
      expect(lifecycleService.resetRetentionStatus).toHaveBeenCalledWith(mockUser);
    });
  });

  // ============================================
  // triggerRetentionProcessing Tests
  // ============================================
  describe('triggerRetentionProcessing', () => {
    it('should trigger processing and return stats', async () => {
      const mockStats = {
        processed: 10,
        reminders: 3,
        finalWarnings: 1,
        deletions: 0,
        errors: 0,
        skipped: 6,
      };

      lifecycleService.processRetentionForAllUsers.mockResolvedValue(mockStats);

      const result = await adminService.triggerRetentionProcessing();

      expect(result).toEqual(mockStats);
      expect(lifecycleService.processRetentionForAllUsers).toHaveBeenCalled();
    });
  });
});
