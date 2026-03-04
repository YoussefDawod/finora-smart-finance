const { verifyAccessToken } = require('../services/authService');
const User = require('../models/User');
const { sendError } = require('../utils/responseHelper');

async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token)
      return sendError(res, req, { error: 'Unauthorized', code: 'NO_TOKEN', status: 401 });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash -refreshTokens');
    if (!user)
      return sendError(res, req, { error: 'Unauthorized', code: 'INVALID_USER', status: 401 });

    // Prüfe ob der Account gesperrt ist
    if (user.isActive === false) {
      return sendError(res, req, {
        error: 'Dein Account wurde gesperrt. Kontaktiere den Support für weitere Informationen.',
        code: 'ACCOUNT_BANNED',
        status: 403,
      });
    }

    req.user = user;
    next();
  } catch {
    return sendError(res, req, { error: 'Unauthorized', code: 'INVALID_TOKEN', status: 401 });
  }
}

/**
 * Middleware: Prüft ob der eingeloggte User die Rolle 'admin' hat.
 * Muss NACH authMiddleware verwendet werden.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, req, {
      error: 'Zugriff verweigert: Admin-Rechte erforderlich',
      code: 'FORBIDDEN',
      status: 403,
    });
  }
  next();
}

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
