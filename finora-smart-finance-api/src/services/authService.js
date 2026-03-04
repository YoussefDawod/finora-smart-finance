/**
 * Auth Service Module
 * Zentrale Business-Logik für Authentication
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

// JWT-Algorithmus — zentral definiert, in sign() und verify() erzwungen
const JWT_ALGORITHM = 'HS256';

// Token TTL aus Config (konfigurierbar via JWT_ACCESS_EXPIRE / JWT_REFRESH_EXPIRE)
const ACCESS_TTL_SECONDS = config.jwt.accessExpire;
const REFRESH_TTL_SECONDS = config.jwt.refreshExpire;

/**
 * Generiert einen Access Token für einen User
 * @param {Object} user - Der User aus der DB
 * @returns {string} JWT Access Token
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), name: user.name, role: user.role || 'user' },
    config.jwt.secret,
    { algorithm: JWT_ALGORITHM, expiresIn: ACCESS_TTL_SECONDS }
  );
}

/**
 * Verifiziert einen Access Token mit erzwungenem HS256-Algorithmus
 * Verhindert Algorithm-Confusion-Angriffe (z.B. "none"-Algorithmus)
 * @param {string} token - Der zu verifizierende JWT
 * @returns {Object} Decodiertes Payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError} Bei ungültigem/abgelaufenem Token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret, { algorithms: [JWT_ALGORITHM] });
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
 * Sanitiert User-Daten für Auth-Responses (Login, Token-Refresh)
 * Gibt berechnete Felder wie hasEmail, canResetPassword zurück
 * Für Admin/Profile-Responses stattdessen userSanitizer.sanitizeUser verwenden
 * @param {Object} user - Der User aus der DB
 * @returns {Object} Sichere User-Daten mit berechneten Auth-Feldern
 */
function sanitizeUserForAuth(user) {
  const {
    _id,
    email,
    name,
    isVerified,
    role,
    isActive,
    createdAt,
    updatedAt,
    understoodNoEmailReset,
  } = user;
  return {
    id: _id.toString(),
    email: email || null,
    name,
    isVerified,
    role: role || 'user',
    isActive: isActive !== false,
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
  const stored = user.refreshTokens.find(t => t.tokenHash === tokenHash);

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
    user: sanitizeUserForAuth(user),
  };
}

module.exports = {
  // Token-Funktionen
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  generateAuthTokens,
  rotateRefreshToken,
  validateRefreshToken,

  // User-Funktionen
  sanitizeUserForAuth,
  buildAuthResponse,

  // Konstanten
  JWT_ALGORITHM,
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
};
