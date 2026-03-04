/**
 * @fileoverview Admin Subscriber Service Tests
 * @description Unit-Tests für Admin Subscriber-Verwaltung (list, get, delete, stats)
 */

const adminService = require('../../src/services/adminService');
const Subscriber = require('../../src/models/Subscriber');

// Mock dependencies
jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Subscriber');
jest.mock('../../src/utils/userSanitizer', () => ({
  sanitizeUser: jest.fn((u) => u),
  sanitizeUsers: jest.fn((u) => u),
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../src/utils/emailService', () => ({
  sendNewsletterConfirmation: jest.fn().mockResolvedValue({ sent: true }),
}));

describe('AdminService – Subscriber-Verwaltung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // listSubscribers Tests
  // ============================================
  describe('listSubscribers', () => {
    const mockSubscribers = [
      { _id: 'sub-1', email: 'anna@test.com', isConfirmed: true, language: 'de' },
      { _id: 'sub-2', email: 'bob@test.com', isConfirmed: false, language: 'en' },
    ];

    function setupFindMock(data, total) {
      const chainable = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(data),
      };
      Subscriber.find = jest.fn().mockReturnValue(chainable);
      Subscriber.countDocuments = jest.fn().mockResolvedValue(total);
      return chainable;
    }

    it('should return paginated subscribers with defaults', async () => {
      setupFindMock(mockSubscribers, 2);

      const result = await adminService.listSubscribers();

      expect(result.subscribers).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        pages: 1,
        limit: 50,
      });
      expect(Subscriber.find).toHaveBeenCalledWith({});
    });

    it('should filter by isConfirmed=true (string)', async () => {
      setupFindMock([], 0);

      await adminService.listSubscribers({ isConfirmed: 'true' });

      expect(Subscriber.find).toHaveBeenCalledWith(
        expect.objectContaining({ isConfirmed: true })
      );
    });

    it('should filter by isConfirmed=true (boolean)', async () => {
      setupFindMock([], 0);

      await adminService.listSubscribers({ isConfirmed: true });

      expect(Subscriber.find).toHaveBeenCalledWith(
        expect.objectContaining({ isConfirmed: true })
      );
    });

    it('should filter by isConfirmed=false (string)', async () => {
      setupFindMock([], 0);

      await adminService.listSubscribers({ isConfirmed: 'false' });

      expect(Subscriber.find).toHaveBeenCalledWith(
        expect.objectContaining({ isConfirmed: false })
      );
    });

    it('should filter by language', async () => {
      setupFindMock([], 0);

      await adminService.listSubscribers({ language: 'de' });

      expect(Subscriber.find).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'de' })
      );
    });

    it('should apply search filter (email regex)', async () => {
      setupFindMock([], 0);

      await adminService.listSubscribers({ search: 'anna' });

      const query = Subscriber.find.mock.calls[0][0];
      expect(query.email).toEqual({ $regex: 'anna', $options: 'i' });
    });

    it('should ignore empty/whitespace-only search', async () => {
      setupFindMock([], 0);

      await adminService.listSubscribers({ search: '    ' });

      const query = Subscriber.find.mock.calls[0][0];
      expect(query.email).toBeUndefined();
    });

    it('should respect custom pagination', async () => {
      const chain = setupFindMock([], 100);

      await adminService.listSubscribers({ page: 2, limit: 25 });

      expect(chain.skip).toHaveBeenCalledWith(25); // (2-1)*25
      expect(chain.limit).toHaveBeenCalledWith(25);
    });

    it('should cap limit at 100', async () => {
      const chain = setupFindMock([], 0);

      await adminService.listSubscribers({ limit: 999 });

      expect(chain.limit).toHaveBeenCalledWith(100);
    });

    it('should default invalid page to 1', async () => {
      const chain = setupFindMock([], 0);

      await adminService.listSubscribers({ page: -3 });

      expect(chain.skip).toHaveBeenCalledWith(0);
    });

    it('should exclude sensitive token fields', async () => {
      const chain = setupFindMock(mockSubscribers, 2);

      await adminService.listSubscribers();

      expect(chain.select).toHaveBeenCalledWith(
        '-confirmationToken -confirmationExpires -unsubscribeToken'
      );
    });

    it('should combine multiple filters', async () => {
      setupFindMock([], 0);

      await adminService.listSubscribers({
        isConfirmed: true,
        language: 'en',
        search: 'bob',
      });

      const query = Subscriber.find.mock.calls[0][0];
      expect(query.isConfirmed).toBe(true);
      expect(query.language).toBe('en');
      expect(query.email).toEqual({ $regex: 'bob', $options: 'i' });
    });

    it('should calculate pages correctly', async () => {
      setupFindMock([], 75);

      const result = await adminService.listSubscribers({ limit: 25 });

      expect(result.pagination.pages).toBe(3);
    });
  });

  // ============================================
  // getSubscriberById Tests
  // ============================================
  describe('getSubscriberById', () => {
    it('should return subscriber without sensitive tokens', async () => {
      const subData = { _id: 'sub-1', email: 'anna@test.com', isConfirmed: true, language: 'de' };
      const mockSub = { ...subData, toObject: jest.fn().mockReturnValue(subData) };
      Subscriber.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSub),
      });

      const result = await adminService.getSubscriberById('sub-1');

      expect(result).toEqual(subData);
      expect(Subscriber.findById).toHaveBeenCalledWith('sub-1');
    });

    it('should return null when subscriber does not exist', async () => {
      Subscriber.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await adminService.getSubscriberById('nonexistent');

      expect(result).toBeNull();
    });

    it('should exclude confirmationToken and unsubscribeToken', async () => {
      const mockObj = { _id: 'sub-1' };
      Subscriber.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ ...mockObj, toObject: () => mockObj }),
      });

      await adminService.getSubscriberById('sub-1');

      const selectMock = Subscriber.findById().select;
      expect(selectMock).toHaveBeenCalledWith(
        '-confirmationToken -confirmationExpires -unsubscribeToken'
      );
    });
  });

  // ============================================
  // deleteSubscriber Tests
  // ============================================
  describe('deleteSubscriber', () => {
    it('should delete subscriber and return info', async () => {
      const mockSub = { _id: 'sub-1', email: 'anna@test.com', isConfirmed: true };
      Subscriber.findById = jest.fn().mockResolvedValue(mockSub);
      Subscriber.findByIdAndDelete = jest.fn().mockResolvedValue(mockSub);

      const result = await adminService.deleteSubscriber('sub-1');

      expect(result.deleted).toBeDefined();
      expect(result.deleted.email).toBe('anna@test.com');
      expect(result.deleted.isConfirmed).toBe(true);
      expect(Subscriber.findByIdAndDelete).toHaveBeenCalledWith('sub-1');
    });

    it('should return error when subscriber not found', async () => {
      Subscriber.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.deleteSubscriber('nonexistent');

      expect(result.error).toBe('Subscriber nicht gefunden');
      expect(result.code).toBe('SUBSCRIBER_NOT_FOUND');
    });

    it('should log warning on successful deletion', async () => {
      const logger = require('../../src/utils/logger');
      const mockSub = { _id: 'sub-99', email: 'delete@test.com', isConfirmed: false };
      Subscriber.findById = jest.fn().mockResolvedValue(mockSub);
      Subscriber.findByIdAndDelete = jest.fn().mockResolvedValue(mockSub);

      await adminService.deleteSubscriber('sub-99');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('sub-99')
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('delete@test.com')
      );
    });
  });

  // ============================================
  // getSubscriberStats Tests
  // ============================================
  describe('getSubscriberStats', () => {
    it('should return complete subscriber statistics', async () => {
      Subscriber.countDocuments = jest.fn()
        .mockResolvedValueOnce(500)   // totalCount
        .mockResolvedValueOnce(400);  // confirmedCount

      Subscriber.aggregate = jest.fn().mockResolvedValueOnce([
        { _id: 'de', count: 200 },
        { _id: 'en', count: 150 },
        { _id: 'ar', count: 50 },
      ]);

      const mockRecent = [
        { email: 'new1@test.com', subscribedAt: new Date(), language: 'de' },
        { email: 'new2@test.com', subscribedAt: new Date(), language: 'en' },
      ];
      const findChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockRecent),
      };
      Subscriber.find = jest.fn().mockReturnValue(findChain);

      const result = await adminService.getSubscriberStats();

      expect(result.totalCount).toBe(500);
      expect(result.confirmedCount).toBe(400);
      expect(result.unconfirmedCount).toBe(100);
      expect(result.languageBreakdown).toHaveLength(3);
      expect(result.recentSubscribers).toHaveLength(2);
    });

    it('should handle empty database (no subscribers)', async () => {
      Subscriber.countDocuments = jest.fn().mockResolvedValue(0);
      Subscriber.aggregate = jest.fn().mockResolvedValue([]);
      Subscriber.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([]),
      });

      const result = await adminService.getSubscriberStats();

      expect(result.totalCount).toBe(0);
      expect(result.confirmedCount).toBe(0);
      expect(result.unconfirmedCount).toBe(0);
      expect(result.languageBreakdown).toEqual([]);
      expect(result.recentSubscribers).toEqual([]);
    });

    it('should query confirmed subscribers for language breakdown', async () => {
      Subscriber.countDocuments = jest.fn().mockResolvedValue(0);
      Subscriber.aggregate = jest.fn().mockResolvedValue([]);
      Subscriber.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([]),
      });

      await adminService.getSubscriberStats();

      // Aggregate pipeline: match isConfirmed true, group by language
      expect(Subscriber.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ $match: { isConfirmed: true } }),
        ])
      );
    });

    it('should return recent confirmed subscribers only', async () => {
      Subscriber.countDocuments = jest.fn().mockResolvedValue(10);
      Subscriber.aggregate = jest.fn().mockResolvedValue([]);
      Subscriber.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([]),
      });

      await adminService.getSubscriberStats();

      expect(Subscriber.find).toHaveBeenCalledWith({ isConfirmed: true });
    });
  });

  // ============================================
  // getSubscriberById — confirmedAt Fallback
  // ============================================
  describe('getSubscriberById – confirmedAt Fallback', () => {
    it('should add confirmedAt fallback for confirmed subscribers without it', async () => {
      const mockSub = {
        _id: 'sub-1',
        email: 'anna@test.com',
        isConfirmed: true,
        subscribedAt: new Date('2024-01-15'),
        toObject: jest.fn().mockReturnValue({
          _id: 'sub-1',
          email: 'anna@test.com',
          isConfirmed: true,
          subscribedAt: new Date('2024-01-15'),
        }),
      };
      Subscriber.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSub),
      });

      const result = await adminService.getSubscriberById('sub-1');

      expect(result.confirmedAt).toEqual(new Date('2024-01-15'));
    });

    it('should not overwrite existing confirmedAt', async () => {
      const confirmedDate = new Date('2024-02-20');
      const mockSub = {
        _id: 'sub-1',
        isConfirmed: true,
        confirmedAt: confirmedDate,
        subscribedAt: new Date('2024-01-15'),
        toObject: jest.fn().mockReturnValue({
          _id: 'sub-1',
          isConfirmed: true,
          confirmedAt: confirmedDate,
          subscribedAt: new Date('2024-01-15'),
        }),
      };
      Subscriber.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSub),
      });

      const result = await adminService.getSubscriberById('sub-1');

      expect(result.confirmedAt).toEqual(confirmedDate);
    });
  });

  // ============================================
  // updateSubscriber Tests
  // ============================================
  describe('updateSubscriber', () => {
    it('should update subscriber language', async () => {
      const mockSub = {
        _id: 'sub-1',
        language: 'de',
        isConfirmed: true,
        save: jest.fn().mockResolvedValue(true),
      };
      Subscriber.findById = jest.fn().mockResolvedValue(mockSub);

      const result = await adminService.updateSubscriber('sub-1', { language: 'en' });

      expect(result.updated.language).toBe('en');
      expect(mockSub.save).toHaveBeenCalled();
    });

    it('should update isConfirmed and set confirmedAt', async () => {
      const mockSub = {
        _id: 'sub-1',
        isConfirmed: false,
        confirmedAt: undefined,
        subscribedAt: undefined,
        save: jest.fn().mockResolvedValue(true),
      };
      Subscriber.findById = jest.fn().mockResolvedValue(mockSub);

      const result = await adminService.updateSubscriber('sub-1', { isConfirmed: true });

      expect(result.updated.isConfirmed).toBe(true);
      expect(result.updated.confirmedAt).toBeDefined();
      expect(result.updated.subscribedAt).toBeDefined();
    });

    it('should reject invalid language', async () => {
      const mockSub = {
        _id: 'sub-1',
        language: 'de',
        save: jest.fn().mockResolvedValue(true),
      };
      Subscriber.findById = jest.fn().mockResolvedValue(mockSub);

      await adminService.updateSubscriber('sub-1', { language: 'invalid' });

      expect(mockSub.language).toBe('de');
    });

    it('should return error when subscriber not found', async () => {
      Subscriber.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.updateSubscriber('nonexistent', {});

      expect(result.error).toBe('Subscriber nicht gefunden');
      expect(result.code).toBe('SUBSCRIBER_NOT_FOUND');
    });
  });

  // ============================================
  // resendConfirmation Tests
  // ============================================
  describe('resendConfirmation', () => {
    it('should resend confirmation email to unconfirmed subscriber', async () => {
      const emailService = require('../../src/utils/emailService');
      const mockSub = {
        _id: 'sub-1',
        email: 'unconfirmed@test.com',
        isConfirmed: false,
        language: 'de',
        generateConfirmationToken: jest.fn().mockReturnValue('raw-token'),
        generateUnsubscribeToken: jest.fn().mockReturnValue('raw-unsub-token'),
        save: jest.fn().mockResolvedValue(true),
      };
      Subscriber.findById = jest.fn().mockResolvedValue(mockSub);

      const result = await adminService.resendConfirmation('sub-1');

      expect(result.resent).toBe(true);
      expect(result.email).toBe('unconfirmed@test.com');
      expect(emailService.sendNewsletterConfirmation).toHaveBeenCalledWith(
        'unconfirmed@test.com', 'raw-token', 'raw-unsub-token', 'de'
      );
    });

    it('should reject resending for already confirmed subscriber', async () => {
      Subscriber.findById = jest.fn().mockResolvedValue({
        _id: 'sub-1',
        isConfirmed: true,
      });

      const result = await adminService.resendConfirmation('sub-1');

      expect(result.error).toBe('Subscriber ist bereits bestätigt');
      expect(result.code).toBe('ALREADY_CONFIRMED');
    });

    it('should return error when subscriber not found', async () => {
      Subscriber.findById = jest.fn().mockResolvedValue(null);

      const result = await adminService.resendConfirmation('nonexistent');

      expect(result.code).toBe('SUBSCRIBER_NOT_FOUND');
    });
  });

  // ============================================
  // exportSubscribersCSV Tests
  // ============================================
  describe('exportSubscribersCSV', () => {
    it('should return CSV with correct headers', async () => {
      Subscriber.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await adminService.exportSubscribersCSV();

      expect(result).toContain('Email,Language,Confirmed,SubscribedAt,ConfirmedAt,CreatedAt,Type');
    });

    it('should export subscriber data correctly', async () => {
      const mockSubs = [
        {
          email: 'anna@test.com',
          language: 'de',
          isConfirmed: true,
          subscribedAt: new Date('2024-01-15T10:00:00Z'),
          confirmedAt: new Date('2024-01-15T10:05:00Z'),
          createdAt: new Date('2024-01-15T09:00:00Z'),
          userId: 'user-123',
        },
        {
          email: 'guest@test.com',
          language: 'en',
          isConfirmed: false,
          subscribedAt: null,
          confirmedAt: null,
          createdAt: new Date('2024-02-01T12:00:00Z'),
          userId: null,
        },
      ];
      Subscriber.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSubs),
      });

      const result = await adminService.exportSubscribersCSV();

      expect(result).toContain('anna@test.com');
      expect(result).toContain('Registered');
      expect(result).toContain('Guest');
      expect(result).toContain('Yes');
      expect(result).toContain('No');
    });
  });
});
