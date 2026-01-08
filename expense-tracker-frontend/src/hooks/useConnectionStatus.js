/**
 * React hook for tracking WebSocket connection status.
 */
import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { CONNECTION_STATES } from '../config/socketConfig';
import { processOfflineQueue } from '../utils/realtimeEvents';

/**
 * Hook for monitoring connection status.
 * @param {Object} options
 * @param {Function} options.onConnect - Callback when connected
 * @param {Function} options.onDisconnect - Callback when disconnected
 * @param {Function} options.onReconnecting - Callback when reconnecting
 * @param {Function} options.onError - Callback on connection error
 * @returns {Object} Connection state and control functions
 */
export function useConnectionStatus({
  onConnect,
  onDisconnect,
  onReconnecting,
  onError,
} = {}) {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [latency, setLatency] = useState(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState(null);

  const updateStatus = useCallback(() => {
    const status = socketService.getStatus();
    setLatency(status.latency);
    setReconnectAttempts(status.reconnectAttempts);

    if (status.connected) {
      setConnectionState(CONNECTION_STATES.CONNECTED);
    } else if (status.reconnectAttempts > 0) {
      setConnectionState(CONNECTION_STATES.RECONNECTING);
    } else {
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
    }
  }, []);

  const retry = useCallback(() => {
    socketService.connect();
  }, []);

  useEffect(() => {
    const handleConnectionStatus = (data) => {
      if (data.connected) {
        setConnectionState(CONNECTION_STATES.CONNECTED);
        setLastError(null);
        onConnect?.();

        // Process offline queue
        processOfflineQueue(socketService).catch((error) => {
          console.error('Failed to process offline queue:', error);
        });
      } else {
        setConnectionState(CONNECTION_STATES.DISCONNECTED);
        onDisconnect?.(data.reason);
      }
      updateStatus();
    };

    const handleConnectionError = (data) => {
      setConnectionState(CONNECTION_STATES.ERROR);
      setLastError(data.error);
      onError?.(data.error);
      updateStatus();
    };

    const handleReconnecting = (data) => {
      setConnectionState(CONNECTION_STATES.RECONNECTING);
      setReconnectAttempts(data.attempt);
      onReconnecting?.(data.attempt);
      updateStatus();
    };

    const unsubStatus = socketService.on('connection:status', handleConnectionStatus);
    const unsubError = socketService.on('connection:error', handleConnectionError);
    const unsubReconnecting = socketService.on('connection:reconnecting', handleReconnecting);

    // Initial status check
    updateStatus();

    // Periodic status updates
    const intervalId = setInterval(updateStatus, 5000);

    return () => {
      unsubStatus();
      unsubError();
      unsubReconnecting();
      clearInterval(intervalId);
    };
  }, [updateStatus, onConnect, onDisconnect, onReconnecting, onError]);

  return {
    connectionState,
    isConnected: connectionState === CONNECTION_STATES.CONNECTED,
    isReconnecting: connectionState === CONNECTION_STATES.RECONNECTING,
    isDisconnected: connectionState === CONNECTION_STATES.DISCONNECTED,
    hasError: connectionState === CONNECTION_STATES.ERROR,
    latency,
    reconnectAttempts,
    lastError,
    retry,
  };
}

export default useConnectionStatus;
