/**
 * @fileoverview Campaign Service Tests
 * @description Unit-Tests für Newsletter-Kampagnen-Service (CRUD, Versand, Statistiken)
 */

const campaignService = require('../../src/services/campaignService');
const Campaign = require('../../src/models/Campaign');
const Subscriber = require('../../src/models/Subscriber');

// Mock dependencies
jest.mock('../../src/models/Campaign');
jest.mock('../../src/models/Subscriber');
jest.mock('../../src/utils/emailService', () => ({
  sendNewsletterCampaign: jest.fn().mockResolvedValue({ sent: true }),
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const emailService = require('../../src/utils/emailService');

describe('CampaignService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // createCampaign Tests
  // ============================================
  describe('createCampaign', () => {
    it('should create a campaign as draft', async () => {
      const mockCampaign = {
        _id: 'camp-1',
        subject: 'Test-Newsletter',
        content: '<p>Inhalt</p>',
        language: 'de',
        status: 'draft',
        sentBy: 'admin-1',
        save: jest.fn().mockResolvedValue(true),
      };
      Campaign.mockImplementation(() => mockCampaign);

      const result = await campaignService.createCampaign(
        { subject: 'Test-Newsletter', content: '<p>Inhalt</p>', language: 'de' },
        'admin-1'
      );

      expect(result.campaign).toBeDefined();
      expect(mockCampaign.save).toHaveBeenCalled();
    });

    it('should set recipientFilter with language', async () => {
      const mockCampaign = { save: jest.fn().mockResolvedValue(true), recipientFilter: {} };
      Campaign.mockImplementation(function (data) {
        Object.assign(this, data);
        this.save = mockCampaign.save;
        return this;
      });

      const result = await campaignService.createCampaign(
        { subject: 'Test', content: 'abc', language: 'en', recipientFilter: { language: 'en' } },
        'admin-1'
      );

      expect(result.campaign).toBeDefined();
    });
  });

  // ============================================
  // updateCampaign Tests
  // ============================================
  describe('updateCampaign', () => {
    it('should update a draft campaign', async () => {
      const mockCampaign = {
        _id: 'camp-1',
        status: 'draft',
        subject: 'Alt',
        content: 'Alt',
        language: 'de',
        save: jest.fn().mockResolvedValue(true),
      };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);

      const result = await campaignService.updateCampaign('camp-1', { subject: 'Neu' });

      expect(result.campaign.subject).toBe('Neu');
      expect(mockCampaign.save).toHaveBeenCalled();
    });

    it('should reject updating a sent campaign', async () => {
      Campaign.findById = jest.fn().mockResolvedValue({ status: 'sent' });

      const result = await campaignService.updateCampaign('camp-1', { subject: 'X' });

      expect(result.error).toBe('Nur Drafts können bearbeitet werden');
      expect(result.code).toBe('NOT_DRAFT');
    });

    it('should return error when campaign not found', async () => {
      Campaign.findById = jest.fn().mockResolvedValue(null);

      const result = await campaignService.updateCampaign('nonexistent', {});

      expect(result.error).toBe('Campaign nicht gefunden');
      expect(result.code).toBe('CAMPAIGN_NOT_FOUND');
    });
  });

  // ============================================
  // deleteCampaign Tests
  // ============================================
  describe('deleteCampaign', () => {
    it('should delete a draft campaign', async () => {
      const mockCampaign = { _id: 'camp-1', status: 'draft', subject: 'Test', language: 'de' };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);
      Campaign.findByIdAndDelete = jest.fn().mockResolvedValue(mockCampaign);

      const result = await campaignService.deleteCampaign('camp-1');

      expect(result.deleted).toBeDefined();
      expect(result.deleted.subject).toBe('Test');
      expect(result.deleted.status).toBe('draft');
      expect(Campaign.findByIdAndDelete).toHaveBeenCalledWith('camp-1');
    });

    it('should delete a sent campaign', async () => {
      const mockCampaign = { _id: 'camp-2', status: 'sent', subject: 'Sent', language: 'en' };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);
      Campaign.findByIdAndDelete = jest.fn().mockResolvedValue(mockCampaign);

      const result = await campaignService.deleteCampaign('camp-2');

      expect(result.deleted).toBeDefined();
      expect(result.deleted.status).toBe('sent');
      expect(Campaign.findByIdAndDelete).toHaveBeenCalledWith('camp-2');
    });

    it('should reject deleting a sending campaign', async () => {
      Campaign.findById = jest.fn().mockResolvedValue({ status: 'sending' });

      const result = await campaignService.deleteCampaign('camp-1');

      expect(result.error).toBe('Kampagne wird gerade gesendet');
      expect(result.code).toBe('CAMPAIGN_SENDING');
    });

    it('should return error when campaign not found', async () => {
      Campaign.findById = jest.fn().mockResolvedValue(null);

      const result = await campaignService.deleteCampaign('nonexistent');

      expect(result.code).toBe('CAMPAIGN_NOT_FOUND');
    });
  });

  // ============================================
  // deleteAllCampaigns Tests
  // ============================================
  describe('deleteAllCampaigns', () => {
    it('should delete all campaigns when none are sending', async () => {
      Campaign.countDocuments = jest.fn().mockResolvedValue(0);
      Campaign.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

      const result = await campaignService.deleteAllCampaigns();

      expect(result.deletedCount).toBe(5);
      expect(Campaign.deleteMany).toHaveBeenCalledWith({});
    });

    it('should reject when a campaign is currently sending', async () => {
      Campaign.countDocuments = jest.fn().mockResolvedValue(2);

      const result = await campaignService.deleteAllCampaigns();

      expect(result.error).toBeDefined();
      expect(result.code).toBe('HAS_SENDING');
    });
  });

  // ============================================
  // getCampaign Tests
  // ============================================
  describe('getCampaign', () => {
    it('should return campaign with populated sentBy', async () => {
      const mockCampaign = { _id: 'camp-1', subject: 'Test', sentBy: { name: 'Admin' } };
      Campaign.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCampaign),
      });

      const result = await campaignService.getCampaign('camp-1');

      expect(result).toEqual(mockCampaign);
    });

    it('should return null when not found', async () => {
      Campaign.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await campaignService.getCampaign('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // listCampaigns Tests
  // ============================================
  describe('listCampaigns', () => {
    function setupFindMock(data, total) {
      const chainable = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(data),
      };
      Campaign.find = jest.fn().mockReturnValue(chainable);
      Campaign.countDocuments = jest.fn().mockResolvedValue(total);
      return chainable;
    }

    it('should return paginated campaigns with defaults', async () => {
      setupFindMock([{ _id: 'camp-1' }], 1);

      const result = await campaignService.listCampaigns();

      expect(result.campaigns).toHaveLength(1);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        pages: 1,
        limit: 20,
      });
    });

    it('should filter by status', async () => {
      setupFindMock([], 0);

      await campaignService.listCampaigns({ status: 'draft' });

      expect(Campaign.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
    });

    it('should filter by language', async () => {
      setupFindMock([], 0);

      await campaignService.listCampaigns({ language: 'en' });

      expect(Campaign.find).toHaveBeenCalledWith(expect.objectContaining({ language: 'en' }));
    });

    it('should apply search filter on subject', async () => {
      setupFindMock([], 0);

      await campaignService.listCampaigns({ search: 'news' });

      const query = Campaign.find.mock.calls[0][0];
      expect(query.subject).toEqual({ $regex: 'news', $options: 'i' });
    });

    it('should cap limit at 100', async () => {
      const chain = setupFindMock([], 0);

      await campaignService.listCampaigns({ limit: 999 });

      expect(chain.limit).toHaveBeenCalledWith(100);
    });
  });

  // ============================================
  // sendCampaign Tests
  // ============================================
  describe('sendCampaign', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('should send campaign to all confirmed subscribers', async () => {
      const mockCampaign = {
        _id: 'camp-1',
        status: 'draft',
        subject: 'Newsletter',
        content: '<p>Hello</p>',
        recipientFilter: {},
        save: jest.fn().mockResolvedValue(true),
      };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);

      const mockSubs = [
        { email: 'a@test.com', language: 'de', unsubscribeToken: 'tok1' },
        { email: 'b@test.com', language: 'en', unsubscribeToken: 'tok2' },
      ];
      Subscriber.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSubs),
      });

      const result = await campaignService.sendCampaign('camp-1');

      expect(result.sent).toBe(true);
      expect(result.recipientCount).toBe(2);

      // Wait for fire-and-forget background processing
      await jest.advanceTimersByTimeAsync(1000);

      expect(emailService.sendNewsletterCampaign).toHaveBeenCalledTimes(2);
      expect(mockCampaign.status).toBe('sent');
      expect(mockCampaign.successCount).toBe(2);
      expect(mockCampaign.failCount).toBe(0);
    });

    it('should handle partial failures', async () => {
      const mockCampaign = {
        _id: 'camp-1',
        status: 'draft',
        subject: 'News',
        content: '<p>Content</p>',
        recipientFilter: {},
        save: jest.fn().mockResolvedValue(true),
      };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);

      const mockSubs = [
        { email: 'a@test.com', language: 'de', unsubscribeToken: 'tok1' },
        { email: 'b@test.com', language: 'en', unsubscribeToken: 'tok2' },
      ];
      Subscriber.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSubs),
      });

      emailService.sendNewsletterCampaign
        .mockResolvedValueOnce({ sent: true })
        .mockRejectedValueOnce(new Error('SMTP error'));

      const result = await campaignService.sendCampaign('camp-1');

      expect(result.sent).toBe(true);
      expect(result.recipientCount).toBe(2);

      // Wait for fire-and-forget background processing
      await jest.advanceTimersByTimeAsync(1000);

      expect(mockCampaign.successCount).toBe(1);
      expect(mockCampaign.failCount).toBe(1);
      expect(mockCampaign.status).toBe('sent'); // partial success → 'sent'
    });

    it('should set status to failed when all emails fail', async () => {
      const mockCampaign = {
        _id: 'camp-1',
        status: 'draft',
        subject: 'Fail',
        content: '<p>X</p>',
        recipientFilter: {},
        save: jest.fn().mockResolvedValue(true),
      };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);

      Subscriber.find = jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue([{ email: 'a@test.com', language: 'de', unsubscribeToken: 'tok1' }]),
      });

      emailService.sendNewsletterCampaign.mockRejectedValue(new Error('SMTP down'));

      const result = await campaignService.sendCampaign('camp-1');

      expect(result.sent).toBe(true);
      expect(result.recipientCount).toBe(1);

      // Wait for fire-and-forget background processing
      await jest.advanceTimersByTimeAsync(1000);

      expect(mockCampaign.failCount).toBe(1);
      expect(mockCampaign.status).toBe('failed');
    });

    it('should reject sending a non-draft campaign', async () => {
      Campaign.findById = jest.fn().mockResolvedValue({ status: 'sent' });

      const result = await campaignService.sendCampaign('camp-1');

      expect(result.error).toBe('Campaign nicht versendbar');
      expect(result.code).toBe('INVALID_STATE');
    });

    it('should return error when no recipients found', async () => {
      const mockCampaign = {
        _id: 'camp-1',
        status: 'draft',
        recipientFilter: {},
        save: jest.fn().mockResolvedValue(true),
      };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);
      Subscriber.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const result = await campaignService.sendCampaign('camp-1');

      expect(result.error).toBe('Keine bestätigten Empfänger gefunden');
      expect(result.code).toBe('NO_RECIPIENTS');
    });

    it('should apply language filter from recipientFilter', async () => {
      const mockCampaign = {
        _id: 'camp-1',
        status: 'draft',
        subject: 'Test',
        content: 'X',
        recipientFilter: { language: 'de' },
        save: jest.fn().mockResolvedValue(true),
      };
      Campaign.findById = jest.fn().mockResolvedValue(mockCampaign);
      Subscriber.find = jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue([{ email: 'a@test.com', language: 'de', unsubscribeToken: 'tok1' }]),
      });

      await campaignService.sendCampaign('camp-1');

      expect(Subscriber.find).toHaveBeenCalledWith({ isConfirmed: true, language: 'de' });
    });
  });

  // ============================================
  // getCampaignStats Tests
  // ============================================
  describe('getCampaignStats', () => {
    it('should return complete campaign statistics', async () => {
      Campaign.countDocuments = jest.fn().mockResolvedValue(10);
      Campaign.aggregate = jest
        .fn()
        .mockResolvedValueOnce([
          { _id: 'draft', count: 3 },
          { _id: 'sent', count: 7 },
        ])
        .mockResolvedValueOnce([
          { _id: 'de', count: 5 },
          { _id: 'en', count: 5 },
        ])
        .mockResolvedValueOnce([{ avg: 50, totalSent: 300, totalFailed: 10 }]);

      Campaign.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await campaignService.getCampaignStats();

      expect(result.totalCount).toBe(10);
      expect(result.statusBreakdown).toHaveLength(2);
      expect(result.languageBreakdown).toHaveLength(2);
      expect(result.averageRecipients).toBe(50);
      expect(result.totalEmailsSent).toBe(300);
      expect(result.totalEmailsFailed).toBe(10);
    });

    it('should handle empty database', async () => {
      Campaign.countDocuments = jest.fn().mockResolvedValue(0);
      Campaign.aggregate = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      Campaign.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await campaignService.getCampaignStats();

      expect(result.totalCount).toBe(0);
      expect(result.averageRecipients).toBe(0);
      expect(result.totalEmailsSent).toBe(0);
    });
  });
});
