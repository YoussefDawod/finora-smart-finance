/**
 * @fileoverview Lifecycle Scheduler Tests
 * Tests für den täglichen Retention-Verarbeitungs-Scheduler
 */

const lifecycleScheduler = require('../../src/services/lifecycleScheduler');
const transactionLifecycleService = require('../../src/services/transactionLifecycleService');
const auditLogService = require('../../src/services/auditLogService');

// Mock dependencies
jest.mock('../../src/services/transactionLifecycleService');
jest.mock('../../src/services/auditLogService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('Lifecycle Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lifecycleScheduler.resetSchedulerState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================
  // checkAndProcessRetention
  // ============================================
  describe('checkAndProcessRetention', () => {
    it('should skip processing before PROCESSING_HOUR', async () => {
      // Simuliere 2:00 Uhr (vor 3:00)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(2);

      const result = await lifecycleScheduler.checkAndProcessRetention();

      expect(result.executed).toBe(false);
      expect(result.reason).toBe('TOO_EARLY');
      expect(transactionLifecycleService.processRetentionForAllUsers).not.toHaveBeenCalled();
    });

    it('should execute processing at PROCESSING_HOUR', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);

      const mockStats = {
        processed: 10,
        reminders: 2,
        finalWarnings: 1,
        deletions: 0,
        errors: 0,
        skipped: 7,
      };
      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue(mockStats);

      const result = await lifecycleScheduler.checkAndProcessRetention();

      expect(result.executed).toBe(true);
      expect(result.stats).toEqual(mockStats);
      expect(transactionLifecycleService.processRetentionForAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should execute processing after PROCESSING_HOUR', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12);

      const mockStats = {
        processed: 5,
        reminders: 0,
        finalWarnings: 0,
        deletions: 0,
        errors: 0,
        skipped: 5,
      };
      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue(mockStats);

      const result = await lifecycleScheduler.checkAndProcessRetention();

      expect(result.executed).toBe(true);
      expect(result.stats).toEqual(mockStats);
    });

    it('should not run twice on the same day', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);

      const mockStats = {
        processed: 1,
        reminders: 0,
        finalWarnings: 0,
        deletions: 0,
        errors: 0,
        skipped: 1,
      };
      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue(mockStats);

      // Erster Aufruf → soll laufen
      const first = await lifecycleScheduler.checkAndProcessRetention();
      expect(first.executed).toBe(true);

      // Zweiter Aufruf am selben Tag → soll übersprungen werden
      const second = await lifecycleScheduler.checkAndProcessRetention();
      expect(second.executed).toBe(false);
      expect(second.reason).toBe('ALREADY_PROCESSED_TODAY');
      expect(transactionLifecycleService.processRetentionForAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should log audit when reminders or warnings were sent', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);

      const mockStats = {
        processed: 10,
        reminders: 3,
        finalWarnings: 1,
        deletions: 0,
        errors: 0,
        skipped: 6,
      };
      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue(mockStats);
      auditLogService.log.mockResolvedValue({});

      await lifecycleScheduler.checkAndProcessRetention();

      expect(auditLogService.log).toHaveBeenCalledTimes(1);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETENTION_SCHEDULED_RUN',
          performedBy: null,
          details: expect.objectContaining({
            processed: 10,
            reminders: 3,
            finalWarnings: 1,
          }),
        })
      );
    });

    it('should log audit when deletions occurred', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);

      const mockStats = {
        processed: 5,
        reminders: 0,
        finalWarnings: 0,
        deletions: 2,
        errors: 0,
        skipped: 3,
      };
      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue(mockStats);
      auditLogService.log.mockResolvedValue({});

      await lifecycleScheduler.checkAndProcessRetention();

      expect(auditLogService.log).toHaveBeenCalledTimes(1);
    });

    it('should NOT log audit when nothing happened', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);

      const mockStats = {
        processed: 5,
        reminders: 0,
        finalWarnings: 0,
        deletions: 0,
        errors: 0,
        skipped: 5,
      };
      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue(mockStats);

      await lifecycleScheduler.checkAndProcessRetention();

      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it('should handle processRetentionForAllUsers failure gracefully', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);
      transactionLifecycleService.processRetentionForAllUsers.mockRejectedValue(
        new Error('DB connection lost')
      );

      const result = await lifecycleScheduler.checkAndProcessRetention();

      expect(result.executed).toBe(false);
      expect(result.reason).toBe('DB connection lost');
    });

    it('should reset lastProcessingDate on failure to allow retry', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);
      transactionLifecycleService.processRetentionForAllUsers
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          processed: 1,
          reminders: 0,
          finalWarnings: 0,
          deletions: 0,
          errors: 0,
          skipped: 1,
        });

      // Erster Versuch → Fehler
      const first = await lifecycleScheduler.checkAndProcessRetention();
      expect(first.executed).toBe(false);

      // Zweiter Versuch → soll erneut versuchen (nicht als "already processed" blockiert)
      const second = await lifecycleScheduler.checkAndProcessRetention();
      expect(second.executed).toBe(true);
      expect(transactionLifecycleService.processRetentionForAllUsers).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // resetSchedulerState
  // ============================================
  describe('resetSchedulerState', () => {
    it('should reset state to allow re-processing', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);

      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue({
        processed: 1,
        reminders: 0,
        finalWarnings: 0,
        deletions: 0,
        errors: 0,
        skipped: 1,
      });

      // Erste Ausführung
      await lifecycleScheduler.checkAndProcessRetention();
      expect(transactionLifecycleService.processRetentionForAllUsers).toHaveBeenCalledTimes(1);

      // Reset
      lifecycleScheduler.resetSchedulerState();

      // Zweite Ausführung nach Reset
      await lifecycleScheduler.checkAndProcessRetention();
      expect(transactionLifecycleService.processRetentionForAllUsers).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // getLastProcessingDate
  // ============================================
  describe('getLastProcessingDate', () => {
    it('should return null initially', () => {
      expect(lifecycleScheduler.getLastProcessingDate()).toBeNull();
    });

    it('should return dateKey after processing', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(lifecycleScheduler.PROCESSING_HOUR);

      transactionLifecycleService.processRetentionForAllUsers.mockResolvedValue({
        processed: 0,
        reminders: 0,
        finalWarnings: 0,
        deletions: 0,
        errors: 0,
        skipped: 0,
      });

      await lifecycleScheduler.checkAndProcessRetention();

      const dateKey = lifecycleScheduler.getLastProcessingDate();
      expect(dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ============================================
  // PROCESSING_HOUR constant
  // ============================================
  describe('PROCESSING_HOUR', () => {
    it('should be set to 3 (3:00 AM)', () => {
      expect(lifecycleScheduler.PROCESSING_HOUR).toBe(3);
    });
  });
});
