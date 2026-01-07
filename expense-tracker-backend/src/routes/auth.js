const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Simple in-memory refresh token store
// In production use a DB or signed JWTs
const REFRESH_STORE = new Map(); // key: refreshToken, value: { user, expiresAt }

const ACCESS_TTL_SECONDS = 3600; // 1 hour
const REFRESH_TTL_SECONDS = 7 * 24 * 3600; // 7 days

function issueTokens(user) {
  const accessToken = uuidv4();
  const refreshToken = uuidv4();
  const now = Date.now();

  REFRESH_STORE.set(refreshToken, {
    user,
    expiresAt: now + REFRESH_TTL_SECONDS * 1000,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TTL_SECONDS,
    user,
  };
}

function validateRefreshToken(token) {
  if (!token) return { valid: false, reason: 'MISSING_TOKEN' };
  const entry = REFRESH_STORE.get(token);
  if (!entry) return { valid: false, reason: 'INVALID_TOKEN' };
  if (Date.now() > entry.expiresAt) {
    REFRESH_STORE.delete(token);
    return { valid: false, reason: 'TOKEN_EXPIRED' };
  }
  return { valid: true, entry };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email und Passwort sind erforderlich',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Demo: akzeptiere jede Kombination
    const user = { id: uuidv4(), email };
    const tokens = issueTokens(user);

    return res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    return res.status(500).json({
      error: 'Login fehlgeschlagen',
      code: 'SERVER_ERROR',
      message: err.message,
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    const { valid, entry, reason } = validateRefreshToken(refreshToken);

    if (!valid) {
      return res.status(401).json({
        error: 'Ungültiger oder abgelaufener Refresh-Token',
        code: reason,
      });
    }

    // Optional: rotate refresh token
    REFRESH_STORE.delete(refreshToken);
    const tokens = issueTokens(entry.user);

    return res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    return res.status(500).json({
      error: 'Token-Refresh fehlgeschlagen',
      code: 'SERVER_ERROR',
      message: err.message,
    });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken && REFRESH_STORE.has(refreshToken)) {
      REFRESH_STORE.delete(refreshToken);
    }

    return res.status(200).json({ success: true, data: { loggedOut: true } });
  } catch (err) {
    return res.status(500).json({
      error: 'Logout fehlgeschlagen',
      code: 'SERVER_ERROR',
      message: err.message,
    });
  }
});

module.exports = router;
