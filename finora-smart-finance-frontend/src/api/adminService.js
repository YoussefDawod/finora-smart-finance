/**
 * @fileoverview Admin API Service
 * @description All admin-related API calls (Users, Transactions, Subscribers, Audit Log, Stats)
 *
 * @module api/adminService
 */

import client from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Admin Service – Full CRUD for admin panel
 */
export const adminService = {
  // ============================================
  // DASHBOARD / STATS
  // ============================================

  /**
   * Get admin dashboard stats (users, transactions overview)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getStats: ({ signal } = {}) => client.get(ENDPOINTS.admin.stats, { signal }),

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * List all users (paginated, filterable)
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: { users: object[], pagination: object } }>>}
   */
  getUsers: (params = {}, { signal } = {}) => client.get(ENDPOINTS.admin.users, { params, signal }),

  /**
   * Get single user by ID
   * @param {string} id - User ID
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: { user: object, stats: object } }>>}
   */
  getUser: (id, { signal } = {}) => client.get(ENDPOINTS.admin.user(id), { signal }),

  /**
   * Create new user
   * @param {Object} data - User data (name, email, password, role, isVerified)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  createUser: (data, { signal } = {}) => client.post(ENDPOINTS.admin.users, data, { signal }),

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} data - Fields to update
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updateUser: (id, data, { signal } = {}) =>
    client.patch(ENDPOINTS.admin.user(id), data, { signal }),

  /**
   * Delete user (and their transactions)
   * @param {string} id - User ID
   * @returns {Promise<AxiosResponse<{ data: { deletedUser: string, deletedTransactions: number } }>>}
   */
  deleteUser: id => client.delete(ENDPOINTS.admin.user(id)),

  /**
   * Delete all users and transactions
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  deleteAllUsers: () => client.delete(ENDPOINTS.admin.users),

  /**
   * Export all users as CSV
   * @returns {Promise<AxiosResponse<string>>} CSV string
   */
  exportUsersCSV: () => client.get(ENDPOINTS.admin.usersExport, { responseType: 'blob' }),

  /**
   * Ban user
   * @param {string} id - User ID
   * @param {string} [reason] - Ban reason
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  banUser: (id, reason = '') => client.patch(ENDPOINTS.admin.banUser(id), { reason }),

  /**
   * Unban user
   * @param {string} id - User ID
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  unbanUser: id => client.patch(ENDPOINTS.admin.unbanUser(id)),

  /**
   * Change user role
   * @param {string} id - User ID
   * @param {string} role - New role ('user' | 'admin')
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  changeUserRole: (id, role) => client.patch(ENDPOINTS.admin.userRole(id), { role }),

  /**
   * Reset user password
   * @param {string} id - User ID
   * @param {string} newPassword
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  resetPassword: (id, newPassword) =>
    client.post(ENDPOINTS.admin.resetPassword(id), { newPassword }),

  // ============================================
  // TRANSACTION MANAGEMENT
  // ============================================

  /**
   * List all transactions (paginated, filterable)
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: { transactions: object[], pagination: object } }>>}
   */
  getTransactions: (params = {}, { signal } = {}) =>
    client.get(ENDPOINTS.admin.transactions, { params, signal }),

  /**
   * Get transaction statistics
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getTransactionStats: ({ signal } = {}) =>
    client.get(ENDPOINTS.admin.transactionStats, { signal }),

  /**
   * Get users with transaction statistics (grouped view)
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: { users: object[], pagination: object } }>>}
   */
  getTransactionUsers: (params = {}, { signal } = {}) =>
    client.get(ENDPOINTS.admin.transactionUsers, { params, signal }),

  /**
   * Get single transaction by ID
   * @param {string} id - Transaction ID
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getTransaction: (id, { signal } = {}) => client.get(ENDPOINTS.admin.transaction(id), { signal }),

  /**
   * Delete transaction (admin)
   * @param {string} id - Transaction ID
   * @returns {Promise<AxiosResponse<{ data: object, message: string }>>}
   */
  deleteTransaction: id => client.delete(ENDPOINTS.admin.transaction(id)),

  /**
   * Export all transactions as CSV
   * @returns {Promise<AxiosResponse<string>>} CSV string
   */
  exportTransactionsCSV: () =>
    client.get(ENDPOINTS.admin.transactionsExport, { responseType: 'blob' }),

  // ============================================
  // SUBSCRIBER MANAGEMENT
  // ============================================

  /**
   * List all newsletter subscribers (paginated, filterable)
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: { subscribers: object[], pagination: object } }>>}
   */
  getSubscribers: (params = {}, { signal } = {}) =>
    client.get(ENDPOINTS.admin.subscribers, { params, signal }),

  /**
   * Get subscriber statistics
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getSubscriberStats: ({ signal } = {}) => client.get(ENDPOINTS.admin.subscriberStats, { signal }),

  /**
   * Get single subscriber by ID
   * @param {string} id - Subscriber ID
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getSubscriber: (id, { signal } = {}) => client.get(ENDPOINTS.admin.subscriber(id), { signal }),

  /**
   * Delete subscriber
   * @param {string} id - Subscriber ID
   * @returns {Promise<AxiosResponse<{ data: object, message: string }>>}
   */
  deleteSubscriber: id => client.delete(ENDPOINTS.admin.subscriber(id)),

  /**
   * Update subscriber (language, isConfirmed)
   * @param {string} id - Subscriber ID
   * @param {Object} data - Fields to update
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updateSubscriber: (id, data) => client.put(ENDPOINTS.admin.subscriber(id), data),

  /**
   * Resend confirmation email to subscriber
   * @param {string} id - Subscriber ID
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  resendConfirmation: id => client.post(ENDPOINTS.admin.subscriberResend(id)),

  /**
   * Export all subscribers as CSV
   * @returns {Promise<AxiosResponse<Blob>>} CSV blob
   */
  exportSubscribersCSV: () =>
    client.get(ENDPOINTS.admin.subscribersExport, { responseType: 'blob' }),

  // ============================================
  // CAMPAIGN MANAGEMENT
  // ============================================

  /**
   * List all campaigns (paginated, filterable)
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Axios request options
   * @returns {Promise<AxiosResponse<{ data: { campaigns: object[], pagination: object } }>>}
   */
  getCampaigns: (params = {}, { signal } = {}) =>
    client.get(ENDPOINTS.admin.campaigns, { params, signal }),

  /**
   * Get campaign statistics
   * @param {Object} [options] - Axios request options
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getCampaignStats: ({ signal } = {}) => client.get(ENDPOINTS.admin.campaignStats, { signal }),

  /**
   * Get single campaign by ID
   * @param {string} id - Campaign ID
   * @param {Object} [options] - Axios request options
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getCampaign: (id, { signal } = {}) => client.get(ENDPOINTS.admin.campaign(id), { signal }),

  /**
   * Create new campaign
   * @param {Object} data - { subject, content, language, recipientFilter }
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  createCampaign: data => client.post(ENDPOINTS.admin.campaigns, data),

  /**
   * Update campaign (only draft)
   * @param {string} id - Campaign ID
   * @param {Object} data - Fields to update
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updateCampaign: (id, data) => client.put(ENDPOINTS.admin.campaign(id), data),

  /**
   * Delete campaign
   * @param {string} id - Campaign ID
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  deleteCampaign: id => client.delete(ENDPOINTS.admin.campaign(id)),

  /**
   * Delete all campaigns (admin reset)
   * @returns {Promise<AxiosResponse<{ data: { deletedCount: number } }>>}
   */
  deleteAllCampaigns: () => client.delete(ENDPOINTS.admin.campaignsReset),

  /**
   * Send campaign
   * @param {string} id - Campaign ID
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  sendCampaign: id => client.post(ENDPOINTS.admin.campaignSend(id)),

  /**
   * Preview campaign email HTML
   * @param {Object} data - { subject, content, language }
   * @returns {Promise<AxiosResponse<{ data: { html: string } }>>}
   */
  previewCampaign: data => client.post(ENDPOINTS.admin.campaignPreview, data),

  // ============================================
  // AUDIT LOG
  // ============================================

  /**
   * Get audit log entries (paginated, filterable)
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: { logs: object[], pagination: object } }>>}
   */
  getAuditLogs: (params = {}, { signal } = {}) =>
    client.get(ENDPOINTS.admin.auditLog, { params, signal }),

  /**
   * Get audit log statistics
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getAuditLogStats: ({ signal } = {}) => client.get(ENDPOINTS.admin.auditLogStats, { signal }),

  /**
   * Delete all audit log entries
   * @returns {Promise<AxiosResponse<{ data: { deletedCount: number } }>>}
   */
  deleteAllAuditLogs: () => client.delete(ENDPOINTS.admin.auditLog),

  /**
   * Delete specified audit log entries (bulk)
   * @param {string[]} ids - Array of audit log IDs to delete (max 200)
   * @returns {Promise<AxiosResponse<{ data: { deletedCount: number } }>>}
   */
  deleteAuditLogsBulk: ids => client.delete(ENDPOINTS.admin.auditLogBulk, { data: { ids } }),

  // ── Lifecycle ─────────────────────────────────────────────

  /**
   * Get lifecycle statistics (retention phases, old transactions)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getLifecycleStats: ({ signal } = {}) => client.get(ENDPOINTS.admin.lifecycleStats, { signal }),

  /**
   * Get detailed lifecycle info for a specific user
   * @param {string} userId
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getUserLifecycleDetail: (userId, { signal } = {}) =>
    client.get(ENDPOINTS.admin.lifecycleUserDetail(userId), { signal }),

  /**
   * Reset retention status for a specific user
   * @param {string} userId
   * @returns {Promise<AxiosResponse<{ success: boolean }>>}
   */
  resetUserRetention: userId => client.post(ENDPOINTS.admin.lifecycleUserReset(userId)),

  /**
   * Manually trigger retention processing
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  triggerRetentionProcessing: () => client.post(ENDPOINTS.admin.lifecycleTrigger),
};

export default adminService;
