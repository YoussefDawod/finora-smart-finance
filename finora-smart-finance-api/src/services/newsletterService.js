/**
 * Newsletter Service
 * Reine Business-Logik für Newsletter-Double-Opt-In (kein Express req/res)
 */

const crypto = require('crypto');
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const { verifyAccessToken } = require('./authService');
const logger = require('../utils/logger');

/**
 * Versucht optional den User aus dem Authorization-Header zu extrahieren
 */
async function resolveOptionalUser(authHeader) {
  try {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('_id email');
    return user || null;
  } catch {
    return null;
  }
}

/**
 * Newsletter abonnieren (Double Opt-In)
 * Enthält DB-Level Rate-Limiting: max 50 unbestätigte Subscriber/Stunde global (L-6)
 * @returns {{ success: true, message } | { error, code }}
 */
async function subscribe(email, language, authHeader) {
  // DB-Level Rate-Limiting: Schutz gegen Massen-Anmeldungen (z.B. bei IP-Rotation)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentUnconfirmed = await Subscriber.countDocuments({
    isConfirmed: false,
    createdAt: { $gte: oneHourAgo },
  });
  if (recentUnconfirmed >= 50) {
    logger.warn(`Newsletter subscribe: DB-level rate limit reached (${recentUnconfirmed} unconfirmed/h)`);
    return { success: true, message: 'Bestätigungsmail wurde gesendet' }; // Privacy: keine Info-Leaks
  }

  const existing = await Subscriber.findOne({ email: email.toLowerCase() });

  if (existing && existing.isConfirmed) {
    // Kein Hinweis ob Email existiert — Privacy
    return { success: true, message: 'Bestätigungsmail wurde gesendet' };
  }

  const authenticatedUser = await resolveOptionalUser(authHeader);

  const subscriber = existing || new Subscriber({
    email: email.toLowerCase(),
    language: language || 'de',
  });

  if (existing && language) {
    subscriber.language = language;
  }

  if (authenticatedUser) {
    subscriber.userId = authenticatedUser._id;
  }

  const confirmToken = subscriber.generateConfirmationToken();
  const unsubscribeToken = subscriber.generateUnsubscribeToken();
  await subscriber.save();

  try {
    await emailService.sendNewsletterConfirmation(
      subscriber.email,
      confirmToken,
      unsubscribeToken,
      subscriber.language
    );
  } catch (err) {
    logger.error(`Newsletter confirmation email failed: ${err.message}`);
  }

  logger.info(`Newsletter subscription request: ${email}`);
  return { success: true, message: 'Bestätigungsmail wurde gesendet' };
}

/**
 * Abonnement bestätigen (Double Opt-In)
 * @returns {{ confirmed: true, lang } | { invalid: true } | null}
 */
async function confirmSubscription(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const subscriber = await Subscriber.findOne({
    confirmationToken: tokenHash,
    confirmationExpires: { $gt: new Date() },
  });

  if (!subscriber) return null;

  const subscriberLang = subscriber.language || 'de';

  subscriber.isConfirmed = true;
  subscriber.subscribedAt = new Date();
  subscriber.confirmedAt = new Date();
  subscriber.confirmationToken = undefined;
  subscriber.confirmationExpires = undefined;

  const unsubscribeToken = subscriber.generateUnsubscribeToken();
  await subscriber.save();

  try {
    await emailService.sendNewsletterWelcome(subscriber.email, unsubscribeToken, subscriberLang);
  } catch (err) {
    logger.error(`Newsletter welcome email failed: ${err.message}`);
  }

  logger.info(`Newsletter confirmed: ${subscriber.email}`);
  return { confirmed: true, lang: subscriberLang };
}

/**
 * Abonnement kündigen via Token
 * @returns {{ unsubscribed: true, lang } | null}
 */
async function unsubscribeByToken(token) {
  // Pfad 1: token ist der RAW-Token (Welcome-/Bestätigungs-E-Mails)
  // → DB speichert den Hash → token erst hashen, dann nachschlagen
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  let subscriber = await Subscriber.findOne({ unsubscribeToken: tokenHash });

  // Pfad 2: token ist bereits der Hash selbst (Kampagnen-E-Mails)
  // → campaignService übergibt sub.unsubscribeToken (= DB-Hash) direkt
  if (!subscriber) {
    subscriber = await Subscriber.findOne({ unsubscribeToken: token });
  }

  if (!subscriber) return null;

  const subscriberEmail = subscriber.email;
  const subscriberLanguage = subscriber.language || 'de';
  await Subscriber.deleteOne({ _id: subscriber._id });

  try {
    await emailService.sendNewsletterGoodbye(subscriberEmail, subscriberLanguage);
  } catch (err) {
    logger.error(`Newsletter goodbye email failed: ${err.message}`);
  }

  logger.info(`Newsletter unsubscribed: ${subscriberEmail}`);
  return { unsubscribed: true, lang: subscriberLanguage };
}

/**
 * Abo-Status prüfen
 */
async function getStatus(userEmail) {
  if (!userEmail) return { subscribed: false };

  const subscriber = await Subscriber.findOne({
    email: userEmail.toLowerCase(),
    isConfirmed: true,
  });

  return { subscribed: !!subscriber };
}

/**
 * Abo aktivieren/deaktivieren (Toggle für authentifizierte User)
 */
async function toggle(userEmail, userId, userLanguage) {
  const email = userEmail.toLowerCase();
  const existing = await Subscriber.findOne({ email });

  if (existing && existing.isConfirmed) {
    // Abmelden
    const subscriberLanguage = existing.language;
    await Subscriber.deleteOne({ _id: existing._id });

    try {
      await emailService.sendNewsletterGoodbye(email, subscriberLanguage);
    } catch (err) {
      logger.error(`Newsletter goodbye email failed: ${err.message}`);
    }

    logger.info(`Newsletter unsubscribed via toggle: ${email}`);
    return { subscribed: false, message: 'Newsletter abgemeldet' };
  }

  // Anmelden
  const lang = userLanguage || 'de';

  if (existing) {
    existing.isConfirmed = true;
    existing.subscribedAt = new Date();
    existing.confirmedAt = new Date();
    existing.userId = userId;
    existing.language = lang;
    existing.confirmationToken = undefined;
    existing.confirmationExpires = undefined;
    const unsubscribeToken = existing.generateUnsubscribeToken();
    await existing.save();

    try {
      await emailService.sendNewsletterWelcome(email, unsubscribeToken, existing.language);
    } catch (err) {
      logger.error(`Newsletter welcome email failed: ${err.message}`);
    }
  } else {
    const subscriber = new Subscriber({
      email,
      userId,
      isConfirmed: true,
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      language: lang,
    });
    const unsubscribeToken = subscriber.generateUnsubscribeToken();
    await subscriber.save();

    try {
      await emailService.sendNewsletterWelcome(email, unsubscribeToken, lang);
    } catch (err) {
      logger.error(`Newsletter welcome email failed: ${err.message}`);
    }
  }

  logger.info(`Newsletter subscribed via toggle: ${email}`);
  return { subscribed: true, message: 'Newsletter abonniert' };
}

module.exports = {
  resolveOptionalUser,
  subscribe,
  confirmSubscription,
  unsubscribeByToken,
  getStatus,
  toggle,
};
