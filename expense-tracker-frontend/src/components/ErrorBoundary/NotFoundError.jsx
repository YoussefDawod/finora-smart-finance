/**
 * Not Found (404) error display component.
 * Shows alternative navigation options.
 */
import React from 'react';
import PropTypes from 'prop-types';
import './NotFoundError.scss';

const NotFoundError = ({ resource, onHome, onBack, suggestions = [] }) => {
  return (
    <div className="not-found-error">
      <div className="not-found-error__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="not-found-error__title">404 - Not Found</h3>

      <p className="not-found-error__message">
        {resource
          ? `The ${resource} you're looking for could not be found.`
          : "The page you're looking for doesn't exist."}
      </p>

      <div className="not-found-error__actions">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="not-found-error__button not-found-error__button--secondary"
          >
            <svg
              className="not-found-error__button-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Go Back
          </button>
        )}

        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="not-found-error__button not-found-error__button--primary"
          >
            <svg
              className="not-found-error__button-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" />
            </svg>
            Go to Home
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="not-found-error__suggestions">
          <p className="not-found-error__suggestions-title">You might be looking for:</p>
          <ul className="not-found-error__suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <a
                  href={suggestion.url}
                  className="not-found-error__suggestion-link"
                  onClick={(e) => {
                    if (suggestion.onClick) {
                      e.preventDefault();
                      suggestion.onClick();
                    }
                  }}
                >
                  {suggestion.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="not-found-error__help">
        <p className="not-found-error__help-text">
          If you think this is a mistake, please{' '}
          <a href="/support" className="not-found-error__help-link">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
};

NotFoundError.propTypes = {
  resource: PropTypes.string,
  onHome: PropTypes.func,
  onBack: PropTypes.func,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      onClick: PropTypes.func,
    })
  ),
};

export default NotFoundError;
