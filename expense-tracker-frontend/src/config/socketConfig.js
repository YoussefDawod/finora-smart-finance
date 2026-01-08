/**
 * Socket.io client configuration and constants.
 */

export const SOCKET_CONFIG = {
  url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  options: {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20000,
    autoConnect: true,
    transports: ['websocket', 'polling'],
  },
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  PING: 'ping',
  PONG: 'pong',
};

export const EXPENSE_EVENTS = {
  CREATED: 'expense:created',
  UPDATED: 'expense:updated',
  DELETED: 'expense:deleted',
  SYNC_REQUEST: 'expense:sync',
  SYNC_RESPONSE: 'expense:sync:response',
};

export const CATEGORY_EVENTS = {
  UPDATED: 'category:updated',
};

export const USER_EVENTS = {
  ONLINE: 'user:online',
  OFFLINE: 'user:offline',
};

export const SYNC_EVENTS = {
  CONFLICT: 'sync:conflict',
  FULL_SYNC: 'sync:full',
  FULL_SYNC_RESPONSE: 'sync:full:response',
};

export const NAMESPACES = {
  EXPENSES: '/expenses',
  CATEGORIES: '/categories',
  USERS: '/users',
};

export const BACKOFF_CONFIG = {
  initialDelay: 1000,
  maxDelay: 8000,
  multiplier: 2,
};

export const CONNECTION_STATES = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

export const DEBUG_MODE = import.meta.env.DEV;
