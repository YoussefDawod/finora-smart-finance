function toPlain(user) {
  if (!user) return null;
  if (typeof user.toObject === 'function') return user.toObject();
  if (typeof user.toJSON === 'function') return user.toJSON();
  return { ...user };
}

function sanitizeUser(user, options = {}) {
  const { includeSensitive = false } = options;
  const obj = toPlain(user);

  if (!obj) return null;

  if (!includeSensitive) {
    delete obj.passwordHash;
    delete obj.twoFactorSecret;
    delete obj.verificationToken;
    delete obj.verificationExpires;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    delete obj.emailChangeToken;
    delete obj.emailChangeNewEmail;
    delete obj.emailChangeExpires;
    delete obj.newEmailPending;
    delete obj.refreshTokens;
  }

  delete obj.__v;
  return obj;
}

function sanitizeUsers(users = [], options = {}) {
  return users
    .filter(Boolean)
    .map((user) => sanitizeUser(user, options))
    .filter(Boolean);
}

module.exports = {
  sanitizeUser,
  sanitizeUsers,
};
