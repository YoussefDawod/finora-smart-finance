/**
 * Campaign Service
 * Business-Logik für Newsletter-Kampagnen (kein Express req/res)
 */

const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const escapeRegex = require('../utils/escapeRegex');

/**
 * Neue Kampagne als Draft erstellen
 * @param {Object} data - { subject, content, language, recipientFilter }
 * @param {string} adminId - ID des erstellenden Admins
 * @returns {Object} { campaign }
 */
async function createCampaign(data, adminId) {
  const campaign = new Campaign({
    subject: data.subject,
    content: data.content,
    language: data.language,
    sentBy: adminId,
    recipientFilter: {
      language: data.recipientFilter?.language || undefined,
      confirmedOnly: true,
    },
  });
  await campaign.save();
  logger.info(`Campaign created: ${campaign._id} by admin ${adminId}`);
  return { campaign };
}

/**
 * Kampagne bearbeiten (nur status=draft)
 * @param {string} campaignId - Campaign-ID
 * @param {Object} updates - Erlaubte Felder
 * @returns {Object} { campaign } oder { error, code }
 */
async function updateCampaign(campaignId, updates) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return { error: 'Campaign nicht gefunden', code: 'CAMPAIGN_NOT_FOUND' };
  if (campaign.status !== 'draft')
    return { error: 'Nur Drafts können bearbeitet werden', code: 'NOT_DRAFT' };

  if (updates.subject !== undefined) campaign.subject = updates.subject;
  if (updates.content !== undefined) campaign.content = updates.content;
  if (updates.language !== undefined) campaign.language = updates.language;
  if (updates.recipientFilter !== undefined) {
    campaign.recipientFilter = {
      language: updates.recipientFilter?.language || undefined,
      confirmedOnly: true,
    };
  }

  await campaign.save();
  logger.info(`Campaign updated: ${campaign._id}`);
  return { campaign };
}

/**
 * Kampagne löschen (alle Status erlaubt)
 * @param {string} campaignId - Campaign-ID
 * @returns {Object} { deleted } oder { error, code }
 */
async function deleteCampaign(campaignId) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return { error: 'Campaign nicht gefunden', code: 'CAMPAIGN_NOT_FOUND' };
  if (campaign.status === 'sending')
    return { error: 'Kampagne wird gerade gesendet', code: 'CAMPAIGN_SENDING' };

  const info = {
    id: campaign._id,
    subject: campaign.subject,
    language: campaign.language,
    status: campaign.status,
  };
  await Campaign.findByIdAndDelete(campaignId);
  logger.warn(`Campaign deleted: ${campaignId} (was ${campaign.status})`);
  return { deleted: info };
}

/**
 * Alle Kampagnen löschen (Admin-Reset)
 * @returns {Object} { deletedCount }
 */
async function deleteAllCampaigns() {
  const sendingCount = await Campaign.countDocuments({ status: 'sending' });
  if (sendingCount > 0) {
    return {
      error: 'Es gibt laufende Sendungen. Bitte warte, bis alle abgeschlossen sind.',
      code: 'HAS_SENDING',
    };
  }
  const result = await Campaign.deleteMany({});
  logger.warn(`All campaigns deleted (${result.deletedCount} total)`);
  return { deletedCount: result.deletedCount };
}

/**
 * Einzelne Kampagne abrufen
 * @param {string} campaignId - Campaign-ID
 * @returns {Object|null}
 */
async function getCampaign(campaignId) {
  const campaign = await Campaign.findById(campaignId).populate('sentBy', 'name email');
  if (!campaign) return null;
  return campaign;
}

/**
 * Kampagnen-Liste paginiert und filterbar
 * @param {Object} options - { page, limit, status, language, search, sort }
 * @returns {Object} { campaigns, pagination }
 */
async function listCampaigns({
  page = 1,
  limit = 20,
  status,
  language,
  search,
  sort = '-createdAt',
} = {}) {
  const ALLOWED_SORT = new Set(['createdAt', 'sentAt', 'subject', 'status', 'recipientCount']);
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const safeSort = ALLOWED_SORT.has(sortField) ? sort : '-createdAt';

  const query = {};
  if (status && ['draft', 'sending', 'sent', 'failed'].includes(status)) query.status = status;
  if (language && ['de', 'en', 'ar', 'ka'].includes(language)) query.language = language;
  if (search && search.trim()) {
    query.subject = { $regex: escapeRegex(search.trim()).slice(0, 100), $options: 'i' };
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [campaigns, total] = await Promise.all([
    Campaign.find(query)
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit)
      .populate('sentBy', 'name email'),
    Campaign.countDocuments(query),
  ]);

  return {
    campaigns,
    pagination: { total, page: safePage, pages: Math.ceil(total / safeLimit), limit: safeLimit },
  };
}

/**
 * Newsletter-Kampagne versenden
 * Batch-Versand mit 100ms Pause (SMTP-Schutz)
 * @param {string} campaignId - Campaign-ID
 * @returns {Object} { sent, successCount, failCount, recipientCount } oder { error, code }
 */
async function sendCampaign(campaignId) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return { error: 'Campaign nicht gefunden', code: 'CAMPAIGN_NOT_FOUND' };
  if (campaign.status !== 'draft')
    return { error: 'Campaign nicht versendbar', code: 'INVALID_STATE' };

  // Empfänger ermitteln (nur bestätigte Subscriber)
  const filter = { isConfirmed: true };
  if (campaign.recipientFilter?.language) {
    filter.language = campaign.recipientFilter.language;
  }
  const subscribers = await Subscriber.find(filter).select('email language unsubscribeToken');

  if (subscribers.length === 0) {
    const langInfo = filter.language ? ` (Sprache: ${filter.language})` : '';
    logger.warn(`Campaign ${campaignId}: Keine bestätigten Empfänger gefunden${langInfo}`);
    return { error: 'Keine bestätigten Empfänger gefunden', code: 'NO_RECIPIENTS', filter };
  }

  // Status auf "sending" setzen
  campaign.status = 'sending';
  campaign.sentAt = new Date();
  campaign.recipientCount = subscribers.length;
  await campaign.save();

  // Fire-and-forget: Batch-Versand im Hintergrund
  // Admin bekommt sofort Response, Kampagne wird asynchron versendet
  _processCampaignEmails(campaign, subscribers).catch(err => {
    logger.error(`Campaign ${campaignId} background processing failed: ${err.message}`);
  });

  logger.info(`Campaign ${campaignId} started: ${subscribers.length} recipients queued`);
  return { sent: true, recipientCount: subscribers.length };
}

/**
 * Kampagnen-Statistiken
 * @returns {Object} Übersicht: total, drafts, sent, failed, avg recipients
 */
async function getCampaignStats() {
  const [totalCount, statusBreakdown, languageBreakdown, recentCampaigns, avgRecipients] =
    await Promise.all([
      Campaign.countDocuments(),
      Campaign.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Campaign.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Campaign.find({ status: 'sent' })
        .sort({ sentAt: -1 })
        .limit(5)
        .select('subject sentAt recipientCount successCount failCount language')
        .lean(),
      Campaign.aggregate([
        { $match: { status: 'sent' } },
        {
          $group: {
            _id: null,
            avg: { $avg: '$recipientCount' },
            totalSent: { $sum: '$successCount' },
            totalFailed: { $sum: '$failCount' },
          },
        },
      ]),
    ]);

  const avg = avgRecipients[0] || { avg: 0, totalSent: 0, totalFailed: 0 };

  return {
    totalCount,
    statusBreakdown,
    languageBreakdown,
    recentCampaigns,
    averageRecipients: Math.round(avg.avg || 0),
    totalEmailsSent: avg.totalSent,
    totalEmailsFailed: avg.totalFailed,
  };
}

/**
 * Hintergrund-Versand: Sendet Kampagnen-Emails sequentiell mit Rate-Limiting.
 * Wird als fire-and-forget aus sendCampaign() aufgerufen.
 */
async function _processCampaignEmails(campaign, subscribers) {
  let successCount = 0;
  let failCount = 0;

  for (const sub of subscribers) {
    try {
      await emailService.sendNewsletterCampaign(
        sub.email,
        campaign.subject,
        campaign.content,
        sub.unsubscribeToken,
        sub.language
      );
      successCount++;
    } catch (err) {
      failCount++;
      logger.error(`Campaign ${campaign._id}: Failed to send to ${sub.email}: ${err.message}`);
    }

    // Rate-Limiting: 100ms Pause zwischen E-Mails (SMTP-Schutz)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Ergebnis speichern
  campaign.status = failCount === subscribers.length ? 'failed' : 'sent';
  campaign.successCount = successCount;
  campaign.failCount = failCount;
  await campaign.save();

  logger.info(
    `Campaign ${campaign._id} completed: ${successCount}/${subscribers.length} successful`
  );
}

module.exports = {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  deleteAllCampaigns,
  getCampaign,
  listCampaigns,
  sendCampaign,
  getCampaignStats,
};
