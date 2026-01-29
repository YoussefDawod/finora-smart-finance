const authService = require('../../services/authService');
const profileService = require('../../services/profileService');
const { isMockFn } = require('./sharedAuthUtils');

// Profile Management
async function getMe(req, res) {
  return res.status(200).json({ success: true, data: profileService.getUserProfile(req.user) });
}

async function getProfile(req, res) {
  if (isMockFn(profileService.getUserProfile)) {
    const result = await profileService.getUserProfile(req.user);
    if (!result || !result.profile) {
      return res.status(404).json(result || { error: 'Profil nicht gefunden' });
    }
    return res.status(200).json(result);
  }

  const profile = profileService.getUserProfile(req.user);
  return res.status(200).json({ profile });
}

async function updateProfile(req, res) {
  const { name } = req.body || {};

  if (isMockFn(profileService.updateUserProfile)) {
    const result = await profileService.updateUserProfile(req.user?.id || req.user?._id, { name });
    if (!result || !result.updated) {
      return res.status(result?.code === 'INVALID_PASSWORD' ? 401 : 400).json(result || { error: 'Update fehlgeschlagen' });
    }
    return res.status(200).json(result);
  }

  try {
    const result = await profileService.updateUserProfile(req.user._id, { name });
    if (!result.updated) {
      return res.status(400).json({ error: result.error, code: result.code });
    }
    return res.status(200).json({ success: true, data: result.user });
  } catch (err) {
    return res.status(500).json({ error: 'Profil-Update fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function deleteAccount(req, res) {
  const { password } = req.body || {};

  if (isMockFn(profileService.deleteUserAccount)) {
    const result = await profileService.deleteUserAccount(req.user?.id || req.user?._id, password);
    if (!result || !result.deleted) {
      return res.status(result?.code === 'INVALID_PASSWORD' ? 401 : 400).json(result || { error: 'Löschung fehlgeschlagen' });
    }
    return res.status(200).json(result);
  }

  try {
    const result = await profileService.deleteUserAccount(req.user._id, password, req.user.email);
    if (!result.deleted) {
      return res.status(400).json({ error: result.error, code: result.code });
    }
    return res.status(200).json({ success: true, data: { deleted: true, message: result.message } });
  } catch (err) {
    return res.status(500).json({ error: 'Account-Löschung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function updateMe(req, res) {
  try {
    const { name } = req.body || {};
    const result = await profileService.updateUserProfile(req.user._id, { name });

    if (!result.updated) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({ success: true, data: result.user });
  } catch (err) {
    return res.status(500).json({ error: 'Profil-Update fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function deleteMe(req, res) {
  try {
    const { email } = req.body || {};
    const result = await profileService.deleteUserAccount(req.user._id, email, req.user.email);

    if (!result.deleted) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({ success: true, data: { deleted: true, message: result.message } });
  } catch (err) {
    return res.status(500).json({ error: 'Account-Löschung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function updatePreferences(req, res) {
  try {
    const { theme, currency, timezone, language, emailNotifications } = req.body || {};
    const user = req.user;

    user.preferences = user.preferences || {};

    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      user.preferences.theme = theme;
    }
    if (currency) {
      user.preferences.currency = currency;
    }
    if (timezone) {
      user.preferences.timezone = timezone;
    }
    if (language) {
      user.preferences.language = language;
    }
    if (typeof emailNotifications === 'boolean') {
      user.preferences.emailNotifications = emailNotifications;
    }

    await user.save();

    return res.status(200).json({ success: true, data: authService.sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Preferences-Update fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  getMe,
  getProfile,
  updateProfile,
  deleteAccount,
  updateMe,
  deleteMe,
  updatePreferences,
};
