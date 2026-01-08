/**
 * Offline banner component.
 */
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import './OfflineBanner.scss';

/**
 * Displays a banner when the app is offline.
 * @param {Object} props
 * @param {boolean} props.showReconnecting - Show when reconnecting (default: true)
 * @param {string} props.message - Custom offline message
 * @returns {JSX.Element|null}
 */
export function OfflineBanner({
  showReconnecting = true,
  message = 'You are currently offline. Some features may be unavailable.',
}) {
  const { isConnected, isReconnecting, reconnectAttempts, retry } = useConnectionStatus();

  // Don't show if connected
  if (isConnected) {
    return null;
  }

  // Don't show when reconnecting if configured
  if (isReconnecting && !showReconnecting) {
    return null;
  }

  return (
    <div
      className={`offline-banner ${isReconnecting ? 'offline-banner--reconnecting' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="offline-banner__content">
        <svg
          className="offline-banner__icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isReconnecting ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
            />
          )}
        </svg>

        <div className="offline-banner__text">
          <p className="offline-banner__message">
            {isReconnecting ? `Reconnecting... (Attempt ${reconnectAttempts})` : message}
          </p>
          {!isReconnecting && (
            <p className="offline-banner__hint">
              Changes will be saved locally and synced when you're back online.
            </p>
          )}
        </div>

        {!isReconnecting && (
          <button
            className="offline-banner__retry"
            onClick={retry}
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default OfflineBanner;
