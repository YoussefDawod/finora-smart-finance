/**
 * Generic error component with customizable actions.
 */
import './Error.scss';

/**
 * Error - Generic error display component.
 * @param {Object} props
 * @param {string} props.message - User-friendly error message
 * @param {string} props.details - Additional error details
 * @param {string} props.errorCode - Error code/type
 * @param {Function} props.onRetry - Retry callback
 * @param {Function} props.onHome - Go home callback
 * @param {Function} props.onSupport - Contact support callback
 * @param {boolean} props.showStack - Show stack trace (dev only)
 * @param {string} props.incidentId - Incident tracking ID
 * @returns {JSX.Element}
 */
export function Error({
  message = 'Something went wrong',
  details,
  errorCode,
  onRetry,
  onHome,
  onSupport,
  showStack = false,
  incidentId,
}) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="error" role="alert">
      <div className="error__icon">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 className="error__title">Error</h2>

      <p className="error__message">{message}</p>

      {details && <p className="error__details">{details}</p>}

      {isDev && errorCode && (
        <div className="error__code">
          <strong>Error Code:</strong> {errorCode}
        </div>
      )}

      {incidentId && (
        <div className="error__incident">
          <strong>Incident ID:</strong> {incidentId}
        </div>
      )}

      {showStack && isDev && details && (
        <details className="error__stack">
          <summary>Stack Trace</summary>
          <pre>{details}</pre>
        </details>
      )}

      <div className="error__actions">
        {onRetry && (
          <button className="error__button error__button--primary" onClick={onRetry}>
            Try Again
          </button>
        )}

        {onHome && (
          <button className="error__button error__button--secondary" onClick={onHome}>
            Go Home
          </button>
        )}

        {onSupport && (
          <button className="error__button error__button--secondary" onClick={onSupport}>
            Contact Support
          </button>
        )}
      </div>
    </div>
  );
}

export default Error;
