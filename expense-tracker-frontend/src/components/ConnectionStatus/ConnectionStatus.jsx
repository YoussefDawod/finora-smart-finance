/**
 * Connection status indicator component.
 */
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { CONNECTION_STATES } from '../../config/socketConfig';
import './ConnectionStatus.scss';

/**
 * Displays current WebSocket connection status.
 * @param {Object} props
 * @param {boolean} props.showWhenConnected - Show indicator when connected (default: false)
 * @param {string} props.position - Position ('top-right', 'top-left', 'bottom-right', 'bottom-left')
 * @returns {JSX.Element|null}
 */
export function ConnectionStatus({ showWhenConnected = false, position = 'top-right' }) {
  const {
    connectionState,
    isConnected,
    isReconnecting,
    latency,
    reconnectAttempts,
    retry,
  } = useConnectionStatus();

  // Hide when connected if not configured to show
  if (isConnected && !showWhenConnected) {
    return null;
  }

  const getStatusText = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return `Connected (${latency}ms)`;
      case CONNECTION_STATES.RECONNECTING:
        return `Reconnecting... (${reconnectAttempts})`;
      case CONNECTION_STATES.DISCONNECTED:
        return 'Disconnected';
      case CONNECTION_STATES.ERROR:
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return 'connection-status--connected';
      case CONNECTION_STATES.RECONNECTING:
        return 'connection-status--reconnecting';
      case CONNECTION_STATES.DISCONNECTED:
        return 'connection-status--disconnected';
      case CONNECTION_STATES.ERROR:
        return 'connection-status--error';
      default:
        return '';
    }
  };

  return (
    <div
      className={`connection-status connection-status--${position} ${getStatusClass()}`}
      role="status"
      aria-live="polite"
    >
      <div className="connection-status__indicator" />
      <span className="connection-status__text">{getStatusText()}</span>
      {!isConnected && !isReconnecting && (
        <button
          className="connection-status__retry"
          onClick={retry}
          aria-label="Retry connection"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ConnectionStatus;
