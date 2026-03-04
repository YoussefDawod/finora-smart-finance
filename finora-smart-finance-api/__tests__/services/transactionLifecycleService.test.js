/**
 * @fileoverview Transaction Lifecycle Service Tests
 * @description Unit-Tests für Retention-Management, Erinnerungen, Smart-Löschung,
 *              Lifecycle-Status und Login-Toasts
 */

const lifecycleService = require('../../src/services/transactionLifecycleService');
const User = require('../../src/models/User');
const Transaction = require('../../src/models/Transaction');
const auditLogService = require('../../src/services/auditLogService');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/models/Transaction');
jest.mock('../../src/services/auditLogService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('TransactionLifecycleService', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    mockUser = {
      _id: 'user-123',
      name: 'Max Mustermann',
      email: 'max@example.com',
      isVerified: true,
      isActive: true,
      role: 'user',
      preferences: {
        emailNotifications: true,
      },
      transactionLifecycle: {
        monthlyTransactionCount: 0,
        monthlyCountResetAt: null,
        retentionNotifications: {
          reminderStartedAt: null,
          lastReminderSentAt: null,
          reminderCount: 0,
          finalWarningSentAt: null,
          exportConfirmedAt: null,
          deletionExecutedAt: null,
          deletionNotificationSentAt: null,
          lastLoginToastShownAt: null,
        },
      },
      save: jest.fn().mockResolvedValue(true),
    };
  });

  // ============================================
  // HILFSFUNKTIONEN Tests
  // ============================================

  describe('monthsAgo', () => {
    it('should return a date X months in the past', () => {
      const result = lifecycleService.monthsAgo(12);
      const now = new Date();
      const expected = new Date();
      expected.setMonth(expected.getMonth() - 12);

      // Toleranz: ±1 Sekunde
      expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('should handle 0 months', () => {
      const result = lifecycleService.monthsAgo(0);
      const now = new Date();
      expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(1000);
    });

    it('should handle crossing year boundary', () => {
      const result = lifecycleService.monthsAgo(24);
      const expected = new Date();
      expected.setMonth(expected.getMonth() - 24);
      expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
    });
  });

  describe('daysAgo', () => {
    it('should return a date X days in the past', () => {
      const result = lifecycleService.daysAgo(7);
      const expected = new Date();
      expected.setDate(expected.getDate() - 7);
      expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('should handle 0 days', () => {
      const result = lifecycleService.daysAgo(0);
      const now = new Date();
      expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('isGracePeriodExpired', () => {
    it('should return false when reminderStartedAt is null', () => {
      expect(lifecycleService.isGracePeriodExpired({})).toBe(false);
      expect(lifecycleService.isGracePeriodExpired(null)).toBe(false);
    });

    it('should return false when within grace period (3 months)', () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const result = lifecycleService.isGracePeriodExpired({
        reminderStartedAt: twoMonthsAgo,
      });

      expect(result).toBe(false);
    });

    it('should return true when grace period expired (+3 months)', () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

      const result = lifecycleService.isGracePeriodExpired({
        reminderStartedAt: fourMonthsAgo,
      });

      expect(result).toBe(true);
    });

    it('should return true exactly at 3-month boundary', () => {
      const exactlyThreeMonths = new Date();
      exactlyThreeMonths.setMonth(exactlyThreeMonths.getMonth() - 3);
      exactlyThreeMonths.setSeconds(exactlyThreeMonths.getSeconds() - 1);

      const result = lifecycleService.isGracePeriodExpired({
        reminderStartedAt: exactlyThreeMonths,
      });

      expect(result).toBe(true);
    });
  });

  describe('isFinalWeekExpired', () => {
    it('should return false when finalWarningSentAt is null', () => {
      expect(lifecycleService.isFinalWeekExpired({})).toBe(false);
      expect(lifecycleService.isFinalWeekExpired(null)).toBe(false);
    });

    it('should return false when within final week', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const result = lifecycleService.isFinalWeekExpired({
        finalWarningSentAt: threeDaysAgo,
      });

      expect(result).toBe(false);
    });

    it('should return true when final week expired', () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const result = lifecycleService.isFinalWeekExpired({
        finalWarningSentAt: eightDaysAgo,
      });

      expect(result).toBe(true);
    });

    it('should return true exactly at 7-day boundary', () => {
      const exactlySeven = new Date();
      exactlySeven.setDate(exactlySeven.getDate() - 7);
      exactlySeven.setSeconds(exactlySeven.getSeconds() - 1);

      const result = lifecycleService.isFinalWeekExpired({
        finalWarningSentAt: exactlySeven,
      });

      expect(result).toBe(true);
    });
  });

  describe('canSendReminder', () => {
    it('should return true when lastReminderSentAt is null (never sent)', () => {
      expect(lifecycleService.canSendReminder({})).toBe(true);
    });

    it('should return false when reminder sent within cooldown (7 days)', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const result = lifecycleService.canSendReminder({
        lastReminderSentAt: threeDaysAgo,
      });

      expect(result).toBe(false);
    });

    it('should return true when cooldown expired', () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const result = lifecycleService.canSendReminder({
        lastReminderSentAt: eightDaysAgo,
      });

      expect(result).toBe(true);
    });
  });

  // ============================================
  // checkOldTransactions Tests
  // ============================================

  describe('checkOldTransactions', () => {
    it('should return false when no old transactions exist', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await lifecycleService.checkOldTransactions('user-123');

      expect(result.hasOldTransactions).toBe(false);
      expect(result.oldestDate).toBeNull();
      expect(result.count).toBe(0);
    });

    it('should return transaction info when old transactions exist', async () => {
      const oldDate = new Date('2022-06-01');
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 42, oldestDate: oldDate },
      ]);

      const result = await lifecycleService.checkOldTransactions('user-123');

      expect(result.hasOldTransactions).toBe(true);
      expect(result.oldestDate).toEqual(oldDate);
      expect(result.count).toBe(42);
    });

    it('should use correct cutoff date (12 months ago)', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      await lifecycleService.checkOldTransactions('user-123');

      const callArgs = Transaction.aggregate.mock.calls[0][0];
      const matchStage = callArgs[0].$match;

      expect(matchStage.userId).toBe('user-123');
      expect(matchStage.date.$lt).toBeDefined();

      // Cutoff sollte ~12 Monate in der Vergangenheit liegen
      const expectedCutoff = new Date();
      expectedCutoff.setMonth(expectedCutoff.getMonth() - 12);
      expect(Math.abs(matchStage.date.$lt.getTime() - expectedCutoff.getTime())).toBeLessThan(2000);
    });
  });

  // ============================================
  // processRetentionForAllUsers Tests
  // ============================================

  describe('processRetentionForAllUsers', () => {
    it('should process all active users', async () => {
      const users = [
        { ...mockUser, _id: 'user-1', save: jest.fn().mockResolvedValue(true) },
        { ...mockUser, _id: 'user-2', save: jest.fn().mockResolvedValue(true) },
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(users),
      });

      // Keine alten Transaktionen
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const stats = await lifecycleService.processRetentionForAllUsers();

      expect(User.find).toHaveBeenCalledWith({
        isActive: true,
        role: 'user',
      });
      expect(stats.processed).toBe(2);
      expect(stats.errors).toBe(0);
    });

    it('should count skipped users with no old transactions', async () => {
      const users = [
        { ...mockUser, _id: 'user-1', save: jest.fn().mockResolvedValue(true) },
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(users),
      });

      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const stats = await lifecycleService.processRetentionForAllUsers();

      expect(stats.skipped).toBe(1);
      expect(stats.reminders).toBe(0);
    });

    it('should handle errors per user without stopping batch', async () => {
      const errorUser = {
        ...mockUser,
        _id: 'error-user',
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      };

      const goodUser = {
        ...mockUser,
        _id: 'good-user',
        save: jest.fn().mockResolvedValue(true),
      };

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([errorUser, goodUser]),
      });

      // Beide haben alte Transaktionen → Erinnerung starten → save wird aufgerufen
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-01-01') },
      ]);

      const stats = await lifecycleService.processRetentionForAllUsers();

      expect(stats.errors).toBe(1);
      expect(stats.processed).toBe(1); // goodUser geht durch
    });

    it('should handle fatal error when User.find fails', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Connection lost')),
      });

      const stats = await lifecycleService.processRetentionForAllUsers();

      expect(stats.errors).toBe(1);
      expect(stats.processed).toBe(0);
    });
  });

  // ============================================
  // processRetentionForUser Tests
  // ============================================

  describe('processRetentionForUser', () => {
    let stats;

    beforeEach(() => {
      stats = {
        processed: 0,
        reminders: 0,
        finalWarnings: 0,
        deletions: 0,
        errors: 0,
        skipped: 0,
      };
      auditLogService.log = jest.fn().mockResolvedValue(true);
    });

    it('should skip user with no old transactions', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(stats.skipped).toBe(1);
    });

    it('should reset retention status if no old transactions but had previous retention', async () => {
      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = new Date();
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt).toBeNull();
      expect(stats.skipped).toBe(1);
    });

    it('should start reminders when old transactions found and no reminders yet', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
      expect(stats.reminders).toBe(1);
    });

    it('should send weekly reminder when cooldown expired', async () => {
      // Erinnerungen laufen seit 2 Monaten, letzte vor 8 Tagen
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = twoMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt = eightDaysAgo;
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 5;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(6);
      expect(stats.reminders).toBe(1);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETENTION_REMINDER_SENT',
        })
      );
    });

    it('should skip reminder when cooldown not expired', async () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = twoMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt = threeDaysAgo;
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 5;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(stats.skipped).toBe(1);
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(5); // unverändert
    });

    it('should skip reminders when user has exported', async () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = twoMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt = eightDaysAgo;
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 3;
      mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt = new Date();

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      // Kein Reminder, weil exportiert
      expect(stats.skipped).toBe(1);
    });

    it('should send final warning when grace period expired', async () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = fourMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt = fourMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 12;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt).toBeDefined();
      expect(stats.finalWarnings).toBe(1);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETENTION_FINAL_WARNING_SENT',
        })
      );
    });

    it('should not send final warning twice', async () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = fourMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt = threeDaysAgo;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      await lifecycleService.processRetentionForUser(mockUser, stats);

      // Weder finalWarning noch deletion (final week nicht abgelaufen)
      expect(stats.skipped).toBe(1);
    });

    it('should delete expired transactions when final week expired', async () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = fourMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt = eightDaysAgo;

      // checkOldTransactions
      Transaction.aggregate = jest.fn()
        .mockResolvedValueOnce([{ _id: null, count: 10, oldestDate: new Date('2022-06-01') }])
        // deleteExpiredTransactions aggregation for stats
        .mockResolvedValueOnce([{
          _id: null,
          count: 10,
          totalIncome: 5000,
          totalExpense: 3000,
          oldestDate: new Date('2022-06-01'),
          newestDate: new Date('2023-01-01'),
        }]);

      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 10 });

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(Transaction.deleteMany).toHaveBeenCalled();
      expect(stats.deletions).toBe(1);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TRANSACTIONS_AUTO_DELETED',
        })
      );
    });

    it('should pass hasExported=true to deletion when user exported', async () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = fourMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt = eightDaysAgo;
      mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt = new Date();

      Transaction.aggregate = jest.fn()
        .mockResolvedValueOnce([{ _id: null, count: 5, oldestDate: new Date('2022-06-01') }])
        .mockResolvedValueOnce([{
          _id: null,
          count: 5,
          totalIncome: 2000,
          totalExpense: 1000,
          oldestDate: new Date('2022-06-01'),
          newestDate: new Date('2023-01-01'),
        }]);

      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

      await lifecycleService.processRetentionForUser(mockUser, stats);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            hasExported: true,
          }),
        })
      );
    });
  });

  // ============================================
  // deleteExpiredTransactions Tests
  // ============================================

  describe('deleteExpiredTransactions', () => {
    beforeEach(() => {
      auditLogService.log = jest.fn().mockResolvedValue(true);
    });

    it('should delete old transactions and update lifecycle fields', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{
        _id: null,
        count: 25,
        totalIncome: 10000,
        totalExpense: 8000,
        oldestDate: new Date('2022-01-01'),
        newestDate: new Date('2022-12-31'),
      }]);

      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 25 });

      await lifecycleService.deleteExpiredTransactions(mockUser, false);

      expect(Transaction.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          date: expect.objectContaining({ $lt: expect.any(Date) }),
        })
      );

      // Lifecycle wurde zurückgesetzt
      expect(mockUser.transactionLifecycle.retentionNotifications.deletionExecutedAt).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt).toBeNull();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(0);
      expect(mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt).toBeNull();
      expect(mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle empty aggregate result gracefully', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);
      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

      await lifecycleService.deleteExpiredTransactions(mockUser, false);

      expect(Transaction.deleteMany).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            deletedCount: 0,
            hasExported: false,
          }),
        })
      );
    });

    it('should differentiate exported vs not-exported in audit log', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{
        _id: null, count: 5, totalIncome: 0, totalExpense: 500,
      }]);
      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

      await lifecycleService.deleteExpiredTransactions(mockUser, true);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            hasExported: true,
          }),
        })
      );
    });

    it('should initialize transactionLifecycle if missing', async () => {
      mockUser.transactionLifecycle = null;

      Transaction.aggregate = jest.fn().mockResolvedValue([]);
      Transaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

      await lifecycleService.deleteExpiredTransactions(mockUser, false);

      expect(mockUser.transactionLifecycle).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // ============================================
  // sendFinalWarning Tests
  // ============================================

  describe('sendFinalWarning', () => {
    beforeEach(() => {
      auditLogService.log = jest.fn().mockResolvedValue(true);
    });

    it('should set finalWarningSentAt and log audit', async () => {
      await lifecycleService.sendFinalWarning(mockUser, 15);

      expect(mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETENTION_FINAL_WARNING_SENT',
          adminName: 'System/Lifecycle',
          targetUserId: 'user-123',
          targetUserName: 'Max Mustermann',
          details: expect.objectContaining({
            transactionCount: 15,
            daysRemaining: 7,
          }),
        })
      );
    });

    it('should initialize lifecycle fields if missing', async () => {
      mockUser.transactionLifecycle = null;

      await lifecycleService.sendFinalWarning(mockUser, 5);

      expect(mockUser.transactionLifecycle).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt).toBeDefined();
    });
  });

  // ============================================
  // sendWeeklyRetentionReminder Tests
  // ============================================

  describe('sendWeeklyRetentionReminder', () => {
    beforeEach(() => {
      auditLogService.log = jest.fn().mockResolvedValue(true);
    });

    it('should increment reminder count and update timestamp', async () => {
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 3;
      const oldDate = new Date('2022-06-01');

      await lifecycleService.sendWeeklyRetentionReminder(mockUser, oldDate, 10);

      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(4);
      expect(mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should log audit with correct details', async () => {
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 0;

      await lifecycleService.sendWeeklyRetentionReminder(mockUser, new Date('2022-01-01'), 20);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETENTION_REMINDER_SENT',
          details: expect.objectContaining({
            reminderCount: 1,
            transactionCount: 20,
          }),
        })
      );
    });
  });

  // ============================================
  // markExportConfirmed Tests
  // ============================================

  describe('markExportConfirmed', () => {
    beforeEach(() => {
      auditLogService.log = jest.fn().mockResolvedValue(true);
    });

    it('should set exportConfirmedAt and save', async () => {
      const result = await lifecycleService.markExportConfirmed(mockUser);

      expect(result.success).toBe(true);
      expect(mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should log audit on export confirmation', async () => {
      await lifecycleService.markExportConfirmed(mockUser);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_EXPORT_CONFIRMED',
          targetUserId: 'user-123',
        })
      );
    });

    it('should initialize lifecycle fields if missing', async () => {
      mockUser.transactionLifecycle = null;

      const result = await lifecycleService.markExportConfirmed(mockUser);

      expect(result.success).toBe(true);
      expect(mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt).toBeDefined();
    });
  });

  // ============================================
  // resetRetentionStatus Tests
  // ============================================

  describe('resetRetentionStatus', () => {
    it('should reset reminder fields but keep history', async () => {
      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = new Date();
      mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt = new Date();
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 10;
      mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt = new Date();
      mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt = new Date();
      mockUser.transactionLifecycle.retentionNotifications.deletionExecutedAt = new Date();

      await lifecycleService.resetRetentionStatus(mockUser);

      expect(mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt).toBeNull();
      expect(mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt).toBeNull();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(0);
      expect(mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt).toBeNull();
      // History bleibt erhalten
      expect(mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.deletionExecutedAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should do nothing if no retention notifications', async () => {
      mockUser.transactionLifecycle = null;

      await lifecycleService.resetRetentionStatus(mockUser);

      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // getLifecycleStatus Tests
  // ============================================

  describe('getLifecycleStatus', () => {
    it('should return active phase when no old transactions', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await lifecycleService.getLifecycleStatus(mockUser);

      expect(result.retention.phase).toBe('active');
      expect(result.retention.hasOldTransactions).toBe(false);
      expect(result.retention.daysUntilDeletion).toBeNull();
    });

    it('should return pending phase when old transactions but no reminders started', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLifecycleStatus(mockUser);

      expect(result.retention.phase).toBe('pending');
      expect(result.retention.hasOldTransactions).toBe(true);
      expect(result.retention.oldTransactionCount).toBe(5);
    });

    it('should return reminding phase with days until deletion', async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = oneMonthAgo;
      mockUser.transactionLifecycle.retentionNotifications.reminderCount = 3;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLifecycleStatus(mockUser);

      expect(result.retention.phase).toBe('reminding');
      expect(result.retention.daysUntilDeletion).toBeGreaterThan(0);
      expect(result.retention.daysUntilFinalWarning).toBeGreaterThan(0);
      expect(result.retention.reminderCount).toBe(3);
    });

    it('should return gracePeriodExpired phase when 3 months passed', async () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = fourMonthsAgo;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLifecycleStatus(mockUser);

      expect(result.retention.phase).toBe('gracePeriodExpired');
      expect(result.retention.daysUntilDeletion).toBe(7);
    });

    it('should return finalWarning phase with countdown', async () => {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt = fourMonthsAgo;
      mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt = twoDaysAgo;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 10, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLifecycleStatus(mockUser);

      expect(result.retention.phase).toBe('finalWarning');
      expect(result.retention.daysUntilDeletion).toBe(5); // 7 - 2 = 5
    });

    it('should include export confirmation date if set', async () => {
      const exportDate = new Date();
      mockUser.transactionLifecycle.retentionNotifications.exportConfirmedAt = exportDate;

      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await lifecycleService.getLifecycleStatus(mockUser);

      expect(result.retention.exportConfirmedAt).toBe(exportDate.toISOString());
    });

    it('should handle null oldest date', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await lifecycleService.getLifecycleStatus(mockUser);

      expect(result.retention.oldestTransactionDate).toBeNull();
    });
  });

  // ============================================
  // getLoginNotification Tests
  // ============================================

  describe('getLoginNotification', () => {
    it('should return false when no old transactions', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(false);
    });

    it('should return false when user has verified email and notifications enabled', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      // User bekommt bereits Emails
      mockUser.email = 'max@example.com';
      mockUser.isVerified = true;
      mockUser.preferences.emailNotifications = true;

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(false);
    });

    it('should show toast when user has no email', async () => {
      mockUser.email = null;
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(true);
      expect(result.notification.type).toBe('retention_reminder');
      expect(result.notification.severity).toBe('warning');
      expect(result.notification.transactionCount).toBe(5);
    });

    it('should show toast when email not verified', async () => {
      mockUser.isVerified = false;
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(true);
    });

    it('should show toast when email notifications disabled', async () => {
      mockUser.preferences.emailNotifications = false;
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(true);
    });

    it('should respect daily cooldown', async () => {
      mockUser.email = null;
      mockUser.transactionLifecycle.retentionNotifications.lastLoginToastShownAt = new Date();

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(false);
    });

    it('should show toast after cooldown expired', async () => {
      mockUser.email = null;
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      mockUser.transactionLifecycle.retentionNotifications.lastLoginToastShownAt = twoDaysAgo;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return error severity for final warning phase', async () => {
      mockUser.email = null;
      mockUser.transactionLifecycle.retentionNotifications.finalWarningSentAt = new Date();

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(true);
      expect(result.notification.severity).toBe('error');
      expect(result.notification.type).toBe('retention_final_warning');
    });

    it('should update lastLoginToastShownAt when toast is shown', async () => {
      mockUser.email = null;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      await lifecycleService.getLoginNotification(mockUser);

      expect(mockUser.transactionLifecycle.retentionNotifications.lastLoginToastShownAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should initialize lifecycle fields if missing', async () => {
      mockUser.email = null;
      mockUser.transactionLifecycle = null;

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: null, count: 5, oldestDate: new Date('2022-06-01') },
      ]);

      const result = await lifecycleService.getLoginNotification(mockUser);

      expect(result.showToast).toBe(true);
      expect(mockUser.transactionLifecycle).toBeDefined();
    });
  });

  // ============================================
  // getAdminLifecycleStats Tests
  // ============================================

  describe('getAdminLifecycleStats', () => {
    it('should return aggregated lifecycle statistics', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ total: 15 }]);
      User.countDocuments = jest.fn()
        .mockResolvedValueOnce(8)   // usersInReminding
        .mockResolvedValueOnce(2)   // usersInFinalWarning
        .mockResolvedValueOnce(5)   // usersExported
        .mockResolvedValueOnce(3)   // deletionsThisMonth
        .mockResolvedValueOnce(10)  // usersApproachingLimit
        .mockResolvedValueOnce(4);  // usersAtLimit

      const result = await lifecycleService.getAdminLifecycleStats();

      expect(result.usersWithOldTransactions).toBe(15);
      expect(result.usersInReminding).toBe(8);
      expect(result.usersInFinalWarning).toBe(2);
      expect(result.usersExported).toBe(5);
      expect(result.deletionsThisMonth).toBe(3);
      expect(result.usersApproachingLimit).toBe(10);
      expect(result.usersAtLimit).toBe(4);
    });

    it('should handle no data gracefully', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);
      User.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await lifecycleService.getAdminLifecycleStats();

      expect(result.usersWithOldTransactions).toBe(0);
      expect(result.usersInReminding).toBe(0);
    });

    it('should return zeros on error', async () => {
      Transaction.aggregate = jest.fn().mockRejectedValue(new Error('DB error'));

      const result = await lifecycleService.getAdminLifecycleStats();

      expect(result.usersWithOldTransactions).toBe(0);
      expect(result.usersInReminding).toBe(0);
      expect(result.usersInFinalWarning).toBe(0);
    });
  });

  // ============================================
  // Konstanten Tests
  // ============================================

  describe('Constants', () => {
    it('should export correct retention months', () => {
      expect(lifecycleService.RETENTION_MONTHS).toBe(12);
    });

    it('should export correct grace period months', () => {
      expect(lifecycleService.GRACE_PERIOD_MONTHS).toBe(3);
    });

    it('should export correct final warning days', () => {
      expect(lifecycleService.FINAL_WARNING_DAYS).toBe(7);
    });

    it('should export correct reminder cooldown days', () => {
      expect(lifecycleService.REMINDER_COOLDOWN_DAYS).toBe(7);
    });

    it('should export correct login toast cooldown days', () => {
      expect(lifecycleService.LOGIN_TOAST_COOLDOWN_DAYS).toBe(1);
    });
  });

  // ============================================
  // startRetentionReminders Tests
  // ============================================

  describe('startRetentionReminders', () => {
    it('should initialize retention fields and set count to 1', async () => {
      await lifecycleService.startRetentionReminders(
        mockUser,
        new Date('2022-06-01'),
        10
      );

      expect(mockUser.transactionLifecycle.retentionNotifications.reminderStartedAt).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.lastReminderSentAt).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should initialize lifecycle if completely missing', async () => {
      mockUser.transactionLifecycle = null;

      await lifecycleService.startRetentionReminders(
        mockUser,
        new Date('2022-06-01'),
        5
      );

      expect(mockUser.transactionLifecycle).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(1);
    });

    it('should initialize retentionNotifications if missing', async () => {
      mockUser.transactionLifecycle = {};

      await lifecycleService.startRetentionReminders(
        mockUser,
        new Date('2022-06-01'),
        5
      );

      expect(mockUser.transactionLifecycle.retentionNotifications).toBeDefined();
      expect(mockUser.transactionLifecycle.retentionNotifications.reminderCount).toBe(1);
    });
  });
});
