/**
 * Profile Service
 * Handles user profile operations (get, update, delete)
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validateName } = require('../validators/authValidation');
const authService = require('./authService');

/**
 * Gets current user profile
 * @param {Object} user - User object from request
 * @returns {Object} Sanitized user profile
 */
function getUserProfile(user) {
  return authService.sanitizeUserForAuth(user);
}

/**
 * Updates user profile (name only)
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update (name)
 * @returns {Promise<Object>} Updated user
 */
async function updateUserProfile(userId, updateData = {}) {
  const { name } = updateData;

  if (!name) {
    return { updated: false, error: 'Name ist erforderlich', code: 'INVALID_INPUT' };
  }

  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    return { updated: false, error: nameValidation.error, code: 'INVALID_INPUT' };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { updated: false, error: 'Benutzer nicht gefunden', code: 'USER_NOT_FOUND' };
  }

  user.name = nameValidation.name;
  await user.save();

  return {
    updated: true,
    user: authService.sanitizeUserForAuth(user),
  };
}

/**
 * Deletes user account and associated data
 * @param {string} userId - User ID
 * @param {string} confirmEmail - Email confirmation
 * @param {string} actualEmail - User's actual email
 * @returns {Promise<Object>} Deletion result
 */
async function deleteUserAccount(userId, confirmEmail, actualEmail) {
  if (!confirmEmail) {
    return { deleted: false, error: 'Email-Bestätigung erforderlich', code: 'MISSING_EMAIL' };
  }

  if (confirmEmail !== actualEmail) {
    return { deleted: false, error: 'Email stimmt nicht überein', code: 'EMAIL_MISMATCH' };
  }

  // Delete all user transactions
  await Transaction.deleteMany({ userId });

  // Delete user account
  await User.findByIdAndDelete(userId);

  return {
    deleted: true,
    message: 'Account und alle zugehörigen Daten wurden gelöscht',
  };
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
};
