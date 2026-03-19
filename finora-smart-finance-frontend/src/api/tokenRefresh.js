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
// IN-MEMORY TOKEN STORAGE (XSS-sicher)
// ============================================

/**
 * Access-Token wird ausschließlich als JavaScript-Variable im Speicher gehalten.
 * → Kein Zugriff über XSS möglich (im Gegensatz zu localStorage).
 * → Token geht bei Seiten-Reload verloren — wird per httpOnly Refresh-Cookie erneuert.
 * @type {string|null}
 */
let inMemoryAccessToken = null;

/**
 * Gibt den aktuellen Access-Token aus dem Speicher zurück
 * @returns {string|null}
 */
export function getAccessToken() {
  return inMemoryAccessToken;
}

/**
 * Setzt den Access-Token im Speicher
 * @param {string|null} token
 */
export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

/**
 * Löscht den Access-Token aus dem Speicher und entfernt Legacy-Einträge
 */
export function clearAccessToken() {
  inMemoryAccessToken = null;
  // Legacy-Einträge aus localStorage/sessionStorage entfernen (Migration)
  try {
    globalThis.localStorage?.removeItem('auth_token');
    globalThis.sessionStorage?.removeItem('auth_token');
  } catch {
    /* ignore */
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
 * Speichert neuen Access-Token im In-Memory-Speicher
 * Refresh-Token wird NICHT gespeichert — er kommt als httpOnly Cookie
 * @param {string} accessToken
 * @param {string} _refreshToken — ignoriert (wird per Cookie verwaltet)
 */
// eslint-disable-next-line no-unused-vars
function saveTokens(accessToken, _refreshToken) {
  inMemoryAccessToken = accessToken;
}

/**
 * Entfernt alle Auth-Tokens und dispatched Logout-Event
 */
function clearTokensAndLogout() {
  clearAccessToken();
  try {
    // Legacy: Refresh-Token aus Storage entfernen
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
  return EXCLUDED_ENDPOINTS.some(endpoint => url.includes(endpoint));
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
    .then(newAccessToken => {
      processQueue(newAccessToken, null);
      return newAccessToken;
    })
    .catch(error => {
      processQueue(null, error);
      clearTokensAndLogout();
      throw error;
    })
    .finally(() => {
      isRefreshing = false;
    });
}

// ============================================
// INITIAL SESSION CHECK
// ============================================

/** @type {Promise<string|null>|null} Laufender Initial-Refresh (Singleton) */
let initialRefreshPromise = null;

/**
 * Versucht beim App-Start einen Token-Refresh über das httpOnly Cookie.
 * Im Gegensatz zu refreshAccessToken() löst ein Fehler **kein** Logout-Event aus
 * und zeigt keine Toast-Meldung — rein passiver Session-Check.
 *
 * WICHTIG: Kein AbortSignal! Token-Rotation auf dem Server ist nicht rückgängig
 * zu machen. Ein Abort würde den neuen Token verwerfen, während der alte auf dem
 * Server bereits invalidiert wurde → permanenter Logout.
 *
 * Bei React StrictMode wird derselbe Request wiederverwendet (Singleton-Pattern),
 * damit nicht zwei konkurrierende Rotationen stattfinden.
 *
 * @returns {Promise<string|null>} Access Token bei Erfolg, null bei Fehler
 */
export function tryInitialRefresh() {
  // Singleton: Falls bereits ein Refresh läuft, dasselbe Promise zurückgeben.
  // Verhindert doppelte Token-Rotation bei StrictMode (mount → unmount → mount).
  if (initialRefreshPromise) return initialRefreshPromise;

  initialRefreshPromise = axios
    .post(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.auth.refresh}`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true,
      }
    )
    .then(response => {
      const { accessToken, refreshToken: newRefreshToken } = response.data?.data || {};
      if (!accessToken) return null;

      saveTokens(accessToken, newRefreshToken);

      globalThis.window?.dispatchEvent(
        new CustomEvent('auth:token-refreshed', {
          detail: { accessToken, refreshToken: newRefreshToken },
        })
      );

      return accessToken;
    })
    .catch(() => null)
    .finally(() => {
      initialRefreshPromise = null;
    });

  return initialRefreshPromise;
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
  inMemoryAccessToken = null;
}

/**
 * Gibt den aktuellen State zurück (nur für Tests)
 * @returns {{ isRefreshing: boolean, queueLength: number }}
 */
export function __getStateForTesting() {
  return { isRefreshing, queueLength: refreshQueue.length };
}
