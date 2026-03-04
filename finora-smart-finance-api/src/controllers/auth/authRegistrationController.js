const User = require('../../models/User');
const authService = require('../../services/authService');
const registrationService = require('../../services/registrationService');
const loginService = require('../../services/loginService');
const lifecycleService = require('../../services/transactionLifecycleService');
const logger = require('../../utils/logger');
const { sendError } = require('../../utils/responseHelper');
const {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
} = require('../../utils/cookieConfig');

// Registration & Login
async function register(req, res) {
  try {
    const { name, password, email, understoodNoEmailReset } = req.body || {};

    const validation = await registrationService.validateRegistrationInput(
      name,
      password,
      email,
      understoodNoEmailReset
    );

    if (!validation.valid) {
      return sendError(res, req, { error: validation.error, code: validation.code, status: 400 });
    }

    const { user, tokens, verificationLink } = await registrationService.registerUser(
      validation.data,
      { userAgent: req.headers['user-agent'], ip: req.ip }
    );

    const responseData = {
      ...authService.buildAuthResponse(tokens, user),
      ...(verificationLink && { verificationLink }),
    };

    // Refresh-Token als httpOnly Cookie setzen
    if (tokens?.refreshToken) {
      setRefreshTokenCookie(res, tokens.refreshToken);
    }

    return res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    const duplicateError = registrationService.handleDuplicateError(err);
    if (duplicateError) {
      return sendError(res, req, { error: duplicateError.error, code: duplicateError.code, status: 409 });
    }
    logger.error('Registration error:', err);
    return sendError(res, req, { error: 'Registrierung fehlgeschlagen', code: 'SERVER_ERROR', status: 500 });
  }
}

async function login(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if ((!name && !email) || !password) {
      return sendError(res, req, { error: 'Name/Email und Passwort erforderlich', code: 'INVALID_INPUT', status: 400 });
    }

    const identifier = name || email;
    const validation = loginService.validateLoginInput(identifier, password);
    if (!validation.valid) {
      return sendError(res, req, { error: validation.error, code: validation.code, status: 400 });
    }

    const authResult = await loginService.authenticateUser(identifier, password);
    if (!authResult.success) {
      return sendError(res, req, { error: authResult.error, code: authResult.code, status: 401 });
    }

    const verificationResult = loginService.checkEmailVerification(authResult.user);
    if (!verificationResult.verified) {
      return sendError(res, req, { error: verificationResult.error, code: verificationResult.code, status: 403 });
    }

    const { tokens, user } = await loginService.generateLoginSession(authResult.user, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    if (tokens?.refreshToken) {
      setRefreshTokenCookie(res, tokens.refreshToken);
    }

    const responseData = authService.buildAuthResponse(tokens, user);

    // Lifecycle-Notification prüfen (fire-and-forget, blockiert Login nicht)
    let notification = null;
    try {
      const loginNotification = await lifecycleService.getLoginNotification(user);
      if (loginNotification?.showToast) {
        notification = loginNotification.notification;
      }
    } catch (notifyError) {
      logger.debug(`Login notification check skipped: ${notifyError.message}`);
    }

    return res.status(200).json({
      success: true,
      data: responseData,
      ...(notification && { notification }),
    });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      return sendError(res, req, { error: 'Refresh-Token fehlt', code: 'MISSING_TOKEN', status: 400 });
    }

    const user = await User.findByRefreshToken(refreshToken);
    if (!user) {
      return sendError(res, req, { error: 'Ungültiger Refresh-Token', code: 'INVALID_TOKEN', status: 401 });
    }

    const validation = authService.validateRefreshToken(user, refreshToken);
    if (!validation.valid) {
      return sendError(res, req, { error: validation.error, code: 'TOKEN_EXPIRED', status: 401 });
    }

    const tokens = await authService.rotateRefreshToken(user, refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Neuen rotierten Refresh-Token als Cookie setzen
    if (tokens?.refreshToken) {
      setRefreshTokenCookie(res, tokens.refreshToken);
    }

    return res.status(200).json({
      success: true,
      data: authService.buildAuthResponse(tokens, user),
    });
  } catch (err) {
    logger.error('Token refresh error:', err);
    return sendError(res, req, { error: 'Token-Refresh fehlgeschlagen', code: 'SERVER_ERROR', status: 500 });
  }
}

async function logout(req, res) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      clearRefreshTokenCookie(res);
      return res.status(200).json({ success: true, message: 'Logout erfolgreich' });
    }

    const user = await User.findByRefreshToken(refreshToken);
    if (user) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    clearRefreshTokenCookie(res);
    return res.status(200).json({ success: true, data: { loggedOut: true }, message: 'Logout erfolgreich' });
  } catch (err) {
    logger.error('Logout error:', err);
    return sendError(res, req, { error: 'Logout fehlgeschlagen', code: 'SERVER_ERROR', status: 500 });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
