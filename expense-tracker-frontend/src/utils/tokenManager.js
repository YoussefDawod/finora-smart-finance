/**
 * Token Manager
 * Handles secure token storage, validation, and automatic refresh
 */

// ============================================
// Constants
// ============================================
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'expense_tracker_access_token',
  REFRESH_TOKEN: 'expense_tracker_refresh_token',
  TOKEN_EXPIRY: 'expense_tracker_token_expiry',
};

// Refresh token 5 minutes before expiry (in milliseconds)
const REFRESH_BUFFER = 5 * 60 * 1000;

// ============================================
// State
// ============================================
let refreshTimer = null;
let refreshCallback = null;

/**
 * Validate token format (basic check)
 * @param {string} token - Token to validate
 * @returns {boolean} - True if valid format
 */
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT format check: should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Each part should be base64-encoded (only alphanumeric, +, /, -, _)
  const base64Regex = /^[A-Za-z0-9\-_]+$/;
  return parts.every(part => base64Regex.test(part));
};

// Refresh tokens are opaque (hex string from backend). Accept JWT-style too for flexibility.
const isValidRefreshTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  const hexRegex = /^[a-fA-F0-9]{40,}$/; // backend issues 64-char hex
  if (hexRegex.test(token)) return true;
  return isValidTokenFormat(token);
};

/**
 * Get token expiry timestamp from localStorage
 * @returns {number|null} - Expiry timestamp or null
 */
export const getTokenExpiry = () => {
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return null;
  
  const timestamp = parseInt(expiry, 10);
  return isNaN(timestamp) ? null : timestamp;
};

/**
 * Check if token is still valid (not expired)
 * @param {number|null} expiry - Token expiry timestamp (optional)
 * @returns {boolean} - True if token is valid
 */
export const isTokenValid = (expiry = null) => {
  const tokenExpiry = expiry || getTokenExpiry();
  
  if (!tokenExpiry) {
    return false;
  }
  
  // Add small buffer (1 minute) to account for network latency
  const buffer = 60 * 1000;
  return Date.now() < (tokenExpiry - buffer);
};

/**
 * Save tokens to localStorage
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {number} expiresIn - Token lifetime in seconds
 */
export const saveTokens = (accessToken, refreshToken, expiresIn = 3600) => {
  // Validate token formats
  if (!isValidTokenFormat(accessToken)) {
    console.warn('Invalid access token format');
    return;
  }
  
  if (!isValidRefreshTokenFormat(refreshToken)) {
    console.warn('Invalid refresh token format');
    return;
  }
  
  // Calculate expiry timestamp
  const expiryTimestamp = Date.now() + (expiresIn * 1000);
  
  // Store in localStorage
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTimestamp.toString());
    
    // Set up automatic refresh timer
    setRefreshTimer(expiresIn);
  } catch (error) {
    console.error('Failed to save tokens to localStorage:', error);
    // Handle QuotaExceededError or other storage errors
  }
};

/**
 * Get access token from localStorage
 * @param {boolean} autoRefresh - Attempt to refresh if expired (default: false)
 * @returns {string|null} - Access token or null
 */
export const getAccessToken = (autoRefresh = false) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (!token) {
    return null;
  }
  
  // Validate token format
  if (!isValidTokenFormat(token)) {
    console.warn('Invalid access token format in storage');
    clearTokens();
    return null;
  }
  
  // Check if token is still valid
  if (!isTokenValid()) {
    if (autoRefresh && refreshCallback) {
      // Trigger refresh callback asynchronously
      refreshCallback().catch(error => {
        console.error('Token refresh failed:', error);
      });
    }
    return null;
  }
  
  return token;
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} - Refresh token or null
 */
export const getRefreshToken = () => {
  const token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  
  if (!token) {
    return null;
  }
  
  // Validate token format
  if (!isValidRefreshTokenFormat(token)) {
    console.warn('Invalid refresh token format in storage');
    clearTokens();
    return null;
  }
  
  return token;
};

/**
 * Clear all tokens from localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  
  // Clear refresh timer
  cancelRefreshTimer();
};

/**
 * Set refresh callback function
 * This function will be called when token needs to be refreshed
 * @param {Function} callback - Async function to refresh tokens
 */
export const setRefreshCallback = (callback) => {
  if (typeof callback !== 'function') {
    console.warn('Refresh callback must be a function');
    return;
  }
  refreshCallback = callback;
};

/**
 * Set timer for automatic token refresh
 * @param {number} expiresIn - Token lifetime in seconds
 */
export const setRefreshTimer = (expiresIn) => {
  // Clear existing timer
  cancelRefreshTimer();

  // Calculate when to refresh (expiresIn - REFRESH_BUFFER)
  let refreshDelay = (expiresIn * 1000) - REFRESH_BUFFER;

  // If already within buffer, refresh as soon as possible (min 5s)
  if (refreshDelay <= 0) {
    // Immediate refresh attempt
    if (refreshCallback) {
      Promise.resolve()
        .then(() => refreshCallback())
        .catch(error => console.error('Immediate token refresh failed:', error));
    }
    return;
  }

  // Avoid skipping: schedule minimal timer if less than 1 minute
  const MIN_TIMER_MS = 5000; // 5 seconds minimal delay to avoid tight loops
  if (refreshDelay < 60000) {
    console.debug('Token expires soon; scheduling minimal auto-refresh timer');
    refreshDelay = Math.max(refreshDelay, MIN_TIMER_MS);
  }

  // Set timer to refresh token
  refreshTimer = setTimeout(() => {
    if (refreshCallback) {
      refreshCallback().catch(error => {
        console.error('Automatic token refresh failed:', error);
      });
    }
  }, refreshDelay);

  const minutes = Math.max(refreshDelay / 1000 / 60, 0);
  console.log(`Token will auto-refresh in ${minutes.toFixed(2)} minutes`);
};

/**
 * Cancel automatic refresh timer
 */
export const cancelRefreshTimer = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * Get time until token expiry in milliseconds
 * @returns {number} - Milliseconds until expiry, or 0 if expired/invalid
 */
export const getTimeUntilExpiry = () => {
  const expiry = getTokenExpiry();
  if (!expiry) return 0;
  
  const timeLeft = expiry - Date.now();
  return timeLeft > 0 ? timeLeft : 0;
};

/**
 * Check if refresh is needed (within REFRESH_BUFFER time)
 * @returns {boolean} - True if refresh is needed
 */
export const isRefreshNeeded = () => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  const timeLeft = expiry - Date.now();
  return timeLeft < REFRESH_BUFFER;
};

/**
 * Initialize token manager with stored tokens
 * @returns {boolean} - True if valid tokens were found
 */
export const initializeTokenManager = () => {
  const accessToken = getAccessToken();
  const expiry = getTokenExpiry();
  
  if (accessToken && expiry) {
    // Calculate remaining time
    const expiresIn = Math.floor((expiry - Date.now()) / 1000);
    
    if (expiresIn > 0) {
      // Set up auto-refresh timer
      setRefreshTimer(expiresIn);
      return true;
    }
  }
  
  return false;
};

/**
 * Debug: Get all token info (for development only)
 * @returns {Object} - Token information
 */
export const getTokenInfo = () => {
  const expiry = getTokenExpiry();
  const timeLeft = getTimeUntilExpiry();
  
  return {
    hasAccessToken: !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    hasRefreshToken: !!localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    expiry,
    expiryDate: expiry ? new Date(expiry).toISOString() : null,
    isValid: isTokenValid(),
    isRefreshNeeded: isRefreshNeeded(),
    timeLeftSeconds: Math.floor(timeLeft / 1000),
    timeLeftMinutes: Math.floor(timeLeft / 1000 / 60),
  };
};

// ============================================
// Default Export
// ============================================
export default {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isTokenValid,
  getTokenExpiry,
  setRefreshTimer,
  cancelRefreshTimer,
  setRefreshCallback,
  getTimeUntilExpiry,
  isRefreshNeeded,
  initializeTokenManager,
  getTokenInfo,
};
