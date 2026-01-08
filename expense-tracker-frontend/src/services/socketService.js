/**
 * Socket.io service for managing WebSocket connections and events.
 */
import { io } from 'socket.io-client';
import { SOCKET_CONFIG, SOCKET_EVENTS, DEBUG_MODE } from '../config/socketConfig';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.lastPing = Date.now();
    this.latency = 0;
  }

  /**
   * Initializes the socket connection.
   * @param {string} namespace - Optional namespace (e.g., '/expenses')
   */
  connect(namespace = '') {
    if (this.socket?.connected) {
      if (DEBUG_MODE) console.log('Socket already connected');
      return;
    }

    const url = `${SOCKET_CONFIG.url}${namespace}`;
    this.socket = io(url, SOCKET_CONFIG.options);

    this.setupEventHandlers();
    this.startHeartbeat();

    if (DEBUG_MODE) console.log(`Socket connecting to ${url}`);
  }

  /**
   * Sets up core socket event handlers.
   */
  setupEventHandlers() {
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      if (DEBUG_MODE) console.log('Socket connected');
      this.emit('connection:status', { connected: true });
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      this.connected = false;
      if (DEBUG_MODE) console.log('Socket disconnected:', reason);
      this.emit('connection:status', { connected: false, reason });
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      if (DEBUG_MODE) console.error('Socket connection error:', error);
      this.emit('connection:error', { error });
    });

    this.socket.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (attempt) => {
      this.reconnectAttempts = attempt;
      if (DEBUG_MODE) console.log(`Socket reconnect attempt ${attempt}`);
      this.emit('connection:reconnecting', { attempt });
    });

    this.socket.on(SOCKET_EVENTS.PONG, () => {
      this.latency = Date.now() - this.lastPing;
      if (DEBUG_MODE) console.log(`Latency: ${this.latency}ms`);
    });
  }

  /**
   * Starts heartbeat to measure latency.
   */
  startHeartbeat() {
    setInterval(() => {
      if (this.connected) {
        this.lastPing = Date.now();
        this.socket.emit(SOCKET_EVENTS.PING);
      }
    }, 5000);
  }

  /**
   * Subscribes to a socket event.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized. Call connect() first.');
      return () => {};
    }

    this.socket.on(event, callback);

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribes from a socket event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emits an event to the server.
   * @param {string} event
   * @param {*} data
   * @param {Function} callback - Optional acknowledgment callback
   */
  emit(event, data, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized. Call connect() first.');
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }

    if (DEBUG_MODE) console.log(`Emitting ${event}:`, data);
  }

  /**
   * Disconnects the socket.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      if (DEBUG_MODE) console.log('Socket disconnected manually');
    }
  }

  /**
   * Returns current connection status.
   * @returns {{ connected: boolean, latency: number, reconnectAttempts: number }}
   */
  getStatus() {
    return {
      connected: this.connected,
      latency: this.latency,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Removes all listeners for cleanup.
   */
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.listeners.clear();
    }
  }
}

export const socketService = new SocketService();
export default socketService;
