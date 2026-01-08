/**
 * Server error display component.
 * Shows 500-level server errors with incident tracking.
 */
import React from 'react';
import PropTypes from 'prop-types';
import './ServerError.scss';

const ServerError = ({ message, incidentId, onRetry, onHome, statusCode }) => {
  const getErrorMessage = () => {
    if (message) return message;
    
    switch (statusCode) {
      case 500:
        return 'The server encountered an internal error.';
      case 502:
        return 'Bad gateway. The server received an invalid response.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. The server took too long to respond.';
      default:
        return 'The server encountered an error. Please try again later.';
    }
  };

  return (
    <div className="server-error">
      <div className="server-error__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M6 7h12M6 11h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M12 20l-2 2M12 20l2 2M12 20v-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="server-error__title">Server Error</h3>

      {statusCode && (
        <div className="server-error__code">
          Error {statusCode}
        </div>
      )}

      <p className="server-error__message">{getErrorMessage()}</p>

      {incidentId && (
        <div className="server-error__incident">
          <p className="server-error__incident-label">Incident ID:</p>
          <code className="server-error__incident-id">{incidentId}</code>
          <p className="server-error__incident-help">
            Please provide this ID when contacting support.
          </p>
        </div>
      )}

      <div className="server-error__actions">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="server-error__button server-error__button--primary"
          >
            <svg
              className="server-error__button-icon"
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
          </button>
        )}

        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="server-error__button server-error__button--secondary"
          >
            Go to Home
          </button>
        )}
      </div>

      <div className="server-error__help">
        <p className="server-error__help-title">What you can do:</p>
        <ul className="server-error__help-list">
          <li>Wait a few minutes and try again</li>
          <li>Refresh the page</li>
          <li>Check our status page for updates</li>
          <li>Contact support if the issue persists</li>
        </ul>
      </div>
    </div>
  );
};

ServerError.propTypes = {
  message: PropTypes.string,
  incidentId: PropTypes.string,
  onRetry: PropTypes.func,
  onHome: PropTypes.func,
  statusCode: PropTypes.number,
};

export default ServerError;
