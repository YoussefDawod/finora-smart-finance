/**
 * Validation error display component.
 * Shows field-level validation errors with detailed messages.
 */
import React from 'react';
import PropTypes from 'prop-types';
import './ValidationError.scss';

const ValidationError = ({ errors, onRetry, onCancel }) => {
  const hasErrors = errors && Object.keys(errors).length > 0;

  if (!hasErrors) {
    return null;
  }

  return (
    <div className="validation-error">
      <div className="validation-error__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      </div>

      <h3 className="validation-error__title">Validation Error</h3>
      <p className="validation-error__message">
        Please fix the following errors and try again:
      </p>

      <ul className="validation-error__list">
        {Object.entries(errors).map(([field, messages]) => (
          <li key={field} className="validation-error__item">
            <strong className="validation-error__field">{field}:</strong>
            {Array.isArray(messages) ? (
              <ul className="validation-error__sub-list">
                {messages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            ) : (
              <span className="validation-error__text">{messages}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="validation-error__actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="validation-error__button validation-error__button--secondary"
          >
            Cancel
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="validation-error__button validation-error__button--primary"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

ValidationError.propTypes = {
  errors: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  onRetry: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ValidationError;
