const passwordResetService = require('../../services/passwordResetService');
const logger = require('../../utils/logger');
const { sendError } = require('../../utils/responseHelper');

// Password Management
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return sendError(res, req, {
        error: 'Passwörter erforderlich',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    const result = await passwordResetService.changePassword(
      req.user._id,
      currentPassword,
      newPassword,
      { ip: req.clientIp, userAgent: req.headers['user-agent'] }
    );

    if (!result.changed) {
      const statusCode = result.code === 'INVALID_PASSWORD' ? 401 : 400;
      return sendError(res, req, { error: result.error, code: result.code, status: statusCode });
    }

    return res
      .status(200)
      .json({ success: true, changed: true, data: { message: result.message } });
  } catch (err) {
    logger.error('changePassword error:', err);
    return sendError(res, req, {
      error: 'Passwortänderung fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    await passwordResetService.initiatePasswordReset(email, {
      ip: req.clientIp,
      userAgent: req.headers['user-agent'],
    });

    // Immer 200 zurückgeben — verhindert E-Mail-Enumeration
    return res.status(200).json({ success: true, data: { sent: true } });
  } catch (err) {
    logger.error('forgotPassword error:', err);
    return sendError(res, req, {
      error: 'Anfrage fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password, newPassword, passwordConfirm } = req.body || {};
    const candidatePassword = newPassword || password;

    if (passwordConfirm && candidatePassword !== passwordConfirm) {
      return sendError(res, req, {
        error: 'Passwörter stimmen nicht überein',
        code: 'PASSWORD_MISMATCH',
        status: 400,
      });
    }

    const result = await passwordResetService.completePasswordReset(token, candidatePassword, {
      ip: req.clientIp,
      userAgent: req.headers['user-agent'],
    });

    if (!result.reset) {
      return sendError(res, req, { error: result.error, code: result.code, status: 400 });
    }

    return res.status(200).json({ success: true, changed: true, data: { reset: true } });
  } catch (err) {
    logger.error('resetPassword error:', err);
    return sendError(res, req, {
      error: 'Passwort-Zurücksetzen fehlgeschlagen',
      code: 'SERVER_ERROR',
      status: 500,
    });
  }
}

module.exports = {
  changePassword,
  forgotPassword,
  resetPassword,
};
