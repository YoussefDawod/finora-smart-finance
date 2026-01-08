/**
 * Sync status indicator component.
 */
import { useSyncState } from '../../hooks/useSyncState';
import './SyncStatus.scss';

/**
 * Displays sync status with last sync time and conflict count.
 * @param {Object} props
 * @param {Array} props.localData - Local data to track
 * @param {Function} props.onSync - Callback when synced
 * @param {Function} props.onConflict - Callback when conflicts detected
 * @param {boolean} props.showWhenSynced - Show when synced (default: true)
 * @returns {JSX.Element|null}
 */
export function SyncStatus({ localData = [], onSync, onConflict, showWhenSynced = true }) {
  const {
    isSyncing,
    lastSyncTime,
    syncError,
    conflicts,
    hasChanges,
    requestFullSync,
  } = useSyncState({
    localData,
    onSync,
    onConflict,
    autoSync: false,
  });

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';

    const now = Date.now();
    const diff = now - lastSyncTime;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Hide when synced if configured
  if (!isSyncing && !hasChanges && !syncError && conflicts.length === 0 && !showWhenSynced) {
    return null;
  }

  return (
    <div className="sync-status" role="status" aria-live="polite">
      <div className="sync-status__content">
        {isSyncing ? (
          <>
            <svg
              className="sync-status__icon sync-status__icon--spinning"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="sync-status__text">Syncing...</span>
          </>
        ) : syncError ? (
          <>
            <svg
              className="sync-status__icon sync-status__icon--error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="sync-status__text sync-status__text--error">
              Sync failed
            </span>
            <button
              className="sync-status__retry"
              onClick={requestFullSync}
              aria-label="Retry sync"
            >
              Retry
            </button>
          </>
        ) : conflicts.length > 0 ? (
          <>
            <svg
              className="sync-status__icon sync-status__icon--warning"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="sync-status__text sync-status__text--warning">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
            </span>
          </>
        ) : hasChanges ? (
          <>
            <svg
              className="sync-status__icon sync-status__icon--pending"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="sync-status__text">Pending changes</span>
            <button
              className="sync-status__sync"
              onClick={requestFullSync}
              aria-label="Sync now"
            >
              Sync
            </button>
          </>
        ) : (
          <>
            <svg
              className="sync-status__icon sync-status__icon--success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="sync-status__text">Synced {formatLastSync()}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default SyncStatus;
