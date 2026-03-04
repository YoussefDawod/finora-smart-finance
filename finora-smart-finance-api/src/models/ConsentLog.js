/**
 * @deprecated Model deaktiviert seit Phase 3 (Datenschutz-Hinweis-Umbau).
 * Bleibt als Reserve erhalten. TTL-Index räumt bestehende Dokumente automatisch auf.
 *
 * ConsentLog Model
 * DSGVO Art. 7(1) — Nachweis der Einwilligung
 *
 * Protokolliert jede Cookie-/Datenschutz-Einwilligung serverseitig,
 * damit der Verantwortliche die Einwilligung nachweisen kann.
 *
 * Felder:
 * - userId (optional): eingeloggter User, null für anonyme Besucher
 * - consentType: Art der Einwilligung (cookie, registration)
 * - categories: gewählte Kategorien (essential, newsletter)
 * - consentVersion: Version der Einwilligungstexte
 * - ipAddress: IP-Adresse zum Zeitpunkt der Einwilligung
 * - userAgent: Browser User-Agent
 */

const mongoose = require('mongoose');

const CONSENT_TYPES = ['cookie', 'registration'];

const consentLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    consentType: {
      type: String,
      required: [true, 'consentType ist erforderlich'],
      enum: CONSENT_TYPES,
      index: true,
    },

    categories: {
      essential: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
    },

    consentVersion: {
      type: String,
      required: [true, 'consentVersion ist erforderlich'],
      maxlength: 20,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
consentLogSchema.index({ userId: 1, createdAt: -1 });
consentLogSchema.index({ createdAt: -1 });

// TTL: Consent-Nachweise 3 Jahre aufbewahren (DSGVO-konforme Aufbewahrungsfrist)
consentLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3 * 365 * 24 * 60 * 60 });

module.exports = mongoose.model('ConsentLog', consentLogSchema);
module.exports.CONSENT_TYPES = CONSENT_TYPES;
