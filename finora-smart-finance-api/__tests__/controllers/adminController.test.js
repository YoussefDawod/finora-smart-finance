/**
 * @fileoverview Admin Controller Tests (AuditLog-Integration)
 * @description Tests that admin controller actions correctly trigger audit logging
 */

const adminController = require('../../src/controllers/adminController');
const adminService = require('../../src/services/adminService');
const auditLogService = require('../../src/services/auditLogService');

// Mock all dependencies
jest.mock('../../src/services/adminService');
jest.mock('../../src/services/auditLogService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('AdminController AuditLog Integration', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { id: 'user-123' },
      body: {},
      query: {},
      user: { _id: 'admin-1', name: 'Admin User', role: 'admin' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      requestId: 'req-abc',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Default: auditLog.log resolves successfully
    auditLogService.log.mockResolvedValue({ _id: 'log-1' });
  });

  // ============================================
  // createUser → USER_CREATED
  // ============================================
  describe('createUser → USER_CREATED audit', () => {
    it('should log USER_CREATED on successful user creation', async () => {
      req.body = { name: 'New User', password: 'SecurePass1!' };

      adminService.createUser.mockResolvedValue({
        user: { _id: 'new-user-1', name: 'New User', email: null, role: 'user' },
      });

      await adminController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_CREATED',
          adminId: 'admin-1',
          adminName: 'Admin User',
          targetUserId: 'new-user-1',
          targetUserName: 'New User',
          details: { email: null, role: 'user' },
          req,
        })
      );
    });

    it('should NOT log audit on creation failure', async () => {
      req.body = { name: 'Dupe', password: 'SecurePass1!' };

      adminService.createUser.mockResolvedValue({
        error: 'Name ist bereits vergeben',
        code: 'NAME_TAKEN',
      });

      await adminController.createUser(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it('should NOT log audit on validation error', async () => {
      req.body = {}; // Missing required fields

      await adminController.createUser(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // updateUser → USER_UPDATED
  // ============================================
  describe('updateUser → USER_UPDATED audit', () => {
    it('should log USER_UPDATED on successful update', async () => {
      req.body = { name: 'Updated Name', email: 'new@test.com' };

      adminService.updateUser.mockResolvedValue({
        user: { _id: 'user-123', name: 'Updated Name' },
      });

      await adminController.updateUser(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATED',
          adminId: 'admin-1',
          targetUserId: 'user-123',
          targetUserName: 'Updated Name',
          details: { updatedFields: expect.arrayContaining(['name', 'email']) },
        })
      );
    });

    it('should NOT log audit on update failure', async () => {
      req.body = { name: 'Test' };

      adminService.updateUser.mockResolvedValue({
        error: 'User nicht gefunden',
        code: 'USER_NOT_FOUND',
      });

      await adminController.updateUser(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // deleteUser → USER_DELETED
  // ============================================
  describe('deleteUser → USER_DELETED audit', () => {
    it('should log USER_DELETED on successful deletion', async () => {
      adminService.deleteUser.mockResolvedValue({
        deletedUser: 'Test User',
        deletedTransactions: 5,
      });

      await adminController.deleteUser(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_DELETED',
          adminId: 'admin-1',
          targetUserId: 'user-123',
          targetUserName: 'Test User',
          details: { deletedTransactions: 5 },
        })
      );
    });

    it('should NOT log audit on delete failure', async () => {
      adminService.deleteUser.mockResolvedValue({
        error: 'User nicht gefunden',
        code: 'USER_NOT_FOUND',
      });

      await adminController.deleteUser(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // resetPassword → USER_PASSWORD_RESET
  // ============================================
  describe('resetPassword → USER_PASSWORD_RESET audit', () => {
    it('should log USER_PASSWORD_RESET on success', async () => {
      req.body = { newPassword: 'NewSecurePass1!' };

      adminService.resetUserPassword.mockResolvedValue({ success: true });

      await adminController.resetPassword(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_PASSWORD_RESET',
          adminId: 'admin-1',
          targetUserId: 'user-123',
          details: {},
        })
      );
    });

    it('should NOT log audit on password reset failure', async () => {
      req.body = { newPassword: 'NewSecurePass1!' };

      adminService.resetUserPassword.mockResolvedValue({
        error: 'User nicht gefunden',
        code: 'USER_NOT_FOUND',
      });

      await adminController.resetPassword(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it('should NOT log audit on validation error (weak password)', async () => {
      req.body = { newPassword: '123' };

      await adminController.resetPassword(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // banUser → USER_BANNED
  // ============================================
  describe('banUser → USER_BANNED audit', () => {
    it('should log USER_BANNED with reason on success', async () => {
      req.body = { reason: 'Spam-Account' };

      adminService.banUser.mockResolvedValue({
        user: { _id: 'user-123', name: 'Bad User', isActive: false },
      });

      await adminController.banUser(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_BANNED',
          adminId: 'admin-1',
          targetUserName: 'Bad User',
          details: { reason: 'Spam-Account' },
        })
      );
    });

    it('should log USER_BANNED with empty reason when not provided', async () => {
      req.body = {};

      adminService.banUser.mockResolvedValue({
        user: { _id: 'user-123', name: 'Bad User', isActive: false },
      });

      await adminController.banUser(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { reason: '' },
        })
      );
    });

    it('should NOT log audit on ban failure', async () => {
      req.body = {};

      adminService.banUser.mockResolvedValue({
        error: 'Admin-Accounts können nicht gesperrt werden',
        code: 'CANNOT_BAN_ADMIN',
      });

      await adminController.banUser(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // unbanUser → USER_UNBANNED
  // ============================================
  describe('unbanUser → USER_UNBANNED audit', () => {
    it('should log USER_UNBANNED on success', async () => {
      adminService.unbanUser.mockResolvedValue({
        user: { _id: 'user-123', name: 'Freed User', isActive: true },
      });

      await adminController.unbanUser(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UNBANNED',
          adminId: 'admin-1',
          targetUserName: 'Freed User',
          details: {},
        })
      );
    });

    it('should NOT log audit on unban failure', async () => {
      adminService.unbanUser.mockResolvedValue({
        error: 'User ist nicht gesperrt',
        code: 'NOT_BANNED',
      });

      await adminController.unbanUser(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // changeUserRole → USER_ROLE_CHANGED
  // ============================================
  describe('changeUserRole → USER_ROLE_CHANGED audit', () => {
    it('should log USER_ROLE_CHANGED on success', async () => {
      req.body = { role: 'admin' };

      adminService.changeUserRole.mockResolvedValue({
        user: { _id: 'user-123', name: 'Promoted User', role: 'admin' },
      });

      await adminController.changeUserRole(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_CHANGED',
          adminId: 'admin-1',
          targetUserName: 'Promoted User',
          details: { newRole: 'admin' },
        })
      );
    });

    it('should NOT log audit on role change failure', async () => {
      req.body = { role: 'admin' };

      adminService.changeUserRole.mockResolvedValue({
        error: 'Du kannst deine eigene Rolle nicht ändern',
        code: 'SELF_ROLE_CHANGE',
      });

      await adminController.changeUserRole(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it('should NOT log audit on invalid role', async () => {
      req.body = { role: 'superadmin' };

      await adminController.changeUserRole(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // deleteAllUsers → ALL_USERS_DELETED
  // ============================================
  describe('deleteAllUsers → ALL_USERS_DELETED audit', () => {
    it('should log ALL_USERS_DELETED on success', async () => {
      req.body = { confirm: 'DELETE_ALL_USERS', reason: 'Testumgebung bereinigen' };

      adminService.deleteAllUsers.mockResolvedValue({
        deletedUsers: 10,
        deletedTransactions: 50,
      });

      await adminController.deleteAllUsers(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ALL_USERS_DELETED',
          adminId: 'admin-1',
          details: expect.objectContaining({
            reason: 'Testumgebung bereinigen',
            deletedUsers: 10,
            deletedTransactions: 50,
          }),
        })
      );
    });

    it('should NOT log audit without confirmation', async () => {
      req.body = { confirm: 'wrong', reason: 'Test reason' };

      await adminController.deleteAllUsers(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it('should return 400 when reason is missing', async () => {
      req.body = { confirm: 'DELETE_ALL_USERS' };

      await adminController.deleteAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it('should return 400 when reason is too short', async () => {
      req.body = { confirm: 'DELETE_ALL_USERS', reason: 'abc' };

      await adminController.deleteAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // getAdminInfo — API-Key fallback
  // ============================================
  describe('Admin info extraction', () => {
    it('should use System/API-Key when no user on request', async () => {
      req.user = undefined;
      req.body = { reason: 'Test' };

      adminService.banUser.mockResolvedValue({
        user: { _id: 'user-123', name: 'Test', isActive: false },
      });

      await adminController.banUser(req, res);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: null,
          adminName: 'System/API-Key',
        })
      );
    });
  });

  // ============================================
  // getAuditLogs / getAuditLogStats
  // ============================================
  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      req.query = { page: '1', limit: '10', action: 'USER_BANNED' };

      auditLogService.getLogs.mockResolvedValue({
        logs: [{ _id: 'log-1' }],
        pagination: { total: 1, page: 1, pages: 1, limit: 10 },
      });

      await adminController.getAuditLogs(req, res);

      expect(auditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: '1',
          limit: '10',
          action: 'USER_BANNED',
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          logs: expect.any(Array),
          pagination: expect.any(Object),
        }),
      });
    });

    it('should handle server error in getAuditLogs', async () => {
      auditLogService.getLogs.mockRejectedValue(new Error('DB fail'));

      await adminController.getAuditLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAuditLogStats', () => {
    it('should return audit log statistics', async () => {
      auditLogService.getStats.mockResolvedValue({
        actionBreakdown: [{ _id: 'USER_BANNED', count: 5 }],
        totalLast30Days: 5,
      });

      await adminController.getAuditLogStats(req, res);

      expect(auditLogService.getStats).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          actionBreakdown: expect.any(Array),
          totalLast30Days: 5,
        }),
      });
    });

    it('should handle server error in getAuditLogStats', async () => {
      auditLogService.getStats.mockRejectedValue(new Error('DB fail'));

      await adminController.getAuditLogStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================
  // Lifecycle Endpoints
  // ============================================
  describe('getLifecycleStats', () => {
    it('should return lifecycle stats', async () => {
      adminService.getLifecycleStats.mockResolvedValue({
        usersWithOldTransactions: 5,
        usersInReminding: 3,
        usersInFinalWarning: 1,
        usersExported: 2,
        usersInFinalWarningPhase: [],
        usersApproachingQuota: [],
      });

      await adminController.getLifecycleStats(req, res);

      expect(adminService.getLifecycleStats).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          usersWithOldTransactions: 5,
          usersInReminding: 3,
        }),
      });
    });

    it('should handle server error in getLifecycleStats', async () => {
      adminService.getLifecycleStats.mockRejectedValue(new Error('DB fail'));

      await adminController.getLifecycleStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserLifecycleDetail', () => {
    it('should return lifecycle detail for a user', async () => {
      adminService.getUserLifecycleDetail.mockResolvedValue({
        user: { _id: 'user-123', name: 'Test' },
        lifecycle: { retention: { phase: 'active' } },
        quota: { used: 10, limit: 150, remaining: 140 },
        transactionBreakdown: { total: 50, olderThan12Months: 5, within12Months: 45 },
      });

      await adminController.getUserLifecycleDetail(req, res);

      expect(adminService.getUserLifecycleDetail).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          lifecycle: expect.objectContaining({ retention: { phase: 'active' } }),
        }),
      });
    });

    it('should return 404 for non-existent user', async () => {
      adminService.getUserLifecycleDetail.mockResolvedValue(null);

      await adminController.getUserLifecycleDetail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle server error', async () => {
      adminService.getUserLifecycleDetail.mockRejectedValue(new Error('DB fail'));

      await adminController.getUserLifecycleDetail(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('resetUserRetention', () => {
    it('should reset retention and log audit', async () => {
      adminService.resetUserRetention.mockResolvedValue({
        success: true,
        message: 'Retention-Status zurückgesetzt',
      });

      await adminController.resetUserRetention(req, res);

      expect(adminService.resetUserRetention).toHaveBeenCalledWith('user-123');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETENTION_RESET_BY_ADMIN',
          adminId: 'admin-1',
          adminName: 'Admin User',
          targetUserId: 'user-123',
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Retention-Status zurückgesetzt',
      });
    });

    it('should return 404 if user not found', async () => {
      adminService.resetUserRetention.mockResolvedValue({
        error: 'User nicht gefunden',
        code: 'USER_NOT_FOUND',
      });

      await adminController.resetUserRetention(req, res);

      expect(auditLogService.log).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle server error', async () => {
      adminService.resetUserRetention.mockRejectedValue(new Error('DB fail'));

      await adminController.resetUserRetention(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('triggerRetentionProcessing', () => {
    it('should trigger processing and log audit', async () => {
      const mockStats = {
        processed: 10,
        reminders: 3,
        finalWarnings: 1,
        deletions: 0,
        errors: 0,
        skipped: 6,
      };

      adminService.triggerRetentionProcessing.mockResolvedValue(mockStats);

      await adminController.triggerRetentionProcessing(req, res);

      expect(adminService.triggerRetentionProcessing).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETENTION_MANUAL_TRIGGER',
          adminId: 'admin-1',
          adminName: 'Admin User',
          details: { stats: mockStats },
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Retention-Verarbeitung abgeschlossen',
        data: mockStats,
      });
    });

    it('should handle server error', async () => {
      adminService.triggerRetentionProcessing.mockRejectedValue(new Error('Timeout'));

      await adminController.triggerRetentionProcessing(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
