/**
 * Subscriber Model
 * Newsletter-Abonnenten mit Double Opt-In
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'E-Mail ist erforderlich'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ungültiges E-Mail-Format'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmationToken: String,
    confirmationExpires: Date,
    unsubscribeToken: String,
    subscribedAt: Date,
    language: {
      type: String,
      default: 'de',
      enum: ['de', 'en', 'ar', 'ka'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Generiert einen Bestätigungs-Token (Double Opt-In)
 * @returns {string} Unhashed Token für den Email-Link
 */
subscriberSchema.methods.generateConfirmationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.confirmationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Std
  return token;
};

/**
 * Generiert einen Abmelde-Token
 * @returns {string} Unhashed Token für Abmelde-Link
 */
subscriberSchema.methods.generateUnsubscribeToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.unsubscribeToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

// TTL-Index: Unbestätigte Abonnenten nach 48 Stunden automatisch löschen
subscriberSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 48 * 60 * 60,
    partialFilterExpression: { isConfirmed: false },
  }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
