/**
 * @fileoverview API Configuration
 * @description Environment-specific API settings
 * 
 * @module api/config
 */

/* eslint-disable no-undef */

// Empty baseURL - endpoints contain full path for proxy to work
export const API_BASE_URL = import.meta.env?.VITE_API_URL || '';
export const API_TIMEOUT = 10000;

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: API_TIMEOUT,
  HEADERS: {
    'Content-Type': 'application/json',
  },
  TOKEN_STORAGE_KEY: 'auth_token',
  DEBUG: true,
};

export default API_CONFIG;
