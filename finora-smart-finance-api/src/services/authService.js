/**
 * Auth Service Module
 * Zentrale Business-Logik für Authentication
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

// Token TTL Konstanten
const ACCESS_TTL_SECONDS = 3600; // 1h
const REFRESH_TTL_SECONDS = 7 * 24 * 3600; // 7d

/**
 * Generiert einen Access Token für einen User
 * @param {Object} user - Der User aus der DB
 * @returns {string} JWT Access Token
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), name: user.name, email: user.email || null },
    config.jwt.secret,
    { expiresIn: ACCESS_TTL_SECONDS }
  );
}

/**
 * Generiert einen neuen Refresh Token
 * @returns {string} Zufälliger Hex-String
 */
function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Erstellt einen Hash für Token-Speicherung
 * @param {string} token - Der zu hashende Token
 * @returns {string} SHA256 Hash des Tokens
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sanitiert User-Daten für die Response
 * @param {Object} user - Der User aus der DB
 * @returns {Object} Sichere User-Daten ohne sensible Felder
 */
function sanitizeUser(user) {
  const { _id, email, name, isVerified, createdAt, updatedAt, understoodNoEmailReset } = user;
  return {
    id: _id.toString(),
    email: email || null,
    name,
    isVerified,
    hasEmail: !!email,
    canResetPassword: !!email && isVerified,
    understoodNoEmailReset,
    createdAt,
    updatedAt,
  };
}

/**
 * Generiert Tokens und speichert Refresh Token am User
 * @param {Object} user - Der User aus der DB
 * @param {Object} metadata - Metadaten wie userAgent und IP
 * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
 */
async function generateAuthTokens(user, metadata = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  
  user.addRefreshToken(refreshToken, REFRESH_TTL_SECONDS, {
    userAgent: metadata.userAgent,
    ip: metadata.ip,
  });
  await user.save();
  
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TTL_SECONDS,
  };
}

/**
 * Rotiert einen Refresh Token (entfernt alten, erstellt neuen)
 * @param {Object} user - Der User aus der DB
 * @param {string} oldRefreshToken - Der alte Refresh Token
 * @param {Object} metadata - Metadaten wie userAgent und IP
 * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
 */
async function rotateRefreshToken(user, oldRefreshToken, metadata = {}) {
  user.removeRefreshToken(oldRefreshToken);
  return generateAuthTokens(user, metadata);
}

/**
 * Validiert einen Refresh Token und gibt den gespeicherten Token zurück
 * @param {Object} user - Der User aus der DB
 * @param {string} refreshToken - Der zu validierende Token
 * @returns {{valid: boolean, error?: string, stored?: Object}}
 */
function validateRefreshToken(user, refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const stored = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
  
  if (!stored) {
    return { valid: false, error: 'Ungültiger Refresh-Token' };
  }
  
  if (stored.expiresAt < new Date()) {
    return { valid: false, error: 'Refresh-Token abgelaufen' };
  }
  
  return { valid: true, stored };
}

/**
 * Erstellt Token-Response-Daten
 * @param {Object} tokens - Die generierten Tokens
 * @param {Object} user - Der User
 * @returns {Object} Response-Daten
 */
function buildAuthResponse(tokens, user) {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    user: sanitizeUser(user),
  };
}

module.exports = {
  // Token-Funktionen
  signAccessToken,
  generateRefreshToken,
  hashToken,
  generateAuthTokens,
  rotateRefreshToken,
  validateRefreshToken,
  
  // User-Funktionen
  sanitizeUser,
  buildAuthResponse,
  
  // Konstanten
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
};
