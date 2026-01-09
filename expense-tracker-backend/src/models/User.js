const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  userAgent: String,
  ip: String,
});

const UserSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'E-Mail ist ungültig'],
      index: true
    },
    passwordHash: { type: String, required: true },
    name: { type: String, default: '' },
    lastName: { type: String, default: '' },
    avatar: { type: String, default: null },
    phone: { 
      type: String, 
      default: null,
      match: [/^[\d\s\-\+\(\)]+$|^$/, 'Telefonnummer hat ungültiges Format']
    },
    isVerified: { type: Boolean, default: false },

    verificationToken: String,
    verificationExpires: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    emailChangeToken: String,
    emailChangeNewEmail: String,
    emailChangeExpires: Date,
    newEmailPending: String,

    preferences: {
      theme: { 
        type: String, 
        default: 'system', 
        enum: ['light', 'dark', 'system']
      },
      currency: { 
        type: String, 
        default: 'EUR',
        enum: ['USD', 'EUR', 'GBP', 'CHF', 'JPY']
      },
      timezone: { 
        type: String, 
        default: 'Europe/Berlin'
      },
      language: { 
        type: String, 
        default: 'de',
        enum: ['en', 'de', 'fr']
      },
      emailNotifications: { type: Boolean, default: true },
    },

    lastLogin: { type: Date, default: null },
    lastPasswordChange: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },

    refreshTokens: [RefreshTokenSchema],
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ emailChangeToken: 1 }, { sparse: true });
UserSchema.index({ lastLogin: 1 });

// Pre-save Hook: Hash password wenn neu oder geändert
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.lastPasswordChange = new Date();
    this.passwordChangedAt = new Date();
    return next();
  } catch (error) {
    return next(error);
  }
});

// Pre-save Hook: Validate preferences structure
UserSchema.pre('save', function (next) {
  if (this.preferences) {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];
    const validThemes = ['light', 'dark', 'system'];
    const validLanguages = ['en', 'de', 'fr'];

    if (this.preferences.currency && !validCurrencies.includes(this.preferences.currency)) {
      return next(new Error('Ungültige Währung'));
    }
    if (this.preferences.theme && !validThemes.includes(this.preferences.theme)) {
      return next(new Error('Ungültiges Theme'));
    }
    if (this.preferences.language && !validLanguages.includes(this.preferences.language)) {
      return next(new Error('Ungültige Sprache'));
    }
  }
  next();
});

// toJSON: Sensitive fields entfernen
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  delete obj.verificationToken;
  delete obj.verificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailChangeToken;
  delete obj.__v;
  return obj;
};

// comparePassword: Verifiziere password
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// canChangePassword: Prüfe ob Passwort gerade geändert wurde (mindestens 1h)
UserSchema.methods.canChangePassword = function () {
  if (!this.lastPasswordChange) {
    return true;
  }
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.lastPasswordChange < oneHourAgo;
};

// generateEmailChangeToken: Generiere Token für Email-Change-Verifikation
UserSchema.methods.generateEmailChangeToken = function (newEmail) {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailChangeToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailChangeNewEmail = newEmail;
  this.newEmailPending = newEmail;
  this.emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return token;
};

// recordLogin: Update lastLogin timestamp
UserSchema.methods.recordLogin = function (meta = {}) {
  this.lastLogin = new Date();
  if (meta.userAgent || meta.ip) {
    this.addRefreshToken(crypto.randomBytes(32).toString('hex'), 7 * 24 * 3600, meta);
  }
};

// Legacy methods (kept for backward compatibility with existing code)
UserSchema.methods.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
  this.lastPasswordChange = new Date();
  this.passwordChangedAt = new Date();
};

UserSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.methods.generateVerification = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return token;
};

UserSchema.methods.generatePasswordReset = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  return token;
};

UserSchema.methods.addRefreshToken = function (token, ttlSeconds = 7 * 24 * 3600, meta = {}) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  this.refreshTokens.push({ tokenHash, expiresAt, ...meta });
};

UserSchema.methods.removeRefreshToken = function (token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  this.refreshTokens = this.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
};

UserSchema.statics.findByRefreshToken = async function (token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({ 'refreshTokens.tokenHash': tokenHash });
};

module.exports = mongoose.model('User', UserSchema);
