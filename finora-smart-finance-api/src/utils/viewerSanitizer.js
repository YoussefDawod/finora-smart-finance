/**
 * Viewer Sanitizer
 * Maskiert sensible Daten in API-Responses für Viewer-Rolle (Zuschauer).
 * Defense-in-Depth: Ergänzt Frontend-Blur auf Backend-Ebene.
 */

/**
 * Maskiert eine E-Mail-Adresse: john@example.com → j***@e***.com
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return email;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const domainParts = domain.split('.');
  const maskedLocal = local.charAt(0) + '***';
  const maskedDomain =
    domainParts[0].charAt(0) + '***.' + (domainParts.slice(1).join('.') || '***');
  return maskedLocal + '@' + maskedDomain;
}

/**
 * Maskiert einen Namen: John → J***
 */
function maskName(name) {
  if (!name || typeof name !== 'string') return name;
  const trimmed = name.trim();
  if (trimmed.length === 0) return name;
  return trimmed.charAt(0) + '***';
}

/**
 * Maskiert einen Betrag: 1234.56 → "***"
 */
function maskAmount(amount) {
  if (amount === null || amount === undefined) return amount;
  return '***';
}

/**
 * Maskiert eine Beschreibung: "Gehalt Dezember" → "***"
 */
function maskDescription(description) {
  if (!description || typeof description !== 'string') return description;
  return '***';
}

/**
 * Sanitize ein einzelnes User-Objekt für Viewer-Zugriff
 */
function sanitizeUserForViewer(user) {
  if (!user) return user;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  if (obj.name) obj.name = maskName(obj.name);
  if (obj.lastName) obj.lastName = maskName(obj.lastName);
  if (obj.email) obj.email = maskEmail(obj.email);
  if (obj.phone) obj.phone = '***';
  if (obj._id) obj._id = '***' + String(obj._id).slice(-4);

  return obj;
}

/**
 * Sanitize ein einzelnes Transaktions-Objekt für Viewer-Zugriff
 */
function sanitizeTransactionForViewer(tx) {
  if (!tx) return tx;
  const obj = typeof tx.toObject === 'function' ? tx.toObject() : { ...tx };

  if (obj.amount !== undefined) obj.amount = maskAmount(obj.amount);
  if (obj.description) obj.description = maskDescription(obj.description);
  if (obj.userName) obj.userName = maskName(obj.userName);
  if (obj.userId) obj.userId = '***' + String(obj.userId).slice(-4);

  return obj;
}

/**
 * Sanitize ein einzelnes Subscriber-Objekt für Viewer-Zugriff
 */
function sanitizeSubscriberForViewer(sub) {
  if (!sub) return sub;
  const obj = typeof sub.toObject === 'function' ? sub.toObject() : { ...sub };

  if (obj.email) obj.email = maskEmail(obj.email);

  return obj;
}

/**
 * Sanitize ein einzelnes AuditLog-Objekt für Viewer-Zugriff
 */
function sanitizeAuditLogForViewer(log) {
  if (!log) return log;
  const obj = typeof log.toObject === 'function' ? log.toObject() : { ...log };

  if (obj.adminName) obj.adminName = maskName(obj.adminName);
  if (obj.targetUserName) obj.targetUserName = maskName(obj.targetUserName);
  if (obj.adminId) obj.adminId = '***' + String(obj.adminId).slice(-4);
  if (obj.targetUserId) obj.targetUserId = '***' + String(obj.targetUserId).slice(-4);
  if (obj.ip) obj.ip = '***';
  if (obj.ipAddress) obj.ipAddress = '***';

  // Audit-Details enthalten manchmal Emails/Namen/IPs
  if (obj.details) {
    const d = { ...obj.details };
    if (d.email) d.email = maskEmail(d.email);
    if (d.name) d.name = maskName(d.name);
    if (d.newEmail) d.newEmail = maskEmail(d.newEmail);
    if (d.oldEmail) d.oldEmail = maskEmail(d.oldEmail);
    if (d.ip) d.ip = '***';
    if (d.ipAddress) d.ipAddress = '***';
    obj.details = d;
  }

  return obj;
}

/**
 * Sanitize user data for transaction-users endpoint
 */
function sanitizeTransactionUserForViewer(userWithStats) {
  if (!userWithStats) return userWithStats;
  const obj =
    typeof userWithStats.toObject === 'function' ? userWithStats.toObject() : { ...userWithStats };

  if (obj.name) obj.name = maskName(obj.name);
  if (obj.email) obj.email = maskEmail(obj.email);
  if (obj._id) obj._id = '***' + String(obj._id).slice(-4);

  return obj;
}

/**
 * Sanitize ein einzelnes Feedback-Objekt für Viewer-Zugriff
 */
function sanitizeFeedbackForViewer(fb) {
  if (!fb) return fb;
  const obj = typeof fb.toObject === 'function' ? fb.toObject() : { ...fb };

  if (obj.user) {
    if (typeof obj.user === 'object') {
      if (obj.user.name) obj.user.name = maskName(obj.user.name);
      if (obj.user.email) obj.user.email = maskEmail(obj.user.email);
    }
  }

  return obj;
}

module.exports = {
  maskEmail,
  maskName,
  maskAmount,
  maskDescription,
  sanitizeUserForViewer,
  sanitizeTransactionForViewer,
  sanitizeSubscriberForViewer,
  sanitizeAuditLogForViewer,
  sanitizeTransactionUserForViewer,
  sanitizeFeedbackForViewer,
};
