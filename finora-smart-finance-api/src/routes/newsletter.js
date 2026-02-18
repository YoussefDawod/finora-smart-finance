/**
 * Newsletter Routes
 * Double Opt-In Newsletter-Abonnement
 *
 * POST   /api/newsletter/subscribe    - Newsletter abonnieren (öffentlich)
 * GET    /api/newsletter/confirm      - Abonnement bestätigen (Double Opt-In)
 * GET    /api/newsletter/unsubscribe  - Abonnement kündigen (via Email-Link)
 * GET    /api/newsletter/status       - Abo-Status prüfen (authentifiziert)
 * POST   /api/newsletter/toggle       - Abo aktivieren/deaktivieren (authentifiziert)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const config = require('../config/env');
const { newsletterStatusPage } = require('../utils/emailTemplates/newsletterStatusPage');

// Rate Limiter: max 5 Subscribe-Anfragen pro Stunde pro IP
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error: 'Zu viele Anfragen. Bitte versuche es später erneut.',
    code: 'RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Versucht optional den User aus dem Authorization-Header zu extrahieren
 * Schlägt nicht fehl wenn kein Token vorhanden — gibt null zurück
 */
async function optionalAuth(req) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.sub).select('_id email');
    return user || null;
  } catch {
    return null;
  }
}

// ============================================
// POST /api/newsletter/subscribe
// ============================================
router.post('/subscribe', subscribeLimiter, async (req, res) => {
  try {
    const { email, language } = req.body;

    // Validierung
    if (!email) {
      return res.status(400).json({
        error: 'E-Mail ist erforderlich',
        code: 'VALIDATION_ERROR',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Ungültiges E-Mail-Format',
        code: 'INVALID_EMAIL',
      });
    }

    // Existierenden Subscriber prüfen
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });

    if (existing && existing.isConfirmed) {
      // Bereits bestätigt — trotzdem 200 zurückgeben (kein Hinweis, ob Email existiert)
      return res.status(200).json({
        success: true,
        message: 'Confirmation email sent',
      });
    }

    // Optional: eingeloggten User verknüpfen
    const authenticatedUser = await optionalAuth(req);

    // Neuen Subscriber erstellen oder bestehenden unbestätigten aktualisieren
    const subscriber = existing || new Subscriber({
      email: email.toLowerCase(),
      language: language || 'de',
    });

    // Sprache aktualisieren (falls erneuter Versuch in anderer Sprache)
    if (existing && language) {
      subscriber.language = language;
    }

    // userId setzen, wenn ein authentifizierter User den Newsletter abonniert
    if (authenticatedUser) {
      subscriber.userId = authenticatedUser._id;
    }

    const confirmToken = subscriber.generateConfirmationToken();
    const unsubscribeToken = subscriber.generateUnsubscribeToken();
    await subscriber.save();

    // Bestätigungs-Email senden (mit Unsubscribe-Link)
    try {
      const emailService = require('../utils/emailService');
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
    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent',
    });
  } catch (err) {
    // Duplicate Key (Race Condition)
    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Confirmation email sent',
      });
    }
    logger.error(`Newsletter subscribe error: ${err.message}`);
    return res.status(500).json({
      error: 'Fehler beim Abonnieren',
      code: 'SERVER_ERROR',
    });
  }
});

// ============================================
// GET /api/newsletter/confirm?token=xxx
// ============================================
router.get('/confirm', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de'));
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const subscriber = await Subscriber.findOne({
      confirmationToken: tokenHash,
      confirmationExpires: { $gt: new Date() },
    });

    if (!subscriber) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de'));
    }

    const subscriberLang = subscriber.language || 'de';

    subscriber.isConfirmed = true;
    subscriber.subscribedAt = new Date();
    subscriber.confirmationToken = undefined;
    subscriber.confirmationExpires = undefined;

    // Neuen Unsubscribe-Token generieren (für Welcome-E-Mail und zukünftige Emails)
    const unsubscribeToken = subscriber.generateUnsubscribeToken();
    await subscriber.save();

    // Willkommens-Email senden (mit Unsubscribe-Link)
    try {
      const emailService = require('../utils/emailService');
      await emailService.sendNewsletterWelcome(
        subscriber.email,
        unsubscribeToken,
        subscriberLang
      );
    } catch (err) {
      logger.error(`Newsletter welcome email failed: ${err.message}`);
    }

    logger.info(`Newsletter confirmed: ${subscriber.email}`);
    return res.status(200).type('html').send(newsletterStatusPage('confirmed', subscriberLang));
  } catch (err) {
    logger.error(`Newsletter confirm error: ${err.message}`);
    return res.status(500).type('html').send(newsletterStatusPage('error', req.query.lang || 'de'));
  }
});

// ============================================
// GET /api/newsletter/unsubscribe?token=xxx
// ============================================
router.get('/unsubscribe', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de'));
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const subscriber = await Subscriber.findOne({ unsubscribeToken: tokenHash });

    if (!subscriber) {
      return res.status(400).type('html').send(newsletterStatusPage('invalid', req.query.lang || 'de'));
    }

    const subscriberEmail = subscriber.email;
    const subscriberLanguage = subscriber.language || 'de';
    await Subscriber.deleteOne({ _id: subscriber._id });

    // Abmelde-Bestätigung senden
    try {
      const emailService = require('../utils/emailService');
      await emailService.sendNewsletterGoodbye(subscriberEmail, subscriberLanguage);
    } catch (err) {
      logger.error(`Newsletter goodbye email failed: ${err.message}`);
    }

    logger.info(`Newsletter unsubscribed: ${subscriberEmail}`);
    return res.status(200).type('html').send(newsletterStatusPage('unsubscribed', subscriberLanguage));
  } catch (err) {
    logger.error(`Newsletter unsubscribe error: ${err.message}`);
    return res.status(500).type('html').send(newsletterStatusPage('error', req.query.lang || 'de'));
  }
});

// ============================================
// GET /api/newsletter/status (authentifiziert)
// ============================================
router.get('/status', auth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    if (!userEmail) {
      return res.json({ success: true, subscribed: false });
    }

    const subscriber = await Subscriber.findOne({
      email: userEmail.toLowerCase(),
      isConfirmed: true,
    });

    return res.json({
      success: true,
      subscribed: !!subscriber,
    });
  } catch (err) {
    logger.error(`Newsletter status error: ${err.message}`);
    return res.status(500).json({
      error: 'Fehler beim Abrufen des Newsletter-Status',
      code: 'SERVER_ERROR',
    });
  }
});

// ============================================
// POST /api/newsletter/toggle (authentifiziert)
// ============================================
router.post('/toggle', auth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    if (!userEmail) {
      return res.status(400).json({
        error: 'Keine E-Mail-Adresse vorhanden',
        code: 'NO_EMAIL',
      });
    }

    const email = userEmail.toLowerCase();
    const existing = await Subscriber.findOne({ email });

    if (existing && existing.isConfirmed) {
      // Abmelden: Subscriber löschen + Bestätigungs-Email senden
      const subscriberLanguage = existing.language;
      await Subscriber.deleteOne({ _id: existing._id });

      try {
        const emailService = require('../utils/emailService');
        await emailService.sendNewsletterGoodbye(email, subscriberLanguage);
      } catch (err) {
        logger.error(`Newsletter goodbye email failed: ${err.message}`);
      }

      logger.info(`Newsletter unsubscribed via toggle: ${email}`);
      return res.json({
        success: true,
        subscribed: false,
        message: 'Newsletter abgemeldet',
      });
    }

    // Anmelden: Subscriber erstellen (kein Double-Opt-In nötig, E-Mail bereits verifiziert)
    const userLanguage = req.user.preferences?.language || 'de';

    if (existing) {
      // Unbestätigten Subscriber aktualisieren
      existing.isConfirmed = true;
      existing.subscribedAt = new Date();
      existing.userId = req.user._id;
      existing.confirmationToken = undefined;
      existing.confirmationExpires = undefined;
      const unsubscribeToken = existing.generateUnsubscribeToken();
      await existing.save();

      // Willkommens-Email senden
      try {
        const emailService = require('../utils/emailService');
        await emailService.sendNewsletterWelcome(email, unsubscribeToken, existing.language);
      } catch (err) {
        logger.error(`Newsletter welcome email failed: ${err.message}`);
      }
    } else {
      const subscriber = new Subscriber({
        email,
        userId: req.user._id,
        isConfirmed: true,
        subscribedAt: new Date(),
        language: userLanguage,
      });
      const unsubscribeToken = subscriber.generateUnsubscribeToken();
      await subscriber.save();

      // Willkommens-Email senden
      try {
        const emailService = require('../utils/emailService');
        await emailService.sendNewsletterWelcome(email, unsubscribeToken, userLanguage);
      } catch (err) {
        logger.error(`Newsletter welcome email failed: ${err.message}`);
      }
    }

    logger.info(`Newsletter subscribed via toggle: ${email}`);
    return res.json({
      success: true,
      subscribed: true,
      message: 'Newsletter abonniert',
    });
  } catch (err) {
    // Duplicate Key (Race Condition)
    if (err.code === 11000) {
      return res.json({ success: true, subscribed: true });
    }
    logger.error(`Newsletter toggle error: ${err.message}`);
    return res.status(500).json({
      error: 'Fehler beim Ändern des Newsletter-Status',
      code: 'SERVER_ERROR',
    });
  }
});

module.exports = router;
