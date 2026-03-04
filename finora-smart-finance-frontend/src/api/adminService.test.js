/**
 * @fileoverview Admin Service Tests
 * @description Unit-Tests für den Admin API-Client (alle Endpunkte)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '@/api/adminService';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

// ============================================================================
// MOCK axios client
// ============================================================================
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    patch: vi.fn().mockResolvedValue({ data: { success: true } }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

// ============================================================================
// TESTS
// ============================================================================
describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // DASHBOARD / STATS
  // ──────────────────────────────────────────────────────────
  describe('getStats', () => {
    it('should call GET /admin/stats', async () => {
      await adminService.getStats();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.stats, expect.objectContaining({}));
    });
  });

  // ──────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ──────────────────────────────────────────────────────────
  describe('User Management', () => {
    it('getUsers – should call GET /admin/users with params', async () => {
      const params = { page: 2, limit: 20, search: 'Max', role: 'admin' };
      await adminService.getUsers(params);
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.users, expect.objectContaining({ params }));
    });

    it('getUsers – should work without params', async () => {
      await adminService.getUsers();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.users, expect.objectContaining({ params: {} }));
    });

    it('getUser – should call GET /admin/users/:id', async () => {
      await adminService.getUser('user-123');
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.user('user-123'), expect.objectContaining({}));
    });

    it('createUser – should call POST /admin/users with data', async () => {
      const data = { name: 'Neuer User', email: 'neu@test.com', password: 'Pass123!' };
      await adminService.createUser(data);
      expect(client.post).toHaveBeenCalledWith(ENDPOINTS.admin.users, data, expect.objectContaining({}));
    });

    it('updateUser – should call PATCH /admin/users/:id with data', async () => {
      const data = { name: 'Updated Name' };
      await adminService.updateUser('user-123', data);
      expect(client.patch).toHaveBeenCalledWith(ENDPOINTS.admin.user('user-123'), data, expect.objectContaining({}));
    });

    it('deleteUser – should call DELETE /admin/users/:id', async () => {
      await adminService.deleteUser('user-123');
      expect(client.delete).toHaveBeenCalledWith(ENDPOINTS.admin.user('user-123'));
    });

    it('deleteAllUsers – should call DELETE /admin/users', async () => {
      await adminService.deleteAllUsers();
      expect(client.delete).toHaveBeenCalledWith(ENDPOINTS.admin.users);
    });

    it('banUser – should call PATCH /admin/users/:id/ban with reason', async () => {
      await adminService.banUser('user-123', 'Spam');
      expect(client.patch).toHaveBeenCalledWith(
        ENDPOINTS.admin.banUser('user-123'),
        { reason: 'Spam' }
      );
    });

    it('banUser – should use empty reason by default', async () => {
      await adminService.banUser('user-123');
      expect(client.patch).toHaveBeenCalledWith(
        ENDPOINTS.admin.banUser('user-123'),
        { reason: '' }
      );
    });

    it('unbanUser – should call PATCH /admin/users/:id/unban', async () => {
      await adminService.unbanUser('user-123');
      expect(client.patch).toHaveBeenCalledWith(ENDPOINTS.admin.unbanUser('user-123'));
    });

    it('changeUserRole – should call PATCH /admin/users/:id/role', async () => {
      await adminService.changeUserRole('user-123', 'admin');
      expect(client.patch).toHaveBeenCalledWith(
        ENDPOINTS.admin.userRole('user-123'),
        { role: 'admin' }
      );
    });

    it('resetPassword – should call POST /admin/users/:id/reset-password', async () => {
      await adminService.resetPassword('user-123', 'NewPass123!');
      expect(client.post).toHaveBeenCalledWith(
        ENDPOINTS.admin.resetPassword('user-123'),
        { newPassword: 'NewPass123!' }
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // TRANSACTION MANAGEMENT
  // ──────────────────────────────────────────────────────────
  describe('Transaction Management', () => {
    it('getTransactions – should call GET /admin/transactions with params', async () => {
      const params = { page: 1, limit: 50, type: 'expense', category: 'groceries' };
      await adminService.getTransactions(params);
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.transactions, expect.objectContaining({ params }));
    });

    it('getTransactions – should work without params', async () => {
      await adminService.getTransactions();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.transactions, expect.objectContaining({ params: {} }));
    });

    it('getTransactions – should support date filters', async () => {
      const params = { startDate: '2025-01-01', endDate: '2025-01-31', userId: 'user-abc' };
      await adminService.getTransactions(params);
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.transactions, expect.objectContaining({ params }));
    });

    it('getTransactionStats – should call GET /admin/transactions/stats', async () => {
      await adminService.getTransactionStats();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.transactionStats, expect.objectContaining({}));
    });

    it('getTransaction – should call GET /admin/transactions/:id', async () => {
      await adminService.getTransaction('txn-456');
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.transaction('txn-456'), expect.objectContaining({}));
    });

    it('deleteTransaction – should call DELETE /admin/transactions/:id', async () => {
      await adminService.deleteTransaction('txn-456');
      expect(client.delete).toHaveBeenCalledWith(ENDPOINTS.admin.transaction('txn-456'));
    });
  });

  // ──────────────────────────────────────────────────────────
  // SUBSCRIBER MANAGEMENT
  // ──────────────────────────────────────────────────────────
  describe('Subscriber Management', () => {
    it('getSubscribers – should call GET /admin/subscribers with params', async () => {
      const params = { page: 1, isConfirmed: true, language: 'de' };
      await adminService.getSubscribers(params);
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.subscribers, expect.objectContaining({ params }));
    });

    it('getSubscribers – should work without params', async () => {
      await adminService.getSubscribers();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.subscribers, expect.objectContaining({ params: {} }));
    });

    it('getSubscribers – should support search and language filter', async () => {
      const params = { search: 'anna', language: 'en', isConfirmed: false };
      await adminService.getSubscribers(params);
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.subscribers, expect.objectContaining({ params }));
    });

    it('getSubscriberStats – should call GET /admin/subscribers/stats', async () => {
      await adminService.getSubscriberStats();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.subscriberStats, expect.objectContaining({}));
    });

    it('getSubscriber – should call GET /admin/subscribers/:id', async () => {
      await adminService.getSubscriber('sub-789');
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.subscriber('sub-789'), expect.objectContaining({}));
    });

    it('deleteSubscriber – should call DELETE /admin/subscribers/:id', async () => {
      await adminService.deleteSubscriber('sub-789');
      expect(client.delete).toHaveBeenCalledWith(ENDPOINTS.admin.subscriber('sub-789'));
    });
  });

  // ──────────────────────────────────────────────────────────
  // AUDIT LOG
  // ──────────────────────────────────────────────────────────
  describe('Audit Log', () => {
    it('getAuditLogs – should call GET /admin/audit-log with params', async () => {
      const params = { page: 1, action: 'USER_BANNED', adminId: 'admin-1' };
      await adminService.getAuditLogs(params);
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.auditLog, expect.objectContaining({ params }));
    });

    it('getAuditLogs – should work without params', async () => {
      await adminService.getAuditLogs();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.auditLog, expect.objectContaining({ params: {} }));
    });

    it('getAuditLogs – should support date range filter', async () => {
      const params = { startDate: '2025-01-01', endDate: '2025-02-01', targetUserId: 'user-100' };
      await adminService.getAuditLogs(params);
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.auditLog, expect.objectContaining({ params }));
    });

    it('getAuditLogStats – should call GET /admin/audit-log/stats', async () => {
      await adminService.getAuditLogStats();
      expect(client.get).toHaveBeenCalledWith(ENDPOINTS.admin.auditLogStats, expect.objectContaining({}));
    });
  });

  // ──────────────────────────────────────────────────────────
  // ENDPOINTS STRUCTURE
  // ──────────────────────────────────────────────────────────
  describe('Endpoints', () => {
    it('should have correct base paths', () => {
      expect(ENDPOINTS.admin.stats).toBe('/api/v1/admin/stats');
      expect(ENDPOINTS.admin.users).toBe('/api/v1/admin/users');
      expect(ENDPOINTS.admin.transactions).toBe('/api/v1/admin/transactions');
      expect(ENDPOINTS.admin.subscribers).toBe('/api/v1/admin/subscribers');
      expect(ENDPOINTS.admin.auditLog).toBe('/api/v1/admin/audit-log');
    });

    it('should have correct dynamic paths', () => {
      expect(ENDPOINTS.admin.user('abc')).toBe('/api/v1/admin/users/abc');
      expect(ENDPOINTS.admin.banUser('abc')).toBe('/api/v1/admin/users/abc/ban');
      expect(ENDPOINTS.admin.unbanUser('abc')).toBe('/api/v1/admin/users/abc/unban');
      expect(ENDPOINTS.admin.userRole('abc')).toBe('/api/v1/admin/users/abc/role');
      expect(ENDPOINTS.admin.resetPassword('abc')).toBe('/api/v1/admin/users/abc/reset-password');
      expect(ENDPOINTS.admin.transaction('xyz')).toBe('/api/v1/admin/transactions/xyz');
      expect(ENDPOINTS.admin.subscriber('xyz')).toBe('/api/v1/admin/subscribers/xyz');
    });

    it('should have stats sub-endpoints', () => {
      expect(ENDPOINTS.admin.transactionStats).toBe('/api/v1/admin/transactions/stats');
      expect(ENDPOINTS.admin.subscriberStats).toBe('/api/v1/admin/subscribers/stats');
      expect(ENDPOINTS.admin.auditLogStats).toBe('/api/v1/admin/audit-log/stats');
    });
  });

  // ──────────────────────────────────────────────────────────
  // RETURN VALUES
  // ──────────────────────────────────────────────────────────
  describe('Return Values', () => {
    it('all methods should return promises', () => {
      const methods = [
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getUser('id'),
        adminService.createUser({}),
        adminService.updateUser('id', {}),
        adminService.deleteUser('id'),
        adminService.deleteAllUsers(),
        adminService.banUser('id'),
        adminService.unbanUser('id'),
        adminService.changeUserRole('id', 'admin'),
        adminService.resetPassword('id', 'pw'),
        adminService.getTransactions(),
        adminService.getTransactionStats(),
        adminService.getTransaction('id'),
        adminService.deleteTransaction('id'),
        adminService.getSubscribers(),
        adminService.getSubscriberStats(),
        adminService.getSubscriber('id'),
        adminService.deleteSubscriber('id'),
        adminService.getAuditLogs(),
        adminService.getAuditLogStats(),
      ];

      methods.forEach((method) => {
        expect(method).toBeInstanceOf(Promise);
      });
    });
  });
});
