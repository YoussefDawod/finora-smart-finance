/**
 * @fileoverview Budget Alert Service Tests
 * @description Unit-Tests für Budget-Limit-Prüfung und Negativ-Saldo-Warnung
 */

const budgetAlertService = require('../../src/services/budgetAlertService');
const Transaction = require('../../src/models/Transaction');
const emailService = require('../../src/utils/emailService');

// Mock dependencies
jest.mock('../../src/models/Transaction');
jest.mock('../../src/utils/emailService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('BudgetAlertService', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: 'user-123',
      email: 'max@example.com',
      preferences: {
        emailNotifications: true,
        notificationCategories: { alerts: true },
        currency: 'EUR',
        budget: {
          monthlyLimit: 1000,
          alertThreshold: 80,
          lastAlertSent: null,
          lastNegativeBalanceAlert: null,
        },
      },
      save: jest.fn().mockResolvedValue(true),
    };
  });

  // ============================================
  // checkBudgetAfterTransaction Tests
  // ============================================
  describe('checkBudgetAfterTransaction', () => {
    const expenseTransaction = {
      type: 'expense',
      amount: 200,
      category: 'Lebensmittel',
      description: 'Einkauf',
    };

    it('should skip non-expense transactions', async () => {
      const incomeTransaction = { type: 'income', amount: 3000 };

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, incomeTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('NOT_EXPENSE');
    });

    it('should skip if no budget set', async () => {
      mockUser.preferences.budget = null;

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('NO_BUDGET_SET');
    });

    it('should skip if budget limit is 0', async () => {
      mockUser.preferences.budget.monthlyLimit = 0;

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('NO_BUDGET_SET');
    });

    it('should skip if alerts are disabled', async () => {
      mockUser.preferences.emailNotifications = false;

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('ALERTS_DISABLED');
    });

    it('should skip if notification categories alerts disabled', async () => {
      mockUser.preferences.notificationCategories.alerts = false;

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('ALERTS_DISABLED');
    });

    it('should skip if alert was sent recently (cooldown)', async () => {
      mockUser.preferences.budget.lastAlertSent = new Date(); // Jetzt

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('ALERT_COOLDOWN');
    });

    it('should trigger alert when threshold exceeded', async () => {
      // 850 ausgegeben bei 1000 Limit = 85% >= 80% Threshold
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 850 }]);
      emailService.sendBudgetAlert = jest.fn().mockResolvedValue({ sent: true });

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(true);
      expect(result.triggered).toBe(true);
      expect(result.percentUsed).toBe(85);
      expect(emailService.sendBudgetAlert).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          totalSpent: 850,
          limit: 1000,
          percentUsed: 85,
          threshold: 80,
        })
      );
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should trigger alert when over 100% budget', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 1200 }]);
      emailService.sendBudgetAlert = jest.fn().mockResolvedValue({ sent: true });

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.triggered).toBe(true);
      expect(result.percentUsed).toBe(120);
      expect(emailService.sendBudgetAlert).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          exceededBy: 200,
          remainingBudget: 0,
        })
      );
    });

    it('should not trigger when below threshold', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 500 }]);

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(true);
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('BELOW_THRESHOLD');
      expect(result.percentUsed).toBe(50);
      expect(emailService.sendBudgetAlert).not.toHaveBeenCalled();
    });

    it('should handle empty aggregate result', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.checked).toBe(true);
      expect(result.triggered).toBe(false);
      expect(result.percentUsed).toBe(0);
    });

    it('should not update lastAlertSent if email fails', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 900 }]);
      emailService.sendBudgetAlert = jest.fn().mockResolvedValue({ sent: false });

      const result = await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(result.triggered).toBe(true);
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('should include latest transaction in alert data', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 900 }]);
      emailService.sendBudgetAlert = jest.fn().mockResolvedValue({ sent: true });

      await budgetAlertService.checkBudgetAfterTransaction(mockUser, expenseTransaction);

      expect(emailService.sendBudgetAlert).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          latestTransaction: {
            amount: 200,
            category: 'Lebensmittel',
            description: 'Einkauf',
          },
        })
      );
    });
  });

  // ============================================
  // getBudgetStatus Tests
  // ============================================
  describe('getBudgetStatus', () => {
    it('should return hasBudget:false if no budget set', async () => {
      mockUser.preferences.budget = null;

      const result = await budgetAlertService.getBudgetStatus(mockUser);

      expect(result.hasBudget).toBe(false);
    });

    it('should return hasBudget:false if limit is 0', async () => {
      mockUser.preferences.budget.monthlyLimit = 0;

      const result = await budgetAlertService.getBudgetStatus(mockUser);

      expect(result.hasBudget).toBe(false);
    });

    it('should return full budget status', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 600 }]);

      const result = await budgetAlertService.getBudgetStatus(mockUser);

      expect(result).toEqual({
        hasBudget: true,
        monthlyLimit: 1000,
        totalSpent: 600,
        remainingBudget: 400,
        percentUsed: 60,
        alertThreshold: 80,
        isOverBudget: false,
        isNearLimit: false,
      });
    });

    it('should detect over-budget status', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 1500 }]);

      const result = await budgetAlertService.getBudgetStatus(mockUser);

      expect(result.isOverBudget).toBe(true);
      expect(result.isNearLimit).toBe(true);
      expect(result.remainingBudget).toBe(0);
      expect(result.percentUsed).toBe(150);
    });

    it('should detect near-limit status', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: 850 }]);

      const result = await budgetAlertService.getBudgetStatus(mockUser);

      expect(result.isNearLimit).toBe(true);
      expect(result.isOverBudget).toBe(false);
    });

    it('should handle no expenses this month', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await budgetAlertService.getBudgetStatus(mockUser);

      expect(result.totalSpent).toBe(0);
      expect(result.percentUsed).toBe(0);
      expect(result.remainingBudget).toBe(1000);
    });
  });

  // ============================================
  // checkNegativeBalanceAlert Tests
  // ============================================
  describe('checkNegativeBalanceAlert', () => {
    const expenseTransaction = {
      type: 'expense',
      amount: 500,
      category: 'Miete',
      description: 'Monatsmiete',
    };

    it('should skip non-expense transactions', async () => {
      const result = await budgetAlertService.checkNegativeBalanceAlert(
        mockUser,
        { type: 'income', amount: 3000 }
      );

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('NOT_EXPENSE');
    });

    it('should skip if alerts disabled', async () => {
      mockUser.preferences.emailNotifications = false;

      const result = await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('ALERTS_DISABLED');
    });

    it('should skip if negative alert sent recently (weekly cooldown)', async () => {
      mockUser.preferences.budget.lastNegativeBalanceAlert = new Date(); // Jetzt

      const result = await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(result.checked).toBe(false);
      expect(result.reason).toBe('NEGATIVE_ALERT_COOLDOWN');
    });

    it('should trigger alert when balance is negative', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: 'income', total: 2000 },
        { _id: 'expense', total: 3000 },
      ]);
      emailService.sendBudgetAlert = jest.fn().mockResolvedValue({ sent: true });

      const result = await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(result.checked).toBe(true);
      expect(result.triggered).toBe(true);
      expect(result.balance).toBe(-1000);
      expect(emailService.sendBudgetAlert).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          balance: -1000,
          deficit: 1000,
          alertType: 'negative_balance',
        })
      );
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should not trigger when balance is positive', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: 'income', total: 5000 },
        { _id: 'expense', total: 3000 },
      ]);

      const result = await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(result.checked).toBe(true);
      expect(result.triggered).toBe(false);
      expect(result.balance).toBe(2000);
      expect(result.reason).toBe('BALANCE_POSITIVE');
    });

    it('should not trigger when balance is zero', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: 'income', total: 3000 },
        { _id: 'expense', total: 3000 },
      ]);

      const result = await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(result.triggered).toBe(false);
      expect(result.balance).toBe(0);
    });

    it('should handle user with no transactions', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([]);

      const result = await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(result.triggered).toBe(false);
      expect(result.balance).toBe(0);
    });

    it('should create budget object if not exists for lastNegativeBalanceAlert', async () => {
      mockUser.preferences.budget = undefined;
      // Re-set so alert check passes (no cooldown, no budget preferences to check)
      mockUser.preferences = {
        emailNotifications: true,
        notificationCategories: { alerts: true },
        currency: 'EUR',
      };

      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: 'income', total: 1000 },
        { _id: 'expense', total: 2000 },
      ]);
      emailService.sendBudgetAlert = jest.fn().mockResolvedValue({ sent: true });

      const result = await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(result.triggered).toBe(true);
      expect(mockUser.preferences.budget).toBeDefined();
      expect(mockUser.preferences.budget.lastNegativeBalanceAlert).toBeDefined();
    });

    it('should not update lastNegativeBalanceAlert if email not sent', async () => {
      Transaction.aggregate = jest.fn().mockResolvedValue([
        { _id: 'income', total: 1000 },
        { _id: 'expense', total: 3000 },
      ]);
      emailService.sendBudgetAlert = jest.fn().mockResolvedValue({ sent: false });

      await budgetAlertService.checkNegativeBalanceAlert(mockUser, expenseTransaction);

      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });
});
