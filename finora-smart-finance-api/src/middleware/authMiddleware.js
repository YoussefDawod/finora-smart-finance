const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.sub).select('-passwordHash -refreshTokens');
    if (!user) return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_USER' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_TOKEN' });
  }
};
