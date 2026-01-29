// Shared helpers for user routes
const User = require('../../models/User');
const logger = require('../../utils/logger');

/**
 * Lädt User oder gibt 404 zurück
 * @param {string} userId - User ID
 * @param {Object} res - Express Response
 * @returns {Promise<Object|null>} User oder null
 */
async function loadUserOr404(userId, res) {
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User nicht gefunden' });
    return null;
  }
  return user;
}

/**
 * Zentrale Server-Error Behandlung
 * @param {Object} res - Express Response
 * @param {string} context - Kontext für Logging
 * @param {Error} error - Fehler-Objekt
 */
function handleServerError(res, context, error) {
  logger.error(`${context} error:`, error);
  res.status(500).json({ success: false, message: 'Server error' });
}

module.exports = {
  loadUserOr404,
  handleServerError,
};
