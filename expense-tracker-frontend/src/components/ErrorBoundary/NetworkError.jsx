/**
 * Network error display component.
 * Shows offline mode message with connection status.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './NetworkError.scss';

const NetworkError = ({ onRetry, onOfflineMode, incidentId }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="network-error">
      <div className="network-error__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 20h.01M8.5 16.5a5 5 0 017 0M5 13a9 9 0 0114 0M2 9.5C3.5 8 5.5 7 8 6.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="2"
            y1="22"
            x2="22"
            y2="2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="network-error__title">Connection Error</h3>

      <div className="network-error__status">
        <span className={`network-error__indicator ${isOnline ? 'online' : 'offline'}`} />
        <span className="network-error__status-text">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <p className="network-error__message">
        {isOnline
          ? 'Unable to connect to the server. Please try again.'
          : 'You are currently offline. Please check your internet connection.'}
      </p>

      {incidentId && (
        <p className="network-error__incident">
          Incident ID: <code>{incidentId}</code>
        </p>
      )}

      <div className="network-error__actions">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying || !isOnline}
          className="network-error__button network-error__button--primary"
        >
          {retrying ? (
            <>
              <span className="network-error__spinner" />
              Retrying...
            </>
          ) : (
            'Try Again'
          )}
        </button>

        {onOfflineMode && (
          <button
            type="button"
            onClick={onOfflineMode}
            className="network-error__button network-error__button--secondary"
          >
            Continue Offline
          </button>
        )}
      </div>

      <p className="network-error__help">
        If the problem persists, try:
      </p>
      <ul className="network-error__tips">
        <li>Check your Wi-Fi or mobile data connection</li>
        <li>Restart your router</li>
        <li>Disable VPN if active</li>
        <li>Clear browser cache and cookies</li>
      </ul>
    </div>
  );
};

NetworkError.propTypes = {
  onRetry: PropTypes.func,
  onOfflineMode: PropTypes.func,
  incidentId: PropTypes.string,
};

export default NetworkError;
