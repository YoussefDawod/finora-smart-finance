/**
 * Async error boundary for handling promise rejections.
 */
import { Component } from 'react';
import { Error } from './Error';
import './AsyncErrorBoundary.scss';

/**
 * AsyncErrorBoundary - Catches async errors (promise rejections).
 */
export class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  handlePromiseRejection = (event) => {
    const isDev = import.meta.env.DEV;

    // Log error
    if (isDev) {
      console.error('AsyncErrorBoundary caught a promise rejection:', event.reason);
    } else {
      this.logErrorToService(event.reason);
    }

    this.setState({
      hasError: true,
      error: event.reason,
    });

    // Prevent default browser error handling
    event.preventDefault();
  };

  logErrorToService(error) {
    // TODO: Integrate with error tracking service
    console.error('Production async error:', error);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;
    const isDev = import.meta.env.DEV;

    if (hasError) {
      if (fallback) {
        return fallback({ error, resetError: this.resetError });
      }

      return (
        <div className="async-error-boundary">
          <Error
            message={error?.message || 'An async operation failed'}
            details={isDev ? error?.stack : null}
            onRetry={this.resetError}
            onHome={() => (window.location.href = '/')}
            showStack={isDev}
          />
        </div>
      );
    }

    return children;
  }
}

export default AsyncErrorBoundary;
