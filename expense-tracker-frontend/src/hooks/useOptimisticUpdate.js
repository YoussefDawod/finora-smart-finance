/**
 * React hook for optimistic updates with automatic rollback on error.
 */
import { useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { emitWithQueue } from '../utils/realtimeEvents';

/**
 * Hook for managing optimistic updates.
 * @param {Object} options
 * @param {Function} options.onSuccess - Called when server confirms update
 * @param {Function} options.onError - Called when update fails
 * @param {Function} options.onRollback - Called when rollback occurs
 * @returns {Object} Optimistic update functions
 */
export function useOptimisticUpdate({ onSuccess, onError, onRollback } = {}) {
  const [pendingUpdates, setPendingUpdates] = useState(new Map());
  const snapshotsRef = useRef(new Map());

  /**
   * Creates an optimistic update.
   * @param {string} updateId - Unique update identifier
   * @param {Function} optimisticFn - Function to apply optimistic change
   * @param {string} event - Socket event to emit
   * @param {*} data - Event data
   * @param {Function} rollbackFn - Function to rollback on error
   * @returns {Promise<void>}
   */
  const createOptimisticUpdate = useCallback(
    async (updateId, optimisticFn, event, data, rollbackFn) => {
      // Store snapshot for potential rollback
      const snapshot = rollbackFn ? await rollbackFn() : null;
      snapshotsRef.current.set(updateId, snapshot);

      // Apply optimistic update
      setPendingUpdates((prev) => new Map(prev).set(updateId, { event, data }));
      const result = await optimisticFn();

      try {
        // Emit to server
        await emitWithQueue(socketService, event, data, { queueIfOffline: true });

        // Success: remove pending update
        setPendingUpdates((prev) => {
          const next = new Map(prev);
          next.delete(updateId);
          return next;
        });
        snapshotsRef.current.delete(updateId);

        onSuccess?.(updateId, result);
        return result;
      } catch (error) {
        // Error: rollback
        const snapshot = snapshotsRef.current.get(updateId);
        if (snapshot && rollbackFn) {
          await rollbackFn(snapshot);
          onRollback?.(updateId, snapshot);
        }

        setPendingUpdates((prev) => {
          const next = new Map(prev);
          next.delete(updateId);
          return next;
        });
        snapshotsRef.current.delete(updateId);

        onError?.(updateId, error);
        throw error;
      }
    },
    [onSuccess, onError, onRollback]
  );

  /**
   * Rolls back a specific update.
   * @param {string} updateId
   */
  const rollback = useCallback(
    async (updateId, rollbackFn) => {
      const snapshot = snapshotsRef.current.get(updateId);
      if (snapshot && rollbackFn) {
        await rollbackFn(snapshot);
        onRollback?.(updateId, snapshot);
      }

      setPendingUpdates((prev) => {
        const next = new Map(prev);
        next.delete(updateId);
        return next;
      });
      snapshotsRef.current.delete(updateId);
    },
    [onRollback]
  );

  /**
   * Confirms an update (e.g., when server confirms).
   * @param {string} updateId
   */
  const confirm = useCallback((updateId) => {
    setPendingUpdates((prev) => {
      const next = new Map(prev);
      next.delete(updateId);
      return next;
    });
    snapshotsRef.current.delete(updateId);
  }, []);

  /**
   * Returns all pending update IDs.
   * @returns {Array<string>}
   */
  const getPendingIds = useCallback(() => {
    return Array.from(pendingUpdates.keys());
  }, [pendingUpdates]);

  /**
   * Checks if an update is pending.
   * @param {string} updateId
   * @returns {boolean}
   */
  const isPending = useCallback(
    (updateId) => {
      return pendingUpdates.has(updateId);
    },
    [pendingUpdates]
  );

  return {
    createOptimisticUpdate,
    rollback,
    confirm,
    getPendingIds,
    isPending,
    pendingCount: pendingUpdates.size,
  };
}

export default useOptimisticUpdate;
