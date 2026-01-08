/**
 * Conflict error display component.
 * Shows data conflict with manual merge options.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ConflictError.scss';

const ConflictError = ({
  localData,
  serverData,
  onUseLocal,
  onUseServer,
  onManualMerge,
  onCancel,
  resource = 'data',
}) => {
  const [selectedVersion, setSelectedVersion] = useState(null);

  const handleUseLocal = () => {
    setSelectedVersion('local');
    onUseLocal?.();
  };

  const handleUseServer = () => {
    setSelectedVersion('server');
    onUseServer?.();
  };

  const renderDataPreview = (data) => {
    if (!data) return null;

    if (typeof data === 'string') {
      return <pre className="conflict-error__preview">{data}</pre>;
    }

    return (
      <pre className="conflict-error__preview">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="conflict-error">
      <div className="conflict-error__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 9l4-4 4 4M16 15l-4 4-4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>

      <h3 className="conflict-error__title">Data Conflict</h3>

      <p className="conflict-error__message">
        The {resource} has been modified by someone else while you were editing.
        Please choose which version to keep.
      </p>

      <div className="conflict-error__versions">
        {/* Local Version */}
        <div
          className={`conflict-error__version ${
            selectedVersion === 'local' ? 'conflict-error__version--selected' : ''
          }`}
        >
          <div className="conflict-error__version-header">
            <h4 className="conflict-error__version-title">Your Version</h4>
            <span className="conflict-error__version-badge conflict-error__version-badge--local">
              Local
            </span>
          </div>

          {localData && (
            <div className="conflict-error__version-content">
              {renderDataPreview(localData)}
            </div>
          )}

          <button
            type="button"
            onClick={handleUseLocal}
            className="conflict-error__version-button"
          >
            Use Your Version
          </button>
        </div>

        {/* Server Version */}
        <div
          className={`conflict-error__version ${
            selectedVersion === 'server' ? 'conflict-error__version--selected' : ''
          }`}
        >
          <div className="conflict-error__version-header">
            <h4 className="conflict-error__version-title">Server Version</h4>
            <span className="conflict-error__version-badge conflict-error__version-badge--server">
              Remote
            </span>
          </div>

          {serverData && (
            <div className="conflict-error__version-content">
              {renderDataPreview(serverData)}
            </div>
          )}

          <button
            type="button"
            onClick={handleUseServer}
            className="conflict-error__version-button"
          >
            Use Server Version
          </button>
        </div>
      </div>

      <div className="conflict-error__actions">
        {onManualMerge && (
          <button
            type="button"
            onClick={onManualMerge}
            className="conflict-error__button conflict-error__button--primary"
          >
            <svg
              className="conflict-error__button-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3v18M3 12h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Merge Manually
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="conflict-error__button conflict-error__button--secondary"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="conflict-error__help">
        <p className="conflict-error__help-text">
          <strong>Tip:</strong> Choose "Merge Manually" to combine both versions,
          or select one version to discard the other.
        </p>
      </div>
    </div>
  );
};

ConflictError.propTypes = {
  localData: PropTypes.any,
  serverData: PropTypes.any,
  onUseLocal: PropTypes.func,
  onUseServer: PropTypes.func,
  onManualMerge: PropTypes.func,
  onCancel: PropTypes.func,
  resource: PropTypes.string,
};

export default ConflictError;
