/**
 * Error fallback component for error states.
 */
import './ErrorFallback.scss';

/**
 * ErrorFallback - Error UI with retry option.
 * @param {Object} props
 * @param {Error} props.error - Error object
 * @param {Function} props.onRetry - Retry callback
 * @param {boolean} props.showSupportLink - Show support link (default: false)
 * @param {string} props.supportUrl - Support ticket URL
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ErrorFallback({
  error,
  onRetry,
  showSupportLink = false,
  supportUrl = '/support',
  className = '',
}) {
  return (
    <div className={`error-fallback ${className}`} role="alert">
      <div className="error-fallback__icon">
        <svg
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
      </div>

      <h3 className="error-fallback__title">Something went wrong</h3>

      {error?.message && (
        <p className="error-fallback__message">{error.message}</p>
      )}

      <div className="error-fallback__actions">
        {onRetry && (
          <button
            className="error-fallback__retry"
            onClick={onRetry}
            aria-label="Retry"
          >
            Try Again
          </button>
        )}

        {showSupportLink && (
          <a
            href={supportUrl}
            className="error-fallback__support"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Support
          </a>
        )}
      </div>
    </div>
  );
}

export default ErrorFallback;
