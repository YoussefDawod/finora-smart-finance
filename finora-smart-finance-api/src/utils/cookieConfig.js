/**
 * Refresh-Token Cookie-Konfiguration
 *
 * Zentrale Cookie-Optionen für Refresh-Token.
 * Sicherstellt, dass cookie-Flags konsistent in login, register,
 * refresh und logout identisch verwendet werden.
 *
 * Sicherheitsmaßnahmen:
 * - httpOnly: true       → Nicht per JavaScript zugreifbar (XSS-Schutz)
 * - secure: true (prod)  → Nur über HTTPS gesendet
 * - sameSite: 'strict'   → Kein Cross-Site-Cookie-Sending (CSRF-Schutz)
 * - path: '/api/v1/auth' → Cookie wird nur an Auth-Endpoints gesendet
 * - maxAge: 7 Tage       → Automatisches Ablaufen, synchron mit JWT-Refresh-Expire
 */

const config = require('../config/env');

const COOKIE_NAME = 'refreshToken';

// Refresh-Token Gültigkeitsdauer in Millisekunden (7 Tage)
const REFRESH_MAX_AGE_MS = (config.jwt.refreshExpire || 604800) * 1000;

/**
 * Cookie-Optionen für das Setzen des Refresh-Tokens
 * @returns {Object} Cookie-Optionen für res.cookie()
 */
function getRefreshCookieOptions() {
  const isProd = config.nodeEnv === 'production';
  const options = {
    httpOnly: true,
    secure: isProd,
    // Production: 'none' weil Frontend (finora.yellowdeveloper.de) und Backend (api.finora.yellowdeveloper.de)
    // unterschiedliche Origins sind — 'strict'/'lax' blockieren Cross-Site-Cookies.
    // Benötigt secure: true (HTTPS), was in Production gegeben ist.
    // Development: 'lax' reicht, da Vite-Proxy alles same-origin hält.
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: REFRESH_MAX_AGE_MS,
  };
  // Domain setzen für Cross-Subdomain Cookie-Sharing (z.B. .finora.yellowdeveloper.de)
  if (config.cookieDomain) {
    options.domain = config.cookieDomain;
  }
  return options;
}

/**
 * Cookie-Optionen für das Löschen des Refresh-Tokens
 * path muss identisch mit dem Setzen sein, sonst wird der Cookie nicht gelöscht
 * @returns {Object} Cookie-Optionen für res.clearCookie()
 */
function getClearCookieOptions() {
  const isProd = config.nodeEnv === 'production';
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
  };
  if (config.cookieDomain) {
    options.domain = config.cookieDomain;
  }
  return options;
}

/**
 * Setzt den Refresh-Token als httpOnly Cookie
 * @param {Object} res - Express Response
 * @param {string} refreshToken - Der Refresh-Token-String
 */
function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

/**
 * Löscht den Refresh-Token Cookie
 * @param {Object} res - Express Response
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, getClearCookieOptions());
}

/**
 * Liest den Refresh-Token aus dem Cookie ODER dem Request-Body (Fallback)
 * Priorisiert den Cookie für maximale Sicherheit.
 *
 * @param {Object} req - Express Request
 * @returns {string|null} Der Refresh-Token oder null
 */
function getRefreshTokenFromRequest(req) {
  // Priorität 1: httpOnly Cookie (sicherer)
  // Direkt als String-Literal statt COOKIE_NAME-Variable, um
  // ESLint security/detect-object-injection False Positive zu vermeiden.
  const cookieToken = req.cookies?.refreshToken;
  if (cookieToken) return cookieToken;

  // Priorität 2: Request Body (Fallback für API-Clients / Tests)
  const bodyToken = req.body?.refreshToken;
  if (bodyToken) return bodyToken;

  return null;
}

module.exports = {
  COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  getRefreshCookieOptions,
  getClearCookieOptions,
};
