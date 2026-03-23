/**
 * Feedback Service
 * Business-Logik für Feedback-System (User + Admin + Public)
 */

const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { escapeRegex } = require('../utils/escapeRegex');

/**
 * Gibt den Benutzernamen als Display-Name zurück.
 * Die App verwendet nur Benutzernamen (kein Vor-/Nachname-System).
 */
function getDisplayName(username) {
  if (!username) return 'Anonym';
  return username.trim();
}

// ============================================
// USER-FUNKTIONEN
// ============================================

/**
 * Erstellt ein neues Feedback (1 pro User)
 */
async function createFeedback({ userId, rating, text, consentGiven }) {
  const existing = await Feedback.findOne({ user: userId });
  if (existing) {
    return { error: 'Du hast bereits ein Feedback abgegeben', code: 'FEEDBACK_EXISTS' };
  }

  // DisplayName aus Benutzernamen generieren
  const user = await User.findById(userId).select('name');
  const displayName = user ? getDisplayName(user.name) : 'Anonym';

  // Bei < 4 Sternen: Consent immer false (kein öffentliches Testimonial möglich)
  const effectiveConsent = rating >= 4 ? Boolean(consentGiven) : false;

  const feedback = await Feedback.create({
    user: userId,
    rating: Number(rating),
    text: text || '',
    consentGiven: effectiveConsent,
    published: false,
    displayName,
  });

  return { feedback };
}

/**
 * Holt das eigene Feedback eines Users
 */
async function getMyFeedback(userId) {
  return Feedback.findOne({ user: userId });
}

/**
 * Aktualisiert den Consent-Status des eigenen Feedbacks
 */
async function updateMyConsent(userId, consentGiven) {
  const feedback = await Feedback.findOne({ user: userId });
  if (!feedback) {
    return { error: 'Kein Feedback gefunden', code: 'FEEDBACK_NOT_FOUND' };
  }

  if (feedback.rating < 4) {
    return { error: 'Consent nur bei 4+ Sternen möglich', code: 'CONSENT_NOT_APPLICABLE' };
  }

  feedback.consentGiven = consentGiven;
  // Widerruf: automatisch depublizieren
  if (!consentGiven && feedback.published) {
    feedback.published = false;
  }
  await feedback.save();

  return { feedback };
}

/**
 * Löscht das eigene Feedback
 */
async function deleteMyFeedback(userId) {
  const feedback = await Feedback.findOneAndDelete({ user: userId });
  if (!feedback) {
    return { error: 'Kein Feedback gefunden', code: 'FEEDBACK_NOT_FOUND' };
  }
  return { deleted: feedback };
}

// ============================================
// PUBLIC-FUNKTIONEN
// ============================================

/**
 * Holt alle veröffentlichten Feedbacks (für Landing Page)
 * Liest den aktuellen Benutzernamen direkt aus dem User-Dokument.
 */
async function getPublicFeedbacks() {
  const feedbacks = await Feedback.find({ published: true })
    .select('rating text displayName createdAt user')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return feedbacks.map(({ user, displayName, ...rest }) => ({
    ...rest,
    displayName: user?.name || displayName || 'Anonym',
  }));
}

/**
 * Zählt alle Feedbacks im System (für Motivations-Texte)
 */
async function getFeedbackCount() {
  return Feedback.countDocuments();
}

// ============================================
// ADMIN-FUNKTIONEN
// ============================================

/**
 * Listet alle Feedbacks mit Filtern (Admin)
 */
async function listFeedbacks({
  page = 1,
  limit = 15,
  sort = '-createdAt',
  search = '',
  ratingFilter = '',
  consentFilter = '',
  publishedFilter = '',
} = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));

  const filter = {};

  // Rating-Filter
  if (ratingFilter === 'high') {
    filter.rating = { $gte: 4 };
  } else if (ratingFilter === 'low') {
    filter.rating = { $lt: 4 };
  } else if (ratingFilter && !isNaN(Number(ratingFilter))) {
    filter.rating = Number(ratingFilter);
  }

  // Consent-Filter
  if (consentFilter === 'true') filter.consentGiven = true;
  else if (consentFilter === 'false') filter.consentGiven = false;

  // Published-Filter
  if (publishedFilter === 'true') filter.published = true;
  else if (publishedFilter === 'false') filter.published = false;

  // Textsuche
  if (search) {
    filter.text = { $regex: escapeRegex(search), $options: 'i' };
  }

  const total = await Feedback.countDocuments(filter);
  const feedbacks = await Feedback.find(filter)
    .populate('user', 'name email')
    .sort(sort)
    .skip((p - 1) * lim)
    .limit(lim)
    .lean();

  return {
    feedbacks,
    pagination: {
      total,
      page: p,
      pages: Math.ceil(total / lim) || 1,
      limit: lim,
    },
  };
}

/**
 * Feedback-Statistiken (Admin)
 */
async function getFeedbackStats() {
  const [total, published, withConsent, ratingAgg] = await Promise.all([
    Feedback.countDocuments(),
    Feedback.countDocuments({ published: true }),
    Feedback.countDocuments({ consentGiven: true }),
    Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
  ]);

  const avgRating = ratingAgg[0]?.avg || 0;

  return {
    total,
    published,
    withConsent,
    avgRating: Math.round(avgRating * 10) / 10,
    publishedRate: total > 0 ? Math.round((published / total) * 100) : 0,
  };
}

/**
 * Feedback veröffentlichen (Admin)
 */
async function publishFeedback(feedbackId) {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return { error: 'Feedback nicht gefunden', code: 'FEEDBACK_NOT_FOUND' };
  }
  if (!feedback.consentGiven) {
    return { error: 'User hat keinen Consent gegeben', code: 'NO_CONSENT' };
  }
  if (feedback.rating < 4) {
    return {
      error: 'Nur Feedbacks mit 4+ Sternen können veröffentlicht werden',
      code: 'RATING_TOO_LOW',
    };
  }

  feedback.published = true;
  await feedback.save();
  return { feedback };
}

/**
 * Feedback-Veröffentlichung zurückziehen (Admin)
 */
async function unpublishFeedback(feedbackId) {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return { error: 'Feedback nicht gefunden', code: 'FEEDBACK_NOT_FOUND' };
  }

  feedback.published = false;
  await feedback.save();
  return { feedback };
}

/**
 * Feedback löschen (Admin)
 */
async function deleteFeedback(feedbackId) {
  const feedback = await Feedback.findByIdAndDelete(feedbackId);
  if (!feedback) {
    return { error: 'Feedback nicht gefunden', code: 'FEEDBACK_NOT_FOUND' };
  }
  return { deleted: feedback };
}

module.exports = {
  // User
  createFeedback,
  getMyFeedback,
  updateMyConsent,
  deleteMyFeedback,
  // Public
  getPublicFeedbacks,
  getFeedbackCount,
  // Admin
  listFeedbacks,
  getFeedbackStats,
  publishFeedback,
  unpublishFeedback,
  deleteFeedback,
};
