/**
 * @fileoverview Report Scheduler Service Tests
 * Tests für calculateReportData, sendWeeklyReports, sendMonthlyReports, sendReportToUser
 */

const reportScheduler = require('../../src/services/reportScheduler');
const Transaction = require('../../src/models/Transaction');
const User = require('../../src/models/User');
const emailService = require('../../src/utils/emailService');

// Mock dependencies
jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/emailService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('ReportScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // calculateReportData Tests
  // ============================================
  describe('calculateReportData', () => {
    const userId = 'user-123';
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-02-28');

    it('should calculate income, expenses and balance correctly', async () => {
      Transaction.find.mockResolvedValue([
        { type: 'income', amount: 3000, category: 'salary' },
        { type: 'income', amount: 500, category: 'freelance' },
        { type: 'expense', amount: 200, category: 'Lebensmittel' },
        { type: 'expense', amount: 800, category: 'Miete' },
        { type: 'expense', amount: 150, category: 'Transport' },
      ]);

      const result = await reportScheduler.calculateReportData(userId, startDate, endDate);

      expect(result.income).toBe(3500);
      expect(result.expenses).toBe(1150);
      expect(result.balance).toBe(2350);
      expect(result.transactionCount).toBe(5);
    });

    it('should return top 5 expense categories sorted by amount', async () => {
      Transaction.find.mockResolvedValue([
        { type: 'expense', amount: 800, category: 'Miete' },
        { type: 'expense', amount: 400, category: 'Lebensmittel' },
        { type: 'expense', amount: 300, category: 'Transport' },
        { type: 'expense', amount: 200, category: 'Unterhaltung' },
        { type: 'expense', amount: 150, category: 'Kleidung' },
        { type: 'expense', amount: 100, category: 'Sonstiges' },
      ]);

      const result = await reportScheduler.calculateReportData(userId, startDate, endDate);

      expect(result.topCategories).toHaveLength(5);
      expect(result.topCategories[0]).toEqual({ category: 'Miete', amount: 800 });
      expect(result.topCategories[4]).toEqual({ category: 'Kleidung', amount: 150 });
      // "Sonstiges" (100) should be excluded (only top 5)
    });

    it('should aggregate amounts for same category', async () => {
      Transaction.find.mockResolvedValue([
        { type: 'expense', amount: 50, category: 'Lebensmittel' },
        { type: 'expense', amount: 30, category: 'Lebensmittel' },
        { type: 'expense', amount: 80, category: 'Lebensmittel' },
      ]);

      const result = await reportScheduler.calculateReportData(userId, startDate, endDate);

      expect(result.topCategories).toHaveLength(1);
      expect(result.topCategories[0]).toEqual({ category: 'Lebensmittel', amount: 160 });
    });

    it('should return zeros when no transactions exist', async () => {
      Transaction.find.mockResolvedValue([]);

      const result = await reportScheduler.calculateReportData(userId, startDate, endDate);

      expect(result.income).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.topCategories).toEqual([]);
    });

    it('should include formatted date range in result', async () => {
      Transaction.find.mockResolvedValue([]);

      const result = await reportScheduler.calculateReportData(userId, startDate, endDate);

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      // Dates are formatted with toLocaleDateString('de-DE')
      expect(typeof result.startDate).toBe('string');
      expect(typeof result.endDate).toBe('string');
    });

    it('should query transactions with correct date range', async () => {
      Transaction.find.mockResolvedValue([]);

      await reportScheduler.calculateReportData(userId, startDate, endDate);

      expect(Transaction.find).toHaveBeenCalledWith({
        userId,
        date: { $gte: startDate, $lte: endDate },
      });
    });

    it('should only count income transactions for income total', async () => {
      Transaction.find.mockResolvedValue([
        { type: 'income', amount: 1000, category: 'salary' },
        { type: 'expense', amount: 500, category: 'Miete' },
      ]);

      const result = await reportScheduler.calculateReportData(userId, startDate, endDate);

      expect(result.income).toBe(1000);
      expect(result.expenses).toBe(500);
    });
  });

  // ============================================
  // sendWeeklyReports Tests
  // ============================================
  describe('sendWeeklyReports', () => {
    const mockEligibleUser = {
      _id: 'user-1',
      email: 'test@example.com',
      isVerified: true,
      preferences: {
        emailNotifications: true,
        notificationCategories: { reports: true },
      },
    };

    it('should find eligible users with correct query', async () => {
      User.find.mockResolvedValue([]);

      await reportScheduler.sendWeeklyReports();

      expect(User.find).toHaveBeenCalledWith({
        email: { $exists: true, $ne: null },
        isVerified: true,
        'preferences.emailNotifications': true,
        'preferences.notificationCategories.reports': true,
      });
    });

    it('should send reports to users with transactions', async () => {
      User.find.mockResolvedValue([mockEligibleUser]);
      Transaction.find.mockResolvedValue([
        { type: 'expense', amount: 50, category: 'Food' },
      ]);
      emailService.sendFinancialReport.mockResolvedValue({ sent: true });

      const result = await reportScheduler.sendWeeklyReports();

      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expect(emailService.sendFinancialReport).toHaveBeenCalledWith(
        mockEligibleUser,
        expect.objectContaining({ transactionCount: 1 }),
        'weekly'
      );
    });

    it('should skip users with no transactions in period', async () => {
      User.find.mockResolvedValue([mockEligibleUser]);
      Transaction.find.mockResolvedValue([]);

      const result = await reportScheduler.sendWeeklyReports();

      expect(result.skipped).toBe(1);
      expect(result.sent).toBe(0);
      expect(emailService.sendFinancialReport).not.toHaveBeenCalled();
    });

    it('should count failed emails correctly', async () => {
      User.find.mockResolvedValue([mockEligibleUser]);
      Transaction.find.mockRejectedValue(new Error('DB error'));

      const result = await reportScheduler.sendWeeklyReports();

      expect(result.failed).toBe(1);
      expect(result.sent).toBe(0);
    });

    it('should handle email send returning sent:false as skipped', async () => {
      User.find.mockResolvedValue([mockEligibleUser]);
      Transaction.find.mockResolvedValue([
        { type: 'income', amount: 100, category: 'salary' },
      ]);
      emailService.sendFinancialReport.mockResolvedValue({ sent: false });

      const result = await reportScheduler.sendWeeklyReports();

      expect(result.skipped).toBe(1);
      expect(result.sent).toBe(0);
    });

    it('should process multiple users independently', async () => {
      const users = [
        { ...mockEligibleUser, _id: 'user-1' },
        { ...mockEligibleUser, _id: 'user-2' },
        { ...mockEligibleUser, _id: 'user-3' },
      ];
      User.find.mockResolvedValue(users);

      // user-1: has transactions, email sent
      // user-2: no transactions (skipped)
      // user-3: email fails
      let callCount = 0;
      Transaction.find.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve([{ type: 'expense', amount: 50, category: 'Food' }]);
        if (callCount === 2) return Promise.resolve([]);
        return Promise.reject(new Error('DB error'));
      });
      emailService.sendFinancialReport.mockResolvedValue({ sent: true });

      const result = await reportScheduler.sendWeeklyReports();

      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(3);
    });

    it('should return correct total count', async () => {
      User.find.mockResolvedValue([mockEligibleUser, { ...mockEligibleUser, _id: 'user-2' }]);
      Transaction.find.mockResolvedValue([]);

      const result = await reportScheduler.sendWeeklyReports();

      expect(result.total).toBe(2);
    });
  });

  // ============================================
  // sendMonthlyReports Tests
  // ============================================
  describe('sendMonthlyReports', () => {
    const mockUser = {
      _id: 'user-1',
      email: 'test@example.com',
      isVerified: true,
      preferences: {
        emailNotifications: true,
        notificationCategories: { reports: true },
      },
    };

    it('should send monthly reports with correct period parameter', async () => {
      User.find.mockResolvedValue([mockUser]);
      Transaction.find.mockResolvedValue([
        { type: 'expense', amount: 100, category: 'Miete' },
      ]);
      emailService.sendFinancialReport.mockResolvedValue({ sent: true });

      await reportScheduler.sendMonthlyReports();

      expect(emailService.sendFinancialReport).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ transactionCount: 1 }),
        'monthly'
      );
    });

    it('should skip users with zero transactions', async () => {
      User.find.mockResolvedValue([mockUser]);
      Transaction.find.mockResolvedValue([]);

      const result = await reportScheduler.sendMonthlyReports();

      expect(result.skipped).toBe(1);
      expect(result.sent).toBe(0);
    });

    it('should handle errors gracefully per user', async () => {
      User.find.mockResolvedValue([mockUser]);
      Transaction.find.mockRejectedValue(new Error('Connection lost'));

      const result = await reportScheduler.sendMonthlyReports();

      expect(result.failed).toBe(1);
      expect(result.sent).toBe(0);
    });
  });

  // ============================================
  // sendReportToUser Tests
  // ============================================
  describe('sendReportToUser', () => {
    const userId = 'user-123';

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      const result = await reportScheduler.sendReportToUser(userId);

      expect(result).toEqual({ sent: false, reason: 'USER_NOT_FOUND' });
    });

    it('should return NO_VERIFIED_EMAIL when user has no email', async () => {
      User.findById.mockResolvedValue({ _id: userId, email: null, isVerified: false });

      const result = await reportScheduler.sendReportToUser(userId);

      expect(result).toEqual({ sent: false, reason: 'NO_VERIFIED_EMAIL' });
    });

    it('should return NO_VERIFIED_EMAIL when email is not verified', async () => {
      User.findById.mockResolvedValue({ _id: userId, email: 'test@example.com', isVerified: false });

      const result = await reportScheduler.sendReportToUser(userId);

      expect(result).toEqual({ sent: false, reason: 'NO_VERIFIED_EMAIL' });
    });

    it('should send weekly report by default', async () => {
      const mockUser = { _id: userId, email: 'test@example.com', isVerified: true };
      User.findById.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue([
        { type: 'expense', amount: 50, category: 'Food' },
      ]);
      emailService.sendFinancialReport.mockResolvedValue({ sent: true });

      await reportScheduler.sendReportToUser(userId);

      expect(emailService.sendFinancialReport).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
        'weekly'
      );
    });

    it('should send monthly report when period is monthly', async () => {
      const mockUser = { _id: userId, email: 'test@example.com', isVerified: true };
      User.findById.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue([]);
      emailService.sendFinancialReport.mockResolvedValue({ sent: true });

      await reportScheduler.sendReportToUser(userId, 'monthly');

      expect(emailService.sendFinancialReport).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
        'monthly'
      );
    });

    it('should pass calculated report data to email service', async () => {
      const mockUser = { _id: userId, email: 'test@example.com', isVerified: true };
      User.findById.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue([
        { type: 'income', amount: 2000, category: 'salary' },
        { type: 'expense', amount: 300, category: 'Miete' },
      ]);
      emailService.sendFinancialReport.mockResolvedValue({ sent: true });

      await reportScheduler.sendReportToUser(userId, 'weekly');

      expect(emailService.sendFinancialReport).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          income: 2000,
          expenses: 300,
          balance: 1700,
          transactionCount: 2,
        }),
        'weekly'
      );
    });

    it('should return email service result directly', async () => {
      const mockUser = { _id: userId, email: 'test@example.com', isVerified: true };
      User.findById.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue([]);
      emailService.sendFinancialReport.mockResolvedValue({ sent: true, messageId: 'abc-123' });

      const result = await reportScheduler.sendReportToUser(userId, 'weekly');

      expect(result).toEqual({ sent: true, messageId: 'abc-123' });
    });
  });
});
