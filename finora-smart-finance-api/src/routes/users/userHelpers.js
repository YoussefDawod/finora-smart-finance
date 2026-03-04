// Shared helpers for user routes
const User = require('../../models/User');
const { sendError } = require('../../utils/responseHelper');

/**
 * Lädt User oder gibt 404 zurück
 * @param {string} userId - User ID
 * @param {Object} res - Express Response
 * @param {Object} req - Express Request
 * @returns {Promise<Object|null>} User oder null
 */
async function loadUserOr404(userId, res, req) {
  const user = await User.findById(userId);
  if (!user) {
    sendError(res, req, { error: 'User nicht gefunden', code: 'USER_NOT_FOUND', status: 404 });
    return null;
  }
  return user;
}

module.exports = {
  loadUserOr404,
};
