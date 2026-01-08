/**
 * React hook for managing sync state with conflict resolution.
 */
import { useState, useCallback, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { SYNC_EVENTS } from '../config/socketConfig';
import {
  mergeWithConflictResolution,
  CONFLICT_STRATEGIES,
  generateVersionHash,
} from '../utils/conflictResolution';

/**
 * Hook for managing synchronization state with conflict handling.
 * @param {Object} options
 * @param {Array} options.localData - Local data to sync
 * @param {Function} options.onSync - Callback when data is synced
 * @param {Function} options.onConflict - Callback when conflicts are detected
 * @param {string} options.strategy - Conflict resolution strategy
 * @param {boolean} options.autoSync - Auto-sync on mount (default: true)
 * @returns {Object} Sync control functions and state
 */
export function useSyncState({
  localData = [],
  onSync,
  onConflict,
  strategy = CONFLICT_STRATEGIES.LAST_WRITE_WINS,
  autoSync = true,
} = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [versionHash, setVersionHash] = useState(null);

  /**
   * Requests full sync from server.
   */
  const requestFullSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      return new Promise((resolve, reject) => {
        socketService.emit(
          SYNC_EVENTS.REQUEST_FULL_SYNC,
          {
            timestamp: Date.now(),
            clientVersion: versionHash,
          },
          (response) => {
            if (response?.error) {
              setSyncError(response.error);
              setIsSyncing(false);
              reject(new Error(response.error));
            } else {
              const remoteData = response?.data || [];

              // Merge with conflict resolution
              const { items, conflicts, resolutions } = mergeWithConflictResolution(
                localData,
                remoteData,
                { strategy }
              );

              setConflicts(resolutions.filter((r) => r.conflict));
              setLastSyncTime(Date.now());
              setIsSyncing(false);

              const newHash = generateVersionHash({ items, timestamp: Date.now() });
              setVersionHash(newHash);

              if (conflicts > 0) {
                onConflict?.(resolutions.filter((r) => r.conflict));
              }

              onSync?.(items);
              resolve(items);
            }
          }
        );
      });
    } catch (error) {
      setSyncError(error.message);
      setIsSyncing(false);
      throw error;
    }
  }, [localData, onSync, onConflict, strategy, versionHash]);

  /**
   * Pushes local changes to server.
   * @param {Array} changes - Changes to push
   */
  const pushChanges = useCallback(
    async (changes) => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        return new Promise((resolve, reject) => {
          socketService.emit(
            SYNC_EVENTS.PUSH_CHANGES,
            {
              changes,
              timestamp: Date.now(),
              clientVersion: versionHash,
            },
            (response) => {
              if (response?.error) {
                setSyncError(response.error);
                setIsSyncing(false);
                reject(new Error(response.error));
              } else {
                setLastSyncTime(Date.now());
                setIsSyncing(false);
                resolve(response);
              }
            }
          );
        });
      } catch (error) {
        setSyncError(error.message);
        setIsSyncing(false);
        throw error;
      }
    },
    [versionHash]
  );

  /**
   * Resolves a specific conflict manually.
   * @param {string} conflictId
   * @param {Object} resolution - Chosen resolution
   */
  const resolveConflict = useCallback(
    (conflictId, resolution) => {
      setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
      onSync?.(resolution);
    },
    [onSync]
  );

  /**
   * Clears all conflicts (accepts server version).
   */
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  /**
   * Checks if data has changed since last sync.
   * @returns {boolean}
   */
  const hasChanges = useCallback(() => {
    const currentHash = generateVersionHash({ items: localData, timestamp: Date.now() });
    return currentHash !== versionHash;
  }, [localData, versionHash]);

  // Auto-sync on mount
  useEffect(() => {
    if (autoSync && socketService.connected) {
      requestFullSync();
    }
  }, [autoSync, requestFullSync]);

  // Listen for server-initiated sync events
  useEffect(() => {
    const handleFullSync = (data) => {
      const remoteData = data?.items || [];

      const { items, conflicts, resolutions } = mergeWithConflictResolution(
        localData,
        remoteData,
        { strategy }
      );

      setConflicts(resolutions.filter((r) => r.conflict));
      setLastSyncTime(Date.now());

      if (conflicts > 0) {
        onConflict?.(resolutions.filter((r) => r.conflict));
      }

      onSync?.(items);
    };

    const handleConflict = (data) => {
      setConflicts((prev) => [...prev, data]);
      onConflict?.([data]);
    };

    const unsubSync = socketService.on(SYNC_EVENTS.FULL_SYNC, handleFullSync);
    const unsubConflict = socketService.on(SYNC_EVENTS.CONFLICT, handleConflict);

    return () => {
      unsubSync();
      unsubConflict();
    };
  }, [localData, onSync, onConflict, strategy]);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    conflicts,
    hasChanges: hasChanges(),
    requestFullSync,
    pushChanges,
    resolveConflict,
    clearConflicts,
  };
}

export default useSyncState;
