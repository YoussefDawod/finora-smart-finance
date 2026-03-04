/**
 * @fileoverview Lifecycle Email Service Tests
 * Tests für sendLifecycleEmail — Validierung, Template-Mapping, Error-Handling
 */

const { sendLifecycleEmail } = require('../../src/utils/emailService/lifecycleEmails');

// Mock emailTransport
jest.mock('../../src/utils/emailService/emailTransport', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const { sendEmail } = require('../../src/utils/emailService/emailTransport');

describe('Lifecycle Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const verifiedUser = {
    name: 'Max',
    email: 'max@test.com',
    isVerified: true,
    preferences: { emailNotifications: true, language: 'de' },
  };

  const reminderData = { oldestDate: new Date('2024-01-15'), count: 25, reminderNumber: 1 };

  // ============================================
  // Validierung
  // ============================================
  describe('validation', () => {
    it('should reject user without email', async () => {
      const user = { ...verifiedUser, email: null };
      const result = await sendLifecycleEmail(user, 'reminder', reminderData);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('NO_VERIFIED_EMAIL');
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should reject unverified user', async () => {
      const user = { ...verifiedUser, isVerified: false };
      const result = await sendLifecycleEmail(user, 'reminder', reminderData);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('NO_VERIFIED_EMAIL');
    });

    it('should reject user with disabled notifications', async () => {
      const user = {
        ...verifiedUser,
        preferences: { emailNotifications: false },
      };
      const result = await sendLifecycleEmail(user, 'reminder', reminderData);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('NOTIFICATIONS_DISABLED');
    });

    it('should reject unknown template type', async () => {
      const result = await sendLifecycleEmail(verifiedUser, 'unknown_type', {});

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('UNKNOWN_TEMPLATE');
    });
  });

  // ============================================
  // Erfolgreiches Senden
  // ============================================
  describe('successful sending', () => {
    it('should send reminder email', async () => {
      sendEmail.mockResolvedValue({ sent: true, messageId: 'msg-1' });

      const result = await sendLifecycleEmail(verifiedUser, 'reminder', reminderData);

      expect(result.sent).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        'max@test.com',
        expect.stringContaining('Erinnerung'),
        expect.stringContaining('Max')
      );
    });

    it('should send final warning email', async () => {
      sendEmail.mockResolvedValue({ sent: true, messageId: 'msg-2' });

      const result = await sendLifecycleEmail(verifiedUser, 'finalWarning', { count: 30, daysRemaining: 7 });

      expect(result.sent).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        'max@test.com',
        expect.stringContaining('Letzte Warnung'),
        expect.any(String)
      );
    });

    it('should send deletion-exported email', async () => {
      sendEmail.mockResolvedValue({ sent: true, messageId: 'msg-3' });

      const result = await sendLifecycleEmail(verifiedUser, 'deletionExported', {
        count: 45,
        totalIncome: 5000,
        totalExpense: 3200,
      });

      expect(result.sent).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        'max@test.com',
        expect.stringContaining('Export vorhanden'),
        expect.any(String)
      );
    });

    it('should send deletion-not-exported email', async () => {
      sendEmail.mockResolvedValue({ sent: true, messageId: 'msg-4' });

      const result = await sendLifecycleEmail(verifiedUser, 'deletionNotExported', {
        count: 45,
        totalIncome: 5000,
        totalExpense: 3200,
      });

      expect(result.sent).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        'max@test.com',
        expect.stringContaining('kein Export'),
        expect.any(String)
      );
    });
  });

  // ============================================
  // Sprachunterstützung
  // ============================================
  describe('language support', () => {
    it('should use English subject for English user', async () => {
      sendEmail.mockResolvedValue({ sent: true });
      const user = { ...verifiedUser, preferences: { emailNotifications: true, language: 'en' } };

      await sendLifecycleEmail(user, 'reminder', reminderData);

      expect(sendEmail).toHaveBeenCalledWith(
        'max@test.com',
        expect.stringContaining('Reminder'),
        expect.any(String)
      );
    });

    it('should use Arabic subject for Arabic user', async () => {
      sendEmail.mockResolvedValue({ sent: true });
      const user = { ...verifiedUser, preferences: { emailNotifications: true, language: 'ar' } };

      await sendLifecycleEmail(user, 'finalWarning', { count: 10, daysRemaining: 7 });

      expect(sendEmail).toHaveBeenCalledWith(
        'max@test.com',
        expect.stringContaining('تحذير أخير'),
        expect.any(String)
      );
    });

    it('should use Georgian subject for Georgian user', async () => {
      sendEmail.mockResolvedValue({ sent: true });
      const user = { ...verifiedUser, preferences: { emailNotifications: true, language: 'ka' } };

      await sendLifecycleEmail(user, 'reminder', reminderData);

      expect(sendEmail).toHaveBeenCalledWith(
        'max@test.com',
        expect.stringContaining('შეხსენება'),
        expect.any(String)
      );
    });
  });

  // ============================================
  // Error Handling
  // ============================================
  describe('error handling', () => {
    it('should handle sendEmail failure gracefully', async () => {
      sendEmail.mockRejectedValue(new Error('SMTP connection failed'));

      const result = await sendLifecycleEmail(verifiedUser, 'reminder', reminderData);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('SMTP connection failed');
    });

    it('should handle log-only mode (no SMTP configured)', async () => {
      sendEmail.mockResolvedValue({ sent: false, mode: 'log-only' });

      const result = await sendLifecycleEmail(verifiedUser, 'reminder', reminderData);

      expect(result.sent).toBe(false);
      expect(result.mode).toBe('log-only');
    });
  });
});
