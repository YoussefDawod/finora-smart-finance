/**
 * @fileoverview Token Refresh Module
 * @description Automatisches Token-Refresh mit Mutex-Queue für Race-Condition-Schutz
 *
 * FEATURES:
 * - Automatischer Refresh bei abgelaufenem Access Token (401)
 * - Mutex: nur ein Refresh-Request gleichzeitig, parallele 401s warten
 * - Token-Rotation: neuer Access + Refresh Token nach Refresh
 * - Fail-Safe: bei Refresh-Failure → Logout
 * - Endpoints-Ausschluss: Refresh/Login/Register werden nicht retried
 *
 * @module api/tokenRefresh
 */

import axios from 'axios';
import { API_CONFIG } from './config';
import { ENDPOINTS } from './endpoints';

 

// ============================================
// STATE
// ============================================

/** @type {boolean} Ob gerade ein Refresh läuft */
let isRefreshing = false;

/** @type {Array<{resolve: Function, reject: Function}>} Wartende Requests */
let refreshQueue = [];

// ============================================
// STORAGE HELPERS (standalone, ohne React-Hooks)
// ============================================

const TOKEN_KEY = 'auth_token';
const REMEMBER_ME_KEY = 'auth_remember_me';

/**
 * Bestimmt den aktiven Storage basierend auf Remember-Me-Setting
 * @returns {Storage}
 */
function getActiveStorage() {
  try {
    const rememberMe = globalThis.localStorage?.getItem(REMEMBER_ME_KEY);
    return rememberMe === 'false' ? globalThis.sessionStorage : globalThis.localStorage;
  } catch {
    return globalThis.localStorage;
  }
}

/**
 * Liest den Refresh Token aus localStorage oder sessionStorage
 * @deprecated Refresh-Token wird jetzt als httpOnly Cookie verwaltet.
 *             Nur noch für die Migration bestehender Sessions relevant.
 * @returns {string|null}
 */
export function getStoredRefreshToken() {
  try {
    return (
      globalThis.localStorage?.getItem('refresh_token') ||
      globalThis.sessionStorage?.getItem('refresh_token')
    );
  } catch {
    return null;
  }
}

/**
 * Speichert neue Tokens im aktiven Storage
 * Refresh-Token wird NICHT mehr in Storage gespeichert — er kommt als httpOnly Cookie
 * @param {string} accessToken
 * @param {string} _refreshToken — ignoriert (wird per Cookie verwaltet)
 */
function saveTokens(accessToken, _refreshToken) {
  try {
    const storage = getActiveStorage();
    storage?.setItem(TOKEN_KEY, accessToken);
    // Refresh-Token wird NICHT mehr in localStorage/sessionStorage gespeichert.
    // Er wird vom Backend als httpOnly Cookie gesetzt und automatisch mitgesendet.
  } catch (error) {
    globalThis.console?.error('[TokenRefresh] Failed to save tokens:', error);
  }
}

/**
 * Entfernt alle Auth-Tokens und dispatched Logout-Event
 */
function clearTokensAndLogout() {
  try {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    globalThis.sessionStorage?.removeItem(TOKEN_KEY);
    // Refresh-Token aus Storage entfernen (Legacy-Migration)
    globalThis.localStorage?.removeItem('refresh_token');
    globalThis.sessionStorage?.removeItem('refresh_token');
    globalThis.window?.dispatchEvent(new CustomEvent('auth:unauthorized'));
  } catch (error) {
    globalThis.console?.warn('[TokenRefresh] Failed to clear tokens:', error);
  }
}

// ============================================
// EXCLUDED ENDPOINTS
// ============================================

/**
 * Endpoints, die NICHT retried werden sollen (Auth-Flows selbst)
 */
const EXCLUDED_ENDPOINTS = [
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.register,
  ENDPOINTS.auth.refresh,
  ENDPOINTS.auth.logout,
  ENDPOINTS.auth.forgotPassword,
  ENDPOINTS.auth.resetPassword,
  ENDPOINTS.auth.verify,
];

/**
 * Prüft ob ein Request vom Token-Refresh ausgeschlossen ist
 * @param {import('axios').AxiosRequestConfig} config
 * @returns {boolean}
 */
export function isExcludedFromRefresh(config) {
  const url = config?.url || '';
  return EXCLUDED_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

// ============================================
// REFRESH LOGIC
// ============================================

/**
 * Verarbeitet die Warteschlange nach erfolgreichem/fehlgeschlagenem Refresh
 * @param {string|null} newAccessToken - Neuer Token bei Erfolg, null bei Fehler
 * @param {Error|null} error - Fehler bei Misserfolg
 */
function processQueue(newAccessToken, error) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newAccessToken);
    }
  });
  refreshQueue = [];
}

/**
 * Führt den Token-Refresh durch
 * Wird nur einmal gleichzeitig ausgeführt (Mutex via isRefreshing)
 *
 * @returns {Promise<string>} Neuer Access Token
 * @throws {Error} Bei Refresh-Failure
 */
async function executeTokenRefresh() {
  // Refresh-Token wird automatisch als httpOnly Cookie mitgesendet (withCredentials: true)
  // Kein Body-Parameter nötig — das Backend liest den Token aus dem Cookie.

  const response = await axios.post(
    `${API_CONFIG.BASE_URL}${ENDPOINTS.auth.refresh}`,
    {}, // Leerer Body — Cookie wird automatisch gesendet
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: API_CONFIG.TIMEOUT,
      withCredentials: true,
    }
  );

  const { accessToken, refreshToken: newRefreshToken } = response.data?.data || {};

  if (!accessToken) {
    throw new Error('No access token in refresh response');
  }

  // Neue Tokens speichern
  saveTokens(accessToken, newRefreshToken);

  // Event für AuthContext dispatchen (Token im State aktualisieren)
  globalThis.window?.dispatchEvent(
    new CustomEvent('auth:token-refreshed', {
      detail: { accessToken, refreshToken: newRefreshToken },
    })
  );

  return accessToken;
}

/**
 * Versucht einen Token-Refresh und wartet ggf. auf laufenden Refresh
 *
 * Bei parallelen 401-Responses:
 * - Der erste Request startet den Refresh
 * - Alle weiteren werden in die Queue gestellt
 * - Nach Refresh werden alle queued Requests mit dem neuen Token resolved
 *
 * @returns {Promise<string>} Neuer Access Token
 */
export function refreshAccessToken() {
  // Wenn bereits ein Refresh läuft → in Queue einreihen
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  return executeTokenRefresh()
    .then((newAccessToken) => {
      processQueue(newAccessToken, null);
      return newAccessToken;
    })
    .catch((error) => {
      processQueue(null, error);
      clearTokensAndLogout();
      throw error;
    })
    .finally(() => {
      isRefreshing = false;
    });
}

// ============================================
// TESTING HELPERS
// ============================================

/**
 * Setzt den internen State zurück (nur für Tests)
 */
export function __resetForTesting() {
  isRefreshing = false;
  refreshQueue = [];
}

/**
 * Gibt den aktuellen State zurück (nur für Tests)
 * @returns {{ isRefreshing: boolean, queueLength: number }}
 */
export function __getStateForTesting() {
  return { isRefreshing, queueLength: refreshQueue.length };
}
