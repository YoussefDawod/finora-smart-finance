/**
 * AuditLog Service
 * Business-Logik für Audit-Logging und -Abfragen
 *
 * Stellt zwei Haupt-Funktionen bereit:
 * 1. log() — Schreibt einen AuditLog-Eintrag (fire-and-forget, blockiert nicht)
 * 2. getLogs() — Liest AuditLog-Einträge (paginiert, filterbar)
 */

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const escapeRegex = require('../utils/escapeRegex');
const geoip = require('geoip-lite');

/**
 * AuditLog-Eintrag erstellen (fire-and-forget)
 *
 * Diese Funktion blockiert NICHT den Request — Fehler beim Logging
 * werden geloggt aber nicht an den Aufrufer weitergegeben.
 *
 * @param {Object} params
 * @param {string} params.action        - Aktion (z.B. 'USER_BANNED')
 * @param {string} [params.adminId]     - ID des ausführenden Admins
 * @param {string} [params.adminName]   - Name des Admins
 * @param {string} [params.targetUserId]   - ID des betroffenen Users
 * @param {string} [params.targetUserName] - Name des betroffenen Users
 * @param {Object} [params.details]     - Zusätzliche Details (vorher/nachher, Grund, etc.)
 * @param {Object} [params.req]         - Express Request (für IP + UserAgent)
 */
async function log({
  action,
  adminId = null,
  adminName = 'System/API-Key',
  targetUserId = null,
  targetUserName = null,
  details = {},
  req = null,
  ip: explicitIp = null,
  userAgent: explicitUserAgent = null,
}) {
  try {
    const ip = req ? req.clientIp || req.ip || req.connection?.remoteAddress || null : explicitIp;
    const userAgent = req ? req.headers?.['user-agent'] || null : explicitUserAgent;

    // Geolocation aus IP ableiten (nur öffentliche IPs, nur Land-Ebene)
    let country = null;
    if (ip) {
      const cleanIp = ip.replace(/^::ffff:/, '');
      const geo = geoip.lookup(cleanIp);
      if (geo) {
        country = geo.country || null;
      }
    }

    const entry = new AuditLog({
      action,
      adminId: adminId || null,
      adminName: adminName || 'System/API-Key',
      targetUserId: targetUserId || null,
      targetUserName: targetUserName || null,
      details,
      requestId: req?.requestId || null,
      ipAddress: ip,
      userAgent: userAgent || null,
      country,
    });

    await entry.save();
    return entry;
  } catch (error) {
    // Audit-Logging darf die eigentliche Aktion NIEMALS blockieren
    logger.error('AuditLog write failed:', error);
    return null;
  }
}

/**
 * AuditLog-Einträge abrufen (paginiert, filterbar)
 *
 * @param {Object} options
 * @param {number} [options.page=1]       - Seitennummer
 * @param {number} [options.limit=50]     - Einträge pro Seite
 * @param {string} [options.action]       - Filter nach Aktion
 * @param {string} [options.adminId]      - Filter nach Admin
 * @param {string} [options.targetUserId] - Filter nach betroffenem User
 * @param {string} [options.startDate]    - Startdatum (ISO)
 * @param {string} [options.endDate]      - Enddatum (ISO)
 * @param {string} [options.search]       - Freitext-Suche (adminName, targetUserName, details)
 * @param {string} [options.sort='-createdAt'] - Sortierung
 * @returns {{ logs, pagination }}
 */
async function getLogs({
  page = 1,
  limit = 50,
  action,
  adminId,
  targetUserId,
  country,
  startDate,
  endDate,
  search,
  sort = '-createdAt',
} = {}) {
  // Whitelist erlaubter Sort-Felder — verhindert Sort-Injection
  const ALLOWED_SORT_FIELDS = new Set([
    'createdAt',
    'action',
    'adminName',
    'targetUserName',
    'country',
  ]);
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const safeSort = ALLOWED_SORT_FIELDS.has(sortField) ? sort : '-createdAt';

  const query = {};

  if (action) {
    query.action = action;
  }

  if (adminId) {
    query.adminId = adminId;
  }

  if (targetUserId) {
    query.targetUserId = targetUserId;
  }

  if (country) {
    query.country = country;
  }

  // Datumsfilter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Freitext-Suche (adminName, targetUserName, Details als JSON-String)
  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    const regex = { $regex: escaped, $options: 'i' };
    query.$or = [
      { adminName: regex },
      { targetUserName: regex },
      { details: { $regex: escaped, $options: 'i' } },
    ];
  }

  // Paginierung berechnen
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort(safeSort).skip(skip).limit(safeLimit),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      limit: safeLimit,
    },
  };
}

/**
 * AuditLog-Statistiken abrufen
 * Gruppiert nach Action für die letzten 30 Tage
 *
 * @returns {{ totalEntries, mostCommonAction, activeAdmins, actionBreakdown }}
 */
async function getStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateFilter = { createdAt: { $gte: thirtyDaysAgo } };

  const [actionBreakdown, total, activeAdminIds] = await Promise.all([
    AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.countDocuments(dateFilter),
    AuditLog.distinct('adminId', { ...dateFilter, adminId: { $ne: null } }),
  ]);

  return {
    totalEntries: total,
    mostCommonAction: actionBreakdown[0]?._id || null,
    activeAdmins: activeAdminIds.length,
    actionBreakdown,
  };
}

/**
 * AuditLog-Einträge eines Users löschen (DSGVO: Recht auf Löschung)
 *
 * Löscht alle Einträge, bei denen der User als targetUserId referenziert ist.
 * Wird bei Account-Löschung aufgerufen.
 *
 * @param {string|ObjectId} userId - Die User-ID
 * @returns {Promise<number>} Anzahl gelöschter Einträge
 */
async function deleteByUserId(userId) {
  try {
    const result = await AuditLog.deleteMany({ targetUserId: userId });
    if (result.deletedCount > 0) {
      logger.info(`AuditLog: ${result.deletedCount} Einträge für User ${userId} gelöscht (DSGVO)`);
    }
    return result.deletedCount;
  } catch (error) {
    logger.error(`AuditLog deleteByUserId failed for ${userId}: ${error.message}`);
    return 0;
  }
}

/**
 * Alle AuditLog-Einträge löschen (Admin-Aktion)
 * @returns {Promise<number>} Anzahl gelöschter Einträge
 */
async function deleteAll() {
  const result = await AuditLog.deleteMany({});
  logger.info(`AuditLog: Alle ${result.deletedCount} Einträge gelöscht`);
  return result.deletedCount;
}

/**
 * Bulk-Löschung bestimmter AuditLog-Einträge
 * @param {string[]} ids - Array von AuditLog-IDs (max 200)
 * @returns {Promise<number>} Anzahl gelöschter Einträge
 */
async function deleteBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return 0;
  }
  if (ids.length > 200) {
    throw new Error('Maximal 200 Einträge pro Bulk-Löschung erlaubt');
  }
  const result = await AuditLog.deleteMany({ _id: { $in: ids } });
  logger.info(`AuditLog: ${result.deletedCount} von ${ids.length} Einträgen gelöscht (Bulk)`);
  return result.deletedCount;
}

module.exports = {
  log,
  getLogs,
  getStats,
  deleteByUserId,
  deleteAll,
  deleteBulk,
};
