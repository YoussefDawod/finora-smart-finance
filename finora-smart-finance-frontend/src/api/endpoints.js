/**
 * @fileoverview Endpoints Constants
 * @description All API endpoint paths (with /api/v1 prefix for Vite proxy)
 * 
 * @module api/endpoints
 */

export const API_VERSION = 'v1';
const P = `/api/${API_VERSION}`;

export const ENDPOINTS = {
  auth: {
    register: `${P}/auth/register`,
    login: `${P}/auth/login`,
    logout: `${P}/auth/logout`,
    verify: `${P}/auth/verify-email`,
    forgotPassword: `${P}/auth/forgot-password`,
    resetPassword: `${P}/auth/reset-password`,
    refresh: `${P}/auth/refresh`,
    resendVerification: `${P}/auth/resend-verification`,
    // User management routes → delegated to /api/v1/users/*
    me: `${P}/users/me`,
    changeEmail: `${P}/users/change-email`,
    changePassword: `${P}/users/change-password`,
    addEmail: `${P}/users/add-email`,
    verifyAddEmail: `${P}/users/verify-add-email`,
    resendAddEmailVerification: `${P}/users/resend-add-email-verification`,
    removeEmail: `${P}/users/remove-email`,
    emailStatus: `${P}/users/email-status`,
    deleteAccount: `${P}/users/me`,
  },
  transactions: {
    list: `${P}/transactions`,
    create: `${P}/transactions`,
    get: (id) => `${P}/transactions/${id}`,
    update: (id) => `${P}/transactions/${id}`,
    delete: (id) => `${P}/transactions/${id}`,
    bulkDelete: `${P}/transactions`,
    stats: `${P}/transactions/stats/overview`,
  },
  users: {
    // Korrekte Backend-Endpunkte (gemäß /src/routes/users/)
    profile: `${P}/users/me`,           // GET - Profil abrufen
    updateProfile: `${P}/users/me`,     // PUT - Profil aktualisieren
    deleteAccount: `${P}/users/me`,     // DELETE - Account löschen
    password: `${P}/users/change-password`, // POST - Passwort ändern
    updatePreferences: `${P}/users/preferences`, // PUT - Einstellungen
    budgetStatus: `${P}/users/budget-status`,    // GET - Budget-Status
    // Lifecycle
    lifecycleStatus: `${P}/users/lifecycle-status`, // GET - Lifecycle-Status
    exportConfirm: `${P}/users/export-confirm`,     // POST - Export bestätigen
    quota: `${P}/transactions/quota`,               // GET - Transaktions-Kontingent
  },
  admin: {
    stats: `${P}/admin/stats`,
    // Users
    users: `${P}/admin/users`,
    usersExport: `${P}/admin/users/export`,
    user: (id) => `${P}/admin/users/${id}`,
    banUser: (id) => `${P}/admin/users/${id}/ban`,
    unbanUser: (id) => `${P}/admin/users/${id}/unban`,
    userRole: (id) => `${P}/admin/users/${id}/role`,
    resetPassword: (id) => `${P}/admin/users/${id}/reset-password`,
    // Audit Log
    auditLog: `${P}/admin/audit-log`,
    auditLogStats: `${P}/admin/audit-log/stats`,
    // Transactions
    transactions: `${P}/admin/transactions`,
    transactionsExport: `${P}/admin/transactions/export`,
    transactionStats: `${P}/admin/transactions/stats`,
    transactionUsers: `${P}/admin/transactions/users`,
    transaction: (id) => `${P}/admin/transactions/${id}`,
    // Subscribers
    subscribers: `${P}/admin/subscribers`,
    subscriberStats: `${P}/admin/subscribers/stats`,
    subscribersExport: `${P}/admin/subscribers/export`,
    subscriber: (id) => `${P}/admin/subscribers/${id}`,
    subscriberResend: (id) => `${P}/admin/subscribers/${id}/resend`,
    // Campaigns
    campaigns: `${P}/admin/campaigns`,
    campaignStats: `${P}/admin/campaigns/stats`,
    campaignPreview: `${P}/admin/campaigns/preview`,
    campaign: (id) => `${P}/admin/campaigns/${id}`,
    campaignSend: (id) => `${P}/admin/campaigns/${id}/send`,
    campaignsReset: `${P}/admin/campaigns`,
    // Lifecycle
    lifecycleStats: `${P}/admin/lifecycle/stats`,
    lifecycleUserDetail: (id) => `${P}/admin/lifecycle/users/${id}`,
    lifecycleUserReset: (id) => `${P}/admin/lifecycle/users/${id}/reset`,
    lifecycleTrigger: `${P}/admin/lifecycle/trigger`,
  },
  contact: `${P}/contact`,
  newsletter: {
    subscribe: `${P}/newsletter/subscribe`,
    status: `${P}/newsletter/status`,
    toggle: `${P}/newsletter/toggle`,
  },
  consent: `${P}/consent`,
};

export default ENDPOINTS;
