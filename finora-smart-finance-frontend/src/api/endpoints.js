/**
 * @fileoverview Endpoints Constants
 * @description All API endpoint paths (with /api prefix for Vite proxy)
 * 
 * @module api/endpoints
 */

export const ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    verify: '/api/auth/verify-email',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    refresh: '/api/auth/refresh',
    resendVerification: '/api/auth/resend-verification',
    // User management routes → delegated to /api/users/*
    me: '/api/users/me',
    changeEmail: '/api/users/change-email',
    changePassword: '/api/users/change-password',
    addEmail: '/api/users/add-email',
    verifyAddEmail: '/api/users/verify-add-email',
    resendAddEmailVerification: '/api/users/resend-add-email-verification',
    removeEmail: '/api/users/remove-email',
    emailStatus: '/api/users/email-status',
    deleteAccount: '/api/users/me',
  },
  transactions: {
    list: '/api/transactions',
    create: '/api/transactions',
    get: (id) => `/api/transactions/${id}`,
    update: (id) => `/api/transactions/${id}`,
    delete: (id) => `/api/transactions/${id}`,
    bulkDelete: '/api/transactions',
    stats: '/api/transactions/stats/overview',
  },
  users: {
    // Korrekte Backend-Endpunkte (gemäß /src/routes/users/)
    profile: '/api/users/me',           // GET - Profil abrufen
    updateProfile: '/api/users/me',     // PUT - Profil aktualisieren
    deleteAccount: '/api/users/me',     // DELETE - Account löschen
    password: '/api/users/change-password', // POST - Passwort ändern
    updatePreferences: '/api/users/preferences', // PUT - Einstellungen
    budgetStatus: '/api/users/budget-status',    // GET - Budget-Status
  },
  contact: '/api/contact',
  newsletter: {
    subscribe: '/api/newsletter/subscribe',
    status: '/api/newsletter/status',
    toggle: '/api/newsletter/toggle',
  },
};

export default ENDPOINTS;
