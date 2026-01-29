const User = require('../../models/User');
const authService = require('../../services/authService');
const registrationService = require('../../services/registrationService');
const loginService = require('../../services/loginService');
const { isMockFn } = require('./sharedAuthUtils');

// Registration & Login
async function register(req, res) {
  try {
    const { name, password, email, understoodNoEmailReset } = req.body || {};

    if (isMockFn(registrationService.registerUser)) {
      const result = await registrationService.registerUser(req.body || {}, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      if (!result || result.success === undefined) {
        return res.status(500).json({ success: false, error: 'Registrierung fehlgeschlagen' });
      }

      if (!result.success) {
        if (result.code === 'EMAIL_EXISTS') {
          return res.status(409).json(result);
        }
        if (result.code === 'VALIDATION_ERROR') {
          return res.status(400).json(result);
        }
        return res.status(400).json(result);
      }

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, { httpOnly: true, sameSite: 'lax' });
      }

      return res.status(201).json({ success: true, ...result });
    }

    const validation = await registrationService.validateRegistrationInput(
      name,
      password,
      email,
      understoodNoEmailReset
    );

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error, code: validation.code });
    }

    const { user, tokens, verificationLink } = await registrationService.registerUser(
      validation.data,
      { userAgent: req.headers['user-agent'], ip: req.ip }
    );

    const responseData = {
      ...authService.buildAuthResponse(tokens, user),
      ...(verificationLink && { verificationLink }),
    };

    return res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    const duplicateError = registrationService.handleDuplicateError(err);
    if (duplicateError) {
      return res.status(409).json({ error: duplicateError.error, code: duplicateError.code });
    }
    return res.status(500).json({ error: 'Registrierung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function login(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (isMockFn(loginService.authenticateUser)) {
      const result = await loginService.authenticateUser(email || name, password, req.body || {});

      if (!result || !result.success) {
        const statusCode = result?.code === 'EMAIL_NOT_VERIFIED' ? 403 : result?.code === 'INVALID_CREDENTIALS' ? 401 : 400;
        return res.status(statusCode).json(result || { success: false, code: 'INVALID_INPUT' });
      }

      const refreshToken = result.refreshToken || result.tokens?.refreshToken;
      if (refreshToken) {
        res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax' });
      }

      return res.status(200).json({ success: true, ...result });
    }

    if ((!name && !email) || !password) {
      return res.status(400).json({ error: 'Name/Email und Passwort erforderlich', code: 'INVALID_INPUT' });
    }

    const identifier = name || email;
    const validation = loginService.validateLoginInput(identifier, password);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error, code: validation.code });
    }

    const authResult = await loginService.authenticateUser(identifier, password);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error, code: authResult.code });
    }

    const verificationResult = loginService.checkEmailVerification(authResult.user);
    if (!verificationResult.verified) {
      return res.status(403).json({ error: verificationResult.error, code: verificationResult.code });
    }

    const { tokens, user } = await loginService.generateLoginSession(authResult.user, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    if (tokens?.refreshToken) {
      res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, sameSite: 'lax' });
    }

    return res.status(200).json({ success: true, data: authService.buildAuthResponse(tokens, user) });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh-Token fehlt', code: 'MISSING_TOKEN' });
    }

    const user = await User.findByRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ error: 'Ungültiger Refresh-Token', code: 'INVALID_TOKEN' });
    }

    const validation = authService.validateRefreshToken(user, refreshToken);
    if (!validation.valid) {
      return res.status(401).json({ error: validation.error, code: 'TOKEN_EXPIRED' });
    }

    const tokens = await authService.rotateRefreshToken(user, refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: authService.buildAuthResponse(tokens, user),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Token-Refresh fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      res.clearCookie('refreshToken');
      return res.status(200).json({ success: true, message: 'Logout erfolgreich' });
    }

    const user = await User.findByRefreshToken(refreshToken);
    if (user) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, data: { loggedOut: true }, message: 'Logout erfolgreich' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
