/**
 * Campaign Model
 * Newsletter-Kampagnen für Admin-Versand an bestätigte Subscriber
 */

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Betreff ist erforderlich'],
      maxlength: [200, 'Betreff darf maximal 200 Zeichen lang sein'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Inhalt ist erforderlich'],
      maxlength: [50000, 'Inhalt darf maximal 50.000 Zeichen lang sein'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Sprache ist erforderlich'],
      enum: ['de', 'en', 'ar', 'ka'],
    },
    status: {
      type: String,
      enum: ['draft', 'sending', 'sent', 'failed'],
      default: 'draft',
    },
    sentAt: Date,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failCount: {
      type: Number,
      default: 0,
    },
    recipientFilter: {
      language: {
        type: String,
        enum: ['de', 'en', 'ar', 'ka'],
        default: undefined,
      },
      confirmedOnly: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indizes für Sortierung und Filterung
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
