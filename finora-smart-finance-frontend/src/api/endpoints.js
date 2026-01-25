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
    changeEmail: '/api/auth/change-email',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    resendVerification: '/api/auth/resend-verification',
    changePassword: '/api/auth/change-password',
    // Email management
    addEmail: '/api/auth/add-email',
    verifyAddEmail: '/api/auth/verify-add-email',
    resendAddEmailVerification: '/api/auth/resend-add-email-verification',
    removeEmail: '/api/auth/remove-email',
    emailStatus: '/api/auth/email-status',
    deleteAccount: '/api/auth/me',
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
    profile: '/api/users/profile',
    updateProfile: '/api/users/profile',
    updatePreferences: '/api/users/preferences',
    password: '/api/users/password',
    email: '/api/users/email',
    deleteAccount: '/api/users/account',
    enable2FA: '/api/users/2fa/enable',
    verify2FA: '/api/users/2fa/verify',
  },
};

export default ENDPOINTS;
