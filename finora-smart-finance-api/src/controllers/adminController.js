/**
 * Admin Controller
 * Request/Response-Handling für Admin-Endpoints
 */

const adminService = require('../services/adminService');
const campaignService = require('../services/campaignService');
const auditLog = require('../services/auditLogService');
const { sendError, handleServerError } = require('../utils/responseHelper');
const {
  validateUserQuery,
  validateCreateUser,
  validateUpdateUser,
} = require('../validators/adminValidation');
const { validatePassword } = require('../validators/authValidation');

/**
 * Extrahiert Admin-Infos aus dem Request (JWT-User oder API-Key-Fallback)
 */
function getAdminInfo(req) {
  if (req.user) {
    return { adminId: req.user._id, adminName: req.user.name };
  }
  return { adminId: null, adminName: 'System/API-Key' };
}

// GET /api/admin/users
async function listUsers(req, res) {
  try {
    const { errors, query, pagination, sort, showSensitive } = validateUserQuery(req.query || {});

    if (errors.length > 0) {
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: errors,
      });
    }

    const data = await adminService.listUsers(query, pagination, sort, showSensitive);
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get users', error);
  }
}

// GET /api/admin/users/:id
async function getUser(req, res) {
  try {
    const data = await adminService.getUserById(req.params.id);
    if (!data) {
      return sendError(res, req, {
        error: 'User nicht gefunden',
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get user', error);
  }
}

// GET /api/admin/stats
async function getStats(req, res) {
  try {
    const data = await adminService.getStats();
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get stats', error);
  }
}

// POST /api/admin/users
async function createUser(req, res) {
  try {
    const { errors, data } = validateCreateUser(req.body || {});

    if (errors.length > 0) {
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: errors,
      });
    }

    const result = await adminService.createUser(data);
    if (result.error) {
      const status = result.code === 'NAME_TAKEN' || result.code === 'EMAIL_TAKEN' ? 409 : 400;
      return sendError(res, req, { error: result.error, code: result.code, status });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'USER_CREATED',
      adminId,
      adminName,
      targetUserId: result.user._id,
      targetUserName: result.user.name,
      details: { email: result.user.email || null, role: result.user.role || 'user' },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'User erfolgreich erstellt',
      data: result.user,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Create user', error);
  }
}

// PATCH /api/admin/users/:id
async function updateUser(req, res) {
  try {
    const { errors, updates } = validateUpdateUser(req.body || {});

    if (errors.length > 0) {
      return sendError(res, req, {
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: errors,
      });
    }

    const result = await adminService.updateUser(req.params.id, updates);
    if (result.error) {
      const status = result.code === 'USER_NOT_FOUND' ? 404 : 409;
      return sendError(res, req, { error: result.error, code: result.code, status });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'USER_UPDATED',
      adminId,
      adminName,
      targetUserId: req.params.id,
      targetUserName: result.user.name,
      details: { updatedFields: Object.keys(updates) },
      req,
    });

    res.json({
      success: true,
      message: 'User erfolgreich aktualisiert',
      data: result.user,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Update user', error);
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
  try {
    const result = await adminService.deleteUser(req.params.id);
    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 404 });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'USER_DELETED',
      adminId,
      adminName,
      targetUserId: req.params.id,
      targetUserName: result.deletedUser,
      details: { deletedTransactions: result.deletedTransactions },
      req,
    });

    res.json({
      success: true,
      message: 'User und alle Transaktionen erfolgreich gelöscht',
      data: result,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Delete user', error);
  }
}

// POST /api/admin/users/:id/reset-password
async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return sendError(res, req, {
        error: passwordCheck.error,
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const result = await adminService.resetUserPassword(req.params.id, newPassword);
    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 404 });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'USER_PASSWORD_RESET',
      adminId,
      adminName,
      targetUserId: req.params.id,
      details: {},
      req,
    });

    res.json({ success: true, message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    handleServerError(res, req, 'Admin: Reset password', error);
  }
}

// DELETE /api/admin/users
async function deleteAllUsers(req, res) {
  try {
    const { confirm, reason } = req.body;

    if (confirm !== 'DELETE_ALL_USERS') {
      return sendError(res, req, {
        error: 'Bitte bestätige mit confirm: "DELETE_ALL_USERS"',
        code: 'CONFIRMATION_REQUIRED',
        status: 400,
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return sendError(res, req, {
        error: 'Ein Grund (reason) mit mindestens 5 Zeichen ist erforderlich',
        code: 'REASON_REQUIRED',
        status: 400,
      });
    }

    const data = await adminService.deleteAllUsers();

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'ALL_USERS_DELETED',
      adminId,
      adminName,
      details: {
        reason: reason.trim(),
        deletedUsers: data.deletedUsers,
        deletedTransactions: data.deletedTransactions,
      },
      req,
    });

    res.json({
      success: true,
      message: 'Alle Users und Transaktionen wurden gelöscht',
      data,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Delete all users', error);
  }
}

// PATCH /api/admin/users/:id/ban
async function banUser(req, res) {
  try {
    const { reason } = req.body || {};

    if (reason !== undefined && typeof reason !== 'string') {
      return sendError(res, req, {
        error: 'reason muss ein String sein',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const result = await adminService.banUser(req.params.id, reason || '');
    if (result.error) {
      const statusMap = { USER_NOT_FOUND: 404, CANNOT_BAN_ADMIN: 403, ALREADY_BANNED: 409 };
      return sendError(res, req, {
        error: result.error,
        code: result.code,
        status: statusMap[result.code] || 400,
      });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'USER_BANNED',
      adminId,
      adminName,
      targetUserId: req.params.id,
      targetUserName: result.user.name,
      details: { reason: reason || '' },
      req,
    });

    res.json({
      success: true,
      message: 'User wurde gesperrt',
      data: result.user,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Ban user', error);
  }
}

// PATCH /api/admin/users/:id/unban
async function unbanUser(req, res) {
  try {
    const result = await adminService.unbanUser(req.params.id);
    if (result.error) {
      const statusMap = { USER_NOT_FOUND: 404, NOT_BANNED: 409 };
      return sendError(res, req, {
        error: result.error,
        code: result.code,
        status: statusMap[result.code] || 400,
      });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'USER_UNBANNED',
      adminId,
      adminName,
      targetUserId: req.params.id,
      targetUserName: result.user.name,
      details: {},
      req,
    });

    res.json({
      success: true,
      message: 'User-Sperre wurde aufgehoben',
      data: result.user,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Unban user', error);
  }
}

// PATCH /api/admin/users/:id/role
async function changeUserRole(req, res) {
  try {
    const { role } = req.body || {};

    if (!role || !['user', 'admin'].includes(role)) {
      return sendError(res, req, {
        error: 'role muss "user" oder "admin" sein',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // req.user ist der eingeloggte Admin (via JWT) oder null (via API-Key)
    const adminId = req.user ? req.user._id.toString() : null;
    const result = await adminService.changeUserRole(req.params.id, role, adminId);

    if (result.error) {
      const statusMap = {
        USER_NOT_FOUND: 404,
        INVALID_ROLE: 400,
        SELF_ROLE_CHANGE: 403,
        LAST_ADMIN: 403,
      };
      return sendError(res, req, {
        error: result.error,
        code: result.code,
        status: statusMap[result.code] || 400,
      });
    }

    const { adminId: auditAdminId, adminName: auditAdminName } = getAdminInfo(req);
    auditLog.log({
      action: 'USER_ROLE_CHANGED',
      adminId: auditAdminId,
      adminName: auditAdminName,
      targetUserId: req.params.id,
      targetUserName: result.user.name,
      details: { newRole: role },
      req,
    });

    res.json({
      success: true,
      message: `Rolle erfolgreich auf "${role}" geändert`,
      data: result.user,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Change user role', error);
  }
}

// GET /api/admin/audit-log
async function getAuditLogs(req, res) {
  try {
    const { page, limit, action, adminId, targetUserId, startDate, endDate, search, sort } =
      req.query || {};

    const data = await auditLog.getLogs({
      page,
      limit,
      action,
      adminId,
      targetUserId,
      startDate,
      endDate,
      search,
      sort,
    });

    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get audit logs', error);
  }
}

// GET /api/admin/audit-log/stats
async function getAuditLogStats(req, res) {
  try {
    const data = await auditLog.getStats();
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get audit log stats', error);
  }
}

// ============================================
// TRANSACTIONS
// ============================================

// GET /api/admin/transactions/users
async function getTransactionUsers(req, res) {
  try {
    const { page, limit, search, sort } = req.query || {};
    const data = await adminService.getUsersWithTransactionStats({ page, limit, search, sort });
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Transaction users', error);
  }
}

// ============================================
// CSV EXPORTS
// ============================================

// GET /api/admin/users/export
async function exportUsers(req, res) {
  try {
    const csv = await adminService.exportUsersCSV();

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'DATA_EXPORT',
      adminId,
      adminName,
      details: { type: 'users', format: 'csv' },
      req,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    res.send(csv);
  } catch (error) {
    handleServerError(res, req, 'Admin: Export users CSV', error);
  }
}

// GET /api/admin/transactions/export
async function exportTransactions(req, res) {
  try {
    const csv = await adminService.exportTransactionsCSV();

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'DATA_EXPORT',
      adminId,
      adminName,
      details: { type: 'transactions', format: 'csv' },
      req,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions-export.csv"');
    res.send(csv);
  } catch (error) {
    handleServerError(res, req, 'Admin: Export transactions CSV', error);
  }
}

// GET /api/admin/transactions
async function listTransactions(req, res) {
  try {
    const { page, limit, userId, type, category, startDate, endDate, search, sort } =
      req.query || {};

    const data = await adminService.listTransactions({
      page,
      limit,
      userId,
      type,
      category,
      startDate,
      endDate,
      search,
      sort,
    });

    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: List transactions', error);
  }
}

// GET /api/admin/transactions/stats
async function getTransactionStats(req, res) {
  try {
    const data = await adminService.getTransactionStats();
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Transaction stats', error);
  }
}

// GET /api/admin/transactions/:id
async function getTransaction(req, res) {
  try {
    const data = await adminService.getTransactionById(req.params.id);
    if (!data) {
      return sendError(res, req, {
        error: 'Transaktion nicht gefunden',
        code: 'TRANSACTION_NOT_FOUND',
        status: 404,
      });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get transaction', error);
  }
}

// DELETE /api/admin/transactions/:id
async function deleteTransactionAdmin(req, res) {
  try {
    const result = await adminService.deleteTransaction(req.params.id);
    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 404 });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'TRANSACTION_DELETED',
      adminId,
      adminName,
      targetUserId: result.deleted.userId,
      details: {
        transactionId: result.deleted.id,
        amount: result.deleted.amount,
        category: result.deleted.category,
        transactionType: result.deleted.type,
      },
      req,
    });

    res.json({
      success: true,
      message: 'Transaktion erfolgreich gelöscht',
      data: result.deleted,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Delete transaction', error);
  }
}

// ============================================
// SUBSCRIBERS
// ============================================

// ============================================
// SUBSCRIBERS
// ============================================

// GET /api/admin/subscribers
async function listSubscribers(req, res) {
  try {
    const { page, limit, isConfirmed, search, language, sort } = req.query || {};

    const data = await adminService.listSubscribers({
      page,
      limit,
      isConfirmed,
      search,
      language,
      sort,
    });

    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: List subscribers', error);
  }
}

// GET /api/admin/subscribers/stats
async function getSubscriberStats(req, res) {
  try {
    const data = await adminService.getSubscriberStats();
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Subscriber stats', error);
  }
}

// GET /api/admin/subscribers/:id
async function getSubscriber(req, res) {
  try {
    const data = await adminService.getSubscriberById(req.params.id);
    if (!data) {
      return sendError(res, req, {
        error: 'Subscriber nicht gefunden',
        code: 'SUBSCRIBER_NOT_FOUND',
        status: 404,
      });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get subscriber', error);
  }
}

// DELETE /api/admin/subscribers/:id
async function deleteSubscriberAdmin(req, res) {
  try {
    const result = await adminService.deleteSubscriber(req.params.id);
    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 404 });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'SUBSCRIBER_DELETED',
      adminId,
      adminName,
      details: {
        subscriberId: req.params.id,
        email: result.deleted.email,
        status: result.deleted.isConfirmed ? 'confirmed' : 'unconfirmed',
      },
      req,
    });

    res.json({
      success: true,
      message: 'Subscriber erfolgreich gelöscht',
      data: result.deleted,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Delete subscriber', error);
  }
}

// PUT /api/admin/subscribers/:id
async function updateSubscriber(req, res) {
  try {
    const { language, isConfirmed } = req.body || {};
    const result = await adminService.updateSubscriber(req.params.id, { language, isConfirmed });
    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 404 });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'SUBSCRIBER_UPDATED',
      adminId,
      adminName,
      details: { subscriberId: req.params.id, language, isConfirmed },
      req,
    });

    res.json({ success: true, message: 'Subscriber aktualisiert', data: result.updated });
  } catch (error) {
    handleServerError(res, req, 'Admin: Update subscriber', error);
  }
}

// POST /api/admin/subscribers/:id/resend
async function resendConfirmation(req, res) {
  try {
    const result = await adminService.resendConfirmation(req.params.id);
    if (result.error) {
      const status = result.code === 'SUBSCRIBER_NOT_FOUND' ? 404 : 400;
      return sendError(res, req, { error: result.error, code: result.code, status });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'CONFIRMATION_RESENT',
      adminId,
      adminName,
      details: { subscriberId: req.params.id, email: result.email },
      req,
    });

    res.json({ success: true, message: `Bestätigungsmail erneut gesendet an ${result.email}` });
  } catch (error) {
    handleServerError(res, req, 'Admin: Resend confirmation', error);
  }
}

// GET /api/admin/subscribers/export
async function exportSubscribersCSV(req, res) {
  try {
    const csv = await adminService.exportSubscribersCSV();
    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'SUBSCRIBERS_EXPORTED',
      adminId,
      adminName,
      details: { format: 'CSV' },
      req,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=subscribers_${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csv);
  } catch (error) {
    handleServerError(res, req, 'Admin: Export subscribers CSV', error);
  }
}

// ============================================
// CAMPAIGNS (Newsletter-Versand)
// ============================================

// GET /api/admin/campaigns
async function listCampaigns(req, res) {
  try {
    const { page, limit, status, language, search, sort } = req.query || {};
    const data = await campaignService.listCampaigns({
      page,
      limit,
      status,
      language,
      search,
      sort,
    });
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: List campaigns', error);
  }
}

// GET /api/admin/campaigns/stats
async function getCampaignStats(req, res) {
  try {
    const data = await campaignService.getCampaignStats();
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Campaign stats', error);
  }
}

// GET /api/admin/campaigns/:id
async function getCampaign(req, res) {
  try {
    const data = await campaignService.getCampaign(req.params.id);
    if (!data) {
      return sendError(res, req, {
        error: 'Campaign nicht gefunden',
        code: 'CAMPAIGN_NOT_FOUND',
        status: 404,
      });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Get campaign', error);
  }
}

// POST /api/admin/campaigns
async function createCampaign(req, res) {
  try {
    const { subject, content, language, recipientFilter } = req.body || {};

    // Validierung
    const errors = [];
    if (!subject || !subject.trim()) errors.push('Betreff ist erforderlich');
    else if (subject.length > 200) errors.push('Betreff darf maximal 200 Zeichen lang sein');
    if (!content || !content.trim()) errors.push('Inhalt ist erforderlich');
    else if (content.length > 50000) errors.push('Inhalt darf maximal 50.000 Zeichen lang sein');
    if (!language || !['de', 'en', 'ar', 'ka'].includes(language))
      errors.push('Gültige Sprache erforderlich (de, en, ar, ka)');
    if (recipientFilter?.language && !['de', 'en', 'ar', 'ka'].includes(recipientFilter.language)) {
      errors.push('Ungültiger Sprachfilter');
    }
    if (errors.length > 0) {
      return sendError(res, req, {
        error: errors.join('; '),
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const { adminId, adminName } = getAdminInfo(req);
    const result = await campaignService.createCampaign(
      { subject, content, language, recipientFilter },
      adminId || req.body.sentBy
    );

    auditLog.log({
      action: 'CAMPAIGN_CREATED',
      adminId,
      adminName,
      details: { campaignId: result.campaign._id, subject, language },
      req,
    });

    res.status(201).json({ success: true, message: 'Campaign erstellt', data: result.campaign });
  } catch (error) {
    handleServerError(res, req, 'Admin: Create campaign', error);
  }
}

// PUT /api/admin/campaigns/:id
async function updateCampaign(req, res) {
  try {
    const { subject, content, language, recipientFilter } = req.body || {};

    // Validierung
    const errors = [];
    if (subject !== undefined) {
      if (!subject.trim()) errors.push('Betreff darf nicht leer sein');
      else if (subject.length > 200) errors.push('Betreff darf maximal 200 Zeichen lang sein');
    }
    if (content !== undefined) {
      if (!content.trim()) errors.push('Inhalt darf nicht leer sein');
      else if (content.length > 50000) errors.push('Inhalt darf maximal 50.000 Zeichen lang sein');
    }
    if (language !== undefined && !['de', 'en', 'ar', 'ka'].includes(language)) {
      errors.push('Ungültige Sprache');
    }
    if (recipientFilter?.language && !['de', 'en', 'ar', 'ka'].includes(recipientFilter.language)) {
      errors.push('Ungültiger Sprachfilter');
    }
    if (errors.length > 0) {
      return sendError(res, req, {
        error: errors.join('; '),
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const result = await campaignService.updateCampaign(req.params.id, {
      subject,
      content,
      language,
      recipientFilter,
    });
    if (result.error) {
      const status = result.code === 'CAMPAIGN_NOT_FOUND' ? 404 : 400;
      return sendError(res, req, { error: result.error, code: result.code, status });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'CAMPAIGN_UPDATED',
      adminId,
      adminName,
      details: { campaignId: req.params.id },
      req,
    });

    res.json({ success: true, message: 'Campaign aktualisiert', data: result.campaign });
  } catch (error) {
    handleServerError(res, req, 'Admin: Update campaign', error);
  }
}

// DELETE /api/admin/campaigns/:id
async function deleteCampaign(req, res) {
  try {
    const result = await campaignService.deleteCampaign(req.params.id);
    if (result.error) {
      const status = result.code === 'CAMPAIGN_NOT_FOUND' ? 404 : 400;
      return sendError(res, req, { error: result.error, code: result.code, status });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'CAMPAIGN_DELETED',
      adminId,
      adminName,
      details: { campaignId: req.params.id, subject: result.deleted.subject },
      req,
    });

    res.json({ success: true, message: 'Campaign gelöscht', data: result.deleted });
  } catch (error) {
    handleServerError(res, req, 'Admin: Delete campaign', error);
  }
}

// DELETE /api/admin/campaigns
async function deleteAllCampaigns(req, res) {
  try {
    const result = await campaignService.deleteAllCampaigns();
    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 400 });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'CAMPAIGNS_RESET',
      adminId,
      adminName,
      details: { deletedCount: result.deletedCount },
      req,
    });

    res.json({ success: true, message: `${result.deletedCount} Kampagnen gelöscht`, data: result });
  } catch (error) {
    handleServerError(res, req, 'Admin: Delete all campaigns', error);
  }
}

// POST /api/admin/campaigns/:id/send
async function sendCampaign(req, res) {
  try {
    const result = await campaignService.sendCampaign(req.params.id);
    if (result.error) {
      const status = result.code === 'CAMPAIGN_NOT_FOUND' ? 404 : 400;
      return sendError(res, req, { error: result.error, code: result.code, status });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'CAMPAIGN_SENT',
      adminId,
      adminName,
      details: {
        campaignId: req.params.id,
        recipientCount: result.recipientCount,
        successCount: result.successCount,
        failCount: result.failCount,
      },
      req,
    });

    res.json({
      success: true,
      message: `Newsletter an ${result.successCount}/${result.recipientCount} Empfänger gesendet`,
      data: result,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Send campaign', error);
  }
}

// POST /api/admin/campaigns/preview
async function previewCampaign(req, res) {
  try {
    const { subject, content, language } = req.body || {};

    if (!content || !language) {
      return sendError(res, req, {
        error: 'Inhalt und Sprache erforderlich',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const templates = require('../utils/emailTemplates');
    const html = templates.campaignTemplate(
      subject || 'Vorschau',
      content,
      '#unsubscribe-preview',
      language
    );

    res.json({ success: true, data: { html } });
  } catch (error) {
    handleServerError(res, req, 'Admin: Preview campaign', error);
  }
}

// ============================================
// LIFECYCLE
// ============================================

// GET /api/admin/lifecycle/stats
async function getLifecycleStats(req, res) {
  try {
    const data = await adminService.getLifecycleStats();
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: Lifecycle stats', error);
  }
}

// GET /api/admin/lifecycle/users/:id
async function getUserLifecycleDetail(req, res) {
  try {
    const data = await adminService.getUserLifecycleDetail(req.params.id);
    if (!data) {
      return sendError(res, req, {
        error: 'User nicht gefunden',
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleServerError(res, req, 'Admin: User lifecycle detail', error);
  }
}

// POST /api/admin/lifecycle/users/:id/reset
async function resetUserRetention(req, res) {
  try {
    const result = await adminService.resetUserRetention(req.params.id);
    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 404 });
    }

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'RETENTION_RESET_BY_ADMIN',
      adminId,
      adminName,
      targetUserId: req.params.id,
      details: { reason: 'Manual admin reset' },
      req,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Reset user retention', error);
  }
}

// POST /api/admin/lifecycle/trigger
async function triggerRetentionProcessing(req, res) {
  try {
    const stats = await adminService.triggerRetentionProcessing();

    const { adminId, adminName } = getAdminInfo(req);
    auditLog.log({
      action: 'RETENTION_MANUAL_TRIGGER',
      adminId,
      adminName,
      details: { stats },
      req,
    });

    res.json({
      success: true,
      message: 'Retention-Verarbeitung abgeschlossen',
      data: stats,
    });
  } catch (error) {
    handleServerError(res, req, 'Admin: Trigger retention', error);
  }
}

module.exports = {
  listUsers,
  getUser,
  getStats,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  deleteAllUsers,
  banUser,
  unbanUser,
  changeUserRole,
  getAuditLogs,
  getAuditLogStats,
  // CSV Exports
  exportUsers,
  exportTransactions,
  // Transactions
  getTransactionUsers,
  listTransactions,
  getTransactionStats,
  getTransaction,
  deleteTransactionAdmin,
  // Subscribers
  listSubscribers,
  getSubscriberStats,
  getSubscriber,
  deleteSubscriberAdmin,
  updateSubscriber,
  resendConfirmation,
  exportSubscribersCSV,
  // Campaigns
  listCampaigns,
  getCampaignStats,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  deleteAllCampaigns,
  sendCampaign,
  previewCampaign,
  // Lifecycle
  getLifecycleStats,
  getUserLifecycleDetail,
  resetUserRetention,
  triggerRetentionProcessing,
};
