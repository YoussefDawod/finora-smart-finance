/**
 * Timeout error display component.
 * Shows timeout-specific recovery options.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './TimeoutError.scss';

const TimeoutError = ({ onRetry, onHome, timeout = 30000 }) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  const formatTimeout = (ms) => {
    if (ms >= 60000) {
      return `${Math.floor(ms / 60000)} minute${ms >= 120000 ? 's' : ''}`;
    }
    return `${Math.floor(ms / 1000)} seconds`;
  };

  return (
    <div className="timeout-error">
      <div className="timeout-error__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="timeout-error__title">Request Timeout</h3>

      <p className="timeout-error__message">
        The request took longer than {formatTimeout(timeout)} to complete.
      </p>

      <div className="timeout-error__details">
        <p className="timeout-error__details-text">
          This could be due to:
        </p>
        <ul className="timeout-error__details-list">
          <li>Slow internet connection</li>
          <li>Server overload</li>
          <li>Large data transfer</li>
          <li>Network congestion</li>
        </ul>
      </div>

      <div className="timeout-error__actions">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="timeout-error__button timeout-error__button--primary"
        >
          {retrying ? (
            <>
              <span className="timeout-error__spinner" />
              Retrying...
            </>
          ) : (
            <>
              <svg
                className="timeout-error__button-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 12a8 8 0 018-8V2.5M20 12a8 8 0 01-8 8v1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Try Again
            </>
          )}
        </button>

        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="timeout-error__button timeout-error__button--secondary"
          >
            Go to Home
          </button>
        )}
      </div>

      <div className="timeout-error__tips">
        <p className="timeout-error__tips-title">Tips to resolve:</p>
        <ul className="timeout-error__tips-list">
          <li>Check your internet connection speed</li>
          <li>Try again in a few moments</li>
          <li>Close other bandwidth-intensive applications</li>
          <li>Switch to a more stable network</li>
        </ul>
      </div>
    </div>
  );
};

TimeoutError.propTypes = {
  onRetry: PropTypes.func,
  onHome: PropTypes.func,
  timeout: PropTypes.number,
};

export default TimeoutError;
