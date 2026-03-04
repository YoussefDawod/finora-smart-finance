/**
 * @fileoverview AuditLog Service Tests
 * @description Unit tests for audit logging: log(), getLogs(), getStats()
 */

const auditLogService = require('../../src/services/auditLogService');
const AuditLog = require('../../src/models/AuditLog');
const { AUDIT_ACTIONS } = jest.requireActual('../../src/models/AuditLog');

// Mock dependencies
jest.mock('../../src/models/AuditLog');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('AuditLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // AUDIT_ACTIONS Enum Validation
  // ============================================
  describe('AUDIT_ACTIONS enum', () => {
    it('should include TRANSACTION_DELETED', () => {
      expect(AUDIT_ACTIONS).toContain('TRANSACTION_DELETED');
    });

    it('should include SUBSCRIBER_DELETED', () => {
      expect(AUDIT_ACTIONS).toContain('SUBSCRIBER_DELETED');
    });

    it('should include all core admin actions', () => {
      const coreActions = [
        'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
        'USER_BANNED', 'USER_UNBANNED', 'USER_ROLE_CHANGED',
        'USER_PASSWORD_RESET', 'ALL_USERS_DELETED',
        'TRANSACTION_DELETED', 'SUBSCRIBER_DELETED',
        'ADMIN_LOGIN', 'SETTINGS_CHANGED',
      ];
      for (const action of coreActions) {
        expect(AUDIT_ACTIONS).toContain(action);
      }
    });
  });

  // ============================================
  // log() Tests
  // ============================================
  describe('log', () => {
    it('should create an audit log entry with all fields', async () => {
      const mockEntry = {
        _id: 'log-123',
        action: 'USER_BANNED',
        adminId: 'admin-1',
        adminName: 'Admin User',
        targetUserId: 'user-1',
        targetUserName: 'Test User',
        details: { reason: 'Spam' },
        ipAddress: '127.0.0.1',
        userAgent: 'CLI/1.0',
        save: jest.fn().mockResolvedValue(true),
      };

      AuditLog.mockImplementation(() => mockEntry);

      const result = await auditLogService.log({
        action: 'USER_BANNED',
        adminId: 'admin-1',
        adminName: 'Admin User',
        targetUserId: 'user-1',
        targetUserName: 'Test User',
        details: { reason: 'Spam' },
        req: {
          ip: '127.0.0.1',
          headers: { 'user-agent': 'CLI/1.0' },
        },
      });

      expect(result).toBe(mockEntry);
      expect(mockEntry.save).toHaveBeenCalledTimes(1);
      expect(AuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_BANNED',
          adminId: 'admin-1',
          adminName: 'Admin User',
          targetUserId: 'user-1',
          targetUserName: 'Test User',
          details: { reason: 'Spam' },
          ipAddress: '127.0.0.1',
          userAgent: 'CLI/1.0',
        })
      );
    });

    it('should default adminName to System/API-Key when not provided', async () => {
      const mockEntry = { save: jest.fn().mockResolvedValue(true) };
      AuditLog.mockImplementation(() => mockEntry);

      await auditLogService.log({
        action: 'USER_CREATED',
      });

      expect(AuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          adminName: 'System/API-Key',
          adminId: null,
          targetUserId: null,
          targetUserName: null,
        })
      );
    });

    it('should handle null req gracefully (no IP/UserAgent)', async () => {
      const mockEntry = { save: jest.fn().mockResolvedValue(true) };
      AuditLog.mockImplementation(() => mockEntry);

      await auditLogService.log({
        action: 'USER_DELETED',
        req: null,
      });

      expect(AuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        })
      );
    });

    it('should handle missing req (undefined)', async () => {
      const mockEntry = { save: jest.fn().mockResolvedValue(true) };
      AuditLog.mockImplementation(() => mockEntry);

      await auditLogService.log({
        action: 'USER_UPDATED',
      });

      expect(AuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        })
      );
    });

    it('should extract IP from req.connection.remoteAddress as fallback', async () => {
      const mockEntry = { save: jest.fn().mockResolvedValue(true) };
      AuditLog.mockImplementation(() => mockEntry);

      await auditLogService.log({
        action: 'USER_BANNED',
        req: {
          ip: null,
          connection: { remoteAddress: '192.168.1.1' },
          headers: {},
        },
      });

      expect(AuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
        })
      );
    });

    it('should NOT throw on save failure (fire-and-forget)', async () => {
      const mockEntry = { save: jest.fn().mockRejectedValue(new Error('DB write failed')) };
      AuditLog.mockImplementation(() => mockEntry);

      const result = await auditLogService.log({
        action: 'USER_BANNED',
      });

      // Sollte null zurückgeben, nicht werfen
      expect(result).toBeNull();
    });

    it('should log error on save failure', async () => {
      const logger = require('../../src/utils/logger');
      const mockEntry = { save: jest.fn().mockRejectedValue(new Error('DB error')) };
      AuditLog.mockImplementation(() => mockEntry);

      await auditLogService.log({ action: 'USER_BANNED' });

      expect(logger.error).toHaveBeenCalledWith(
        'AuditLog write failed:',
        expect.any(Error)
      );
    });

    it('should pass empty details object by default', async () => {
      const mockEntry = { save: jest.fn().mockResolvedValue(true) };
      AuditLog.mockImplementation(() => mockEntry);

      await auditLogService.log({ action: 'USER_CREATED' });

      expect(AuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {},
        })
      );
    });
  });

  // ============================================
  // getLogs() Tests
  // ============================================
  describe('getLogs', () => {
    const mockLogs = [
      { _id: 'log-1', action: 'USER_BANNED', createdAt: new Date() },
      { _id: 'log-2', action: 'USER_CREATED', createdAt: new Date() },
    ];

    function setupFindMock(logs, total) {
      const chainable = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(logs),
      };
      AuditLog.find = jest.fn().mockReturnValue(chainable);
      AuditLog.countDocuments = jest.fn().mockResolvedValue(total);
      return chainable;
    }

    it('should return paginated logs with defaults', async () => {
      const chain = setupFindMock(mockLogs, 2);

      const result = await auditLogService.getLogs();

      expect(AuditLog.find).toHaveBeenCalledWith({});
      expect(chain.sort).toHaveBeenCalledWith('-createdAt');
      expect(chain.skip).toHaveBeenCalledWith(0);
      expect(chain.limit).toHaveBeenCalledWith(50);
      expect(result.logs).toEqual(mockLogs);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        pages: 1,
        limit: 50,
      });
    });

    it('should apply page and limit parameters', async () => {
      const chain = setupFindMock([], 100);

      await auditLogService.getLogs({ page: 3, limit: 10 });

      expect(chain.skip).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(chain.limit).toHaveBeenCalledWith(10);
    });

    it('should cap limit at 100', async () => {
      const chain = setupFindMock([], 0);

      await auditLogService.getLogs({ limit: 500 });

      expect(chain.limit).toHaveBeenCalledWith(100);
    });

    it('should ensure minimum limit of 1', async () => {
      const chain = setupFindMock([], 0);

      await auditLogService.getLogs({ limit: -5 });

      expect(chain.limit).toHaveBeenCalledWith(1);
    });

    it('should ensure minimum page of 1', async () => {
      const chain = setupFindMock([], 0);

      await auditLogService.getLogs({ page: -1 });

      expect(chain.skip).toHaveBeenCalledWith(0); // (1-1) * 50
    });

    it('should filter by action', async () => {
      setupFindMock([], 0);

      await auditLogService.getLogs({ action: 'USER_BANNED' });

      expect(AuditLog.find).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_BANNED' })
      );
    });

    it('should filter by adminId', async () => {
      setupFindMock([], 0);

      await auditLogService.getLogs({ adminId: 'admin-1' });

      expect(AuditLog.find).toHaveBeenCalledWith(
        expect.objectContaining({ adminId: 'admin-1' })
      );
    });

    it('should filter by targetUserId', async () => {
      setupFindMock([], 0);

      await auditLogService.getLogs({ targetUserId: 'user-1' });

      expect(AuditLog.find).toHaveBeenCalledWith(
        expect.objectContaining({ targetUserId: 'user-1' })
      );
    });

    it('should filter by date range (startDate + endDate)', async () => {
      setupFindMock([], 0);

      await auditLogService.getLogs({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });

      const calledQuery = AuditLog.find.mock.calls[0][0];
      expect(calledQuery.createdAt.$gte).toEqual(new Date('2025-01-01'));
      expect(calledQuery.createdAt.$lte).toEqual(new Date('2025-12-31'));
    });

    it('should filter by startDate only', async () => {
      setupFindMock([], 0);

      await auditLogService.getLogs({ startDate: '2025-06-01' });

      const calledQuery = AuditLog.find.mock.calls[0][0];
      expect(calledQuery.createdAt.$gte).toEqual(new Date('2025-06-01'));
      expect(calledQuery.createdAt.$lte).toBeUndefined();
    });

    it('should filter by endDate only', async () => {
      setupFindMock([], 0);

      await auditLogService.getLogs({ endDate: '2025-12-31' });

      const calledQuery = AuditLog.find.mock.calls[0][0];
      expect(calledQuery.createdAt.$gte).toBeUndefined();
      expect(calledQuery.createdAt.$lte).toEqual(new Date('2025-12-31'));
    });

    it('should apply custom sort parameter', async () => {
      const chain = setupFindMock([], 0);

      await auditLogService.getLogs({ sort: 'createdAt' });

      expect(chain.sort).toHaveBeenCalledWith('createdAt');
    });

    it('should combine multiple filters', async () => {
      setupFindMock([], 0);

      await auditLogService.getLogs({
        action: 'USER_BANNED',
        adminId: 'admin-1',
        startDate: '2025-01-01',
      });

      const calledQuery = AuditLog.find.mock.calls[0][0];
      expect(calledQuery.action).toBe('USER_BANNED');
      expect(calledQuery.adminId).toBe('admin-1');
      expect(calledQuery.createdAt.$gte).toEqual(new Date('2025-01-01'));
    });

    it('should calculate correct pagination metadata', async () => {
      setupFindMock([], 95);

      const result = await auditLogService.getLogs({ page: 2, limit: 20 });

      expect(result.pagination).toEqual({
        total: 95,
        page: 2,
        pages: 5, // ceil(95/20) = 5
        limit: 20,
      });
    });

    it('should handle NaN values for page and limit gracefully', async () => {
      const chain = setupFindMock([], 0);

      await auditLogService.getLogs({ page: 'abc', limit: 'xyz' });

      expect(chain.skip).toHaveBeenCalledWith(0); // default page=1 → skip=0
      expect(chain.limit).toHaveBeenCalledWith(50); // default limit=50
    });
  });

  // ============================================
  // getStats() Tests
  // ============================================
  describe('getStats', () => {
    it('should return action breakdown, totalEntries, mostCommonAction, activeAdmins', async () => {
      const mockAggregation = [
        { _id: 'USER_BANNED', count: 5 },
        { _id: 'USER_CREATED', count: 3 },
      ];

      AuditLog.aggregate = jest.fn().mockResolvedValue(mockAggregation);
      AuditLog.countDocuments = jest.fn().mockResolvedValue(8);
      AuditLog.distinct = jest.fn().mockResolvedValue(['admin1', 'admin2']);

      const result = await auditLogService.getStats();

      expect(result.actionBreakdown).toEqual(mockAggregation);
      expect(result.totalEntries).toBe(8);
      expect(result.mostCommonAction).toBe('USER_BANNED');
      expect(result.activeAdmins).toBe(2);
    });

    it('should filter by last 30 days', async () => {
      AuditLog.aggregate = jest.fn().mockResolvedValue([]);
      AuditLog.countDocuments = jest.fn().mockResolvedValue(0);
      AuditLog.distinct = jest.fn().mockResolvedValue([]);

      await auditLogService.getStats();

      // Prüfe dass aggregate mit $gte-Filter aufgerufen wurde
      const pipeline = AuditLog.aggregate.mock.calls[0][0];
      const matchStage = pipeline.find(s => s.$match);
      expect(matchStage.$match.createdAt.$gte).toBeInstanceOf(Date);

      // Prüfe dass countDocuments ebenfalls den 30-Tage-Filter hat
      const countQuery = AuditLog.countDocuments.mock.calls[0][0];
      expect(countQuery.createdAt.$gte).toBeInstanceOf(Date);
    });

    it('should return empty stats when no logs exist', async () => {
      AuditLog.aggregate = jest.fn().mockResolvedValue([]);
      AuditLog.countDocuments = jest.fn().mockResolvedValue(0);
      AuditLog.distinct = jest.fn().mockResolvedValue([]);

      const result = await auditLogService.getStats();

      expect(result.actionBreakdown).toEqual([]);
      expect(result.totalEntries).toBe(0);
      expect(result.mostCommonAction).toBeNull();
      expect(result.activeAdmins).toBe(0);
    });
  });

  // ============================================
  // deleteByUserId() Tests (DSGVO)
  // ============================================
  describe('deleteByUserId', () => {
    it('should delete all audit logs for a given userId', async () => {
      AuditLog.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

      const count = await auditLogService.deleteByUserId('user-123');

      expect(AuditLog.deleteMany).toHaveBeenCalledWith({ targetUserId: 'user-123' });
      expect(count).toBe(5);
    });

    it('should return 0 when no logs exist for the user', async () => {
      AuditLog.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

      const count = await auditLogService.deleteByUserId('user-999');

      expect(AuditLog.deleteMany).toHaveBeenCalledWith({ targetUserId: 'user-999' });
      expect(count).toBe(0);
    });

    it('should return 0 and log error on failure', async () => {
      AuditLog.deleteMany = jest.fn().mockRejectedValue(new Error('DB error'));
      const logger = require('../../src/utils/logger');

      const count = await auditLogService.deleteByUserId('user-err');

      expect(count).toBe(0);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
