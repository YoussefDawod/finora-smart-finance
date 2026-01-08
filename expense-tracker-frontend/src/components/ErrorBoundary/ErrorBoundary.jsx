/**
 * React Error Boundary component for catching rendering errors.
 */
import { Component } from 'react';
import { Error } from './Error';
import './ErrorBoundary.scss';

/**
 * ErrorBoundary - Catches React rendering errors.
 * Automatically resets on route changes.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const isDev = import.meta.env.DEV;

    // Log error
    if (isDev) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    } else {
      // In production, log to error tracking service (Sentry, etc.)
      this.logErrorToService(error, errorInfo);
    }

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  logErrorToService(error, errorInfo) {
    // TODO: Integrate with Sentry or other error tracking service
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
    console.error('Production error:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Reset error boundary on route change
    if (this.props.location !== prevProps.location) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = () => {
    this.resetError();
    // Optionally trigger a re-render of children
    this.forceUpdate();
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback } = this.props;
    const isDev = import.meta.env.DEV;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback({ error, resetError: this.resetError });
      }

      // Too many errors - might be in error loop
      if (errorCount > 3) {
        return (
          <div className="error-boundary error-boundary--critical">
            <Error
              message="The application encountered repeated errors"
              details="Please refresh the page or contact support if the problem persists."
              onRetry={null}
              onHome={() => (window.location.href = '/')}
            />
          </div>
        );
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <Error
            message={error?.message || 'Something went wrong'}
            details={isDev ? errorInfo?.componentStack : null}
            errorCode={isDev ? error?.name : null}
            onRetry={this.handleRetry}
            onHome={() => (window.location.href = '/')}
            showStack={isDev}
          />
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
