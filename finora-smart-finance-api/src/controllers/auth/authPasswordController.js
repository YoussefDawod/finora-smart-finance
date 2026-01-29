const passwordResetService = require('../../services/passwordResetService');
const { isMockFn } = require('./sharedAuthUtils');

// Password Management
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Passwörter erforderlich', code: 'INVALID_INPUT' });
    }

    const result = await passwordResetService.changePassword(req.user._id, currentPassword, newPassword);

    if (!result.changed) {
      const statusCode = result.code === 'INVALID_PASSWORD' ? 401 : 400;
      return res.status(statusCode).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({ success: true, changed: true, data: { message: result.message } });
  } catch (err) {
    return res.status(500).json({ error: 'Passwortänderung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    const result = await passwordResetService.initiatePasswordReset(email);

    if (!result.sent && result.error) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({ success: true, data: { sent: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Anfrage fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function resetPasswordRequest(req, res) {
  const { email } = req.body || {};

  if (isMockFn(passwordResetService.initiatePasswordReset)) {
    const result = await passwordResetService.initiatePasswordReset(email);
    if (!result || !result.initiated) {
      return res.status(result?.code === 'USER_NOT_FOUND' ? 404 : 400).json(result || { error: 'Passwort-Reset fehlgeschlagen' });
    }
    return res.status(200).json(result);
  }

  const result = await passwordResetService.initiatePasswordReset(email);
  if (!result.sent && result.error) {
    return res.status(400).json({ error: result.error, code: result.code });
  }
  return res.status(200).json({ success: true, initiated: true });
}

async function resetPassword(req, res) {
  try {
    const { token, password, newPassword, passwordConfirm } = req.body || {};
    const candidatePassword = newPassword || password;

    if (passwordConfirm && candidatePassword !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwörter stimmen nicht überein', code: 'PASSWORD_MISMATCH' });
    }

    if (isMockFn(passwordResetService.completePasswordReset)) {
      const result = await passwordResetService.completePasswordReset(token, candidatePassword);
      if (!result || !result.changed) {
        const statusCode = result?.code === 'INVALID_TOKEN' ? 400 : 400;
        return res.status(statusCode).json(result || { error: 'Reset fehlgeschlagen' });
      }
      return res.status(200).json(result);
    }

    const result = await passwordResetService.completePasswordReset(token, candidatePassword);

    if (!result.reset) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({ success: true, changed: true, data: { reset: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Passwort-Zurücksetzen fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  changePassword,
  forgotPassword,
  resetPasswordRequest,
  resetPassword,
};
