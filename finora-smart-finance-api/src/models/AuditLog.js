/**
 * AuditLog Model
 * Protokolliert alle Admin-Aktionen für Nachvollziehbarkeit und Sicherheit
 *
 * Jeder Eintrag speichert:
 * - WER die Aktion ausgeführt hat (Admin)
 * - WAS gemacht wurde (action)
 * - WEN/WAS es betrifft (targetUser/targetId)
 * - WANN es passiert ist (createdAt)
 * - WIE der Zustand vorher/nachher war (details)
 * - VON WO die Anfrage kam (ipAddress, userAgent)
 */

const mongoose = require('mongoose');

/**
 * Alle protokollierbaren Admin-Aktionen
 */
const AUDIT_ACTIONS = [
  // User-Verwaltung
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_BANNED',
  'USER_UNBANNED',
  'USER_ROLE_CHANGED',
  'USER_PASSWORD_RESET',
  'ALL_USERS_DELETED',
  // Transaktionen & Subscriber
  'TRANSACTION_DELETED',
  'SUBSCRIBER_DELETED',
  'SUBSCRIBER_UPDATED',
  'CONFIRMATION_RESENT',
  'SUBSCRIBERS_EXPORTED',
  // Data Export
  'DATA_EXPORT',
  // Kampagnen
  'CAMPAIGN_CREATED',
  'CAMPAIGN_UPDATED',
  'CAMPAIGN_DELETED',
  'CAMPAIGN_SENT',
  'CAMPAIGNS_RESET',
  // System
  'ADMIN_LOGIN',
  'SETTINGS_CHANGED',
  // Transaction Lifecycle
  'TRANSACTION_QUOTA_REACHED',
  'RETENTION_REMINDER_SENT',
  'RETENTION_FINAL_WARNING_SENT',
  'TRANSACTIONS_AUTO_DELETED',
  'USER_EXPORT_CONFIRMED',
  // Admin Lifecycle Management
  'RETENTION_RESET_BY_ADMIN',
  'RETENTION_MANUAL_TRIGGER',
  'RETENTION_SCHEDULED_RUN',
  // User-Auth-Events (M-5)
  'USER_LOGIN',
  'USER_LOGIN_FAILED',
  'USER_REGISTERED',
  'USER_ACCOUNT_LOCKED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'EMAIL_CHANGED',
  // Audit-Log Management
  'AUDIT_LOG_CLEARED',
  'AUDIT_LOG_ENTRIES_DELETED',
];

const auditLogSchema = new mongoose.Schema(
  {
    // Admin der die Aktion ausgeführt hat
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = API-Key Auth (kein User-Kontext)
    },
    adminName: {
      type: String,
      default: 'System/API-Key',
      maxlength: 100,
    },

    // Ausgeführte Aktion
    action: {
      type: String,
      required: [true, 'Action ist erforderlich'],
      enum: AUDIT_ACTIONS,
      index: true,
    },

    // Betroffener User (falls zutreffend)
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetUserName: {
      type: String,
      default: null,
      maxlength: 100,
    },

    // Zusätzliche Details (vorher/nachher, Grund, etc.)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Request-Kontext
    requestId: {
      type: String,
      default: null,
      maxlength: 100,
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

    // Geolocation (aus IP abgeleitet – nur Land-Ebene, Stadt ist zu ungenau)
    country: {
      type: String,
      default: null,
      maxlength: 100,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ============================================
// INDEXES
// ============================================

// Häufigste Queries: nach Action filtern, nach Admin filtern, nach Datum sortieren
auditLogSchema.index({ createdAt: -1 }); // Neueste zuerst
auditLogSchema.index({ adminId: 1, createdAt: -1 }); // Logs eines Admins
auditLogSchema.index({ targetUserId: 1, createdAt: -1 }); // Logs für einen User
auditLogSchema.index({ action: 1, createdAt: -1 }); // Logs nach Aktion
auditLogSchema.index({ country: 1, createdAt: -1 }); // Logs nach Land

// TTL-Index: Logs nach 365 Tagen automatisch löschen (DSGVO-konform)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
