/**
 * React hook for real-time synchronization with WebSocket events.
 */
import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { EXPENSE_EVENTS, SYNC_EVENTS } from '../config/socketConfig';

/**
 * Hook for syncing expenses in real-time.
 * @param {Object} options
 * @param {Function} options.onExpenseCreated - Callback when expense is created
 * @param {Function} options.onExpenseUpdated - Callback when expense is updated
 * @param {Function} options.onExpenseDeleted - Callback when expense is deleted
 * @param {Function} options.onSyncConflict - Callback when sync conflict occurs
 * @param {Function} options.onFullSync - Callback when full sync is requested
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @returns {Object} Sync control functions
 */
export function useRealtimeSync({
  onExpenseCreated,
  onExpenseUpdated,
  onExpenseDeleted,
  onSyncConflict,
  onFullSync,
  autoConnect = true,
} = {}) {
  const unsubscribersRef = useRef([]);

  const connect = useCallback(() => {
    socketService.connect('/expenses');
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const requestFullSync = useCallback(() => {
    socketService.emit(SYNC_EVENTS.REQUEST_FULL_SYNC, {
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    if (!autoConnect) return;

    connect();

    // Subscribe to expense events
    if (onExpenseCreated) {
      const unsubCreated = socketService.on(EXPENSE_EVENTS.CREATED, (data) => {
        onExpenseCreated(data);
      });
      unsubscribersRef.current.push(unsubCreated);
    }

    if (onExpenseUpdated) {
      const unsubUpdated = socketService.on(EXPENSE_EVENTS.UPDATED, (data) => {
        onExpenseUpdated(data);
      });
      unsubscribersRef.current.push(unsubUpdated);
    }

    if (onExpenseDeleted) {
      const unsubDeleted = socketService.on(EXPENSE_EVENTS.DELETED, (data) => {
        onExpenseDeleted(data);
      });
      unsubscribersRef.current.push(unsubDeleted);
    }

    if (onSyncConflict) {
      const unsubConflict = socketService.on(SYNC_EVENTS.CONFLICT, (data) => {
        onSyncConflict(data);
      });
      unsubscribersRef.current.push(unsubConflict);
    }

    if (onFullSync) {
      const unsubFullSync = socketService.on(SYNC_EVENTS.FULL_SYNC, (data) => {
        onFullSync(data);
      });
      unsubscribersRef.current.push(unsubFullSync);
    }

    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [autoConnect, connect, onExpenseCreated, onExpenseUpdated, onExpenseDeleted, onSyncConflict, onFullSync]);

  return {
    connect,
    disconnect,
    requestFullSync,
    isConnected: socketService.connected,
  };
}

export default useRealtimeSync;
