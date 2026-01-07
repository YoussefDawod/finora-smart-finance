import { Component } from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.scss';

/**
 * ErrorBoundary - Globale Fehlergrenze für React-Komponenten
 * Fängt Rendering-Fehler und zeigt Fallback-UI
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log zu Error Tracking Service (Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In Produktion: zu External Service senden
    console.error('ErrorBoundary caught:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Hier könnte Sentry Integration stehen:
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Optional: Reload Page
    if (this.props.resetOnError) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom Fallback UI
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.handleReset)
      ) : (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon" role="img" aria-label="Fehler">
              ⚠️
            </div>
            <h1 className="error-boundary__title">Oops! Etwas ist schiefgelaufen</h1>
            <p className="error-boundary__message">
              Die Anwendung ist auf einen unerwarteten Fehler gestoßen.
              Wir wurden automatisch benachrichtigt und arbeiten an einer Lösung.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary>Fehlerdetails (nur in Development)</summary>
                <pre className="error-boundary__stack">
                  <strong>Fehler:</strong>
                  {'\n'}
                  {this.state.error.toString()}
                  {'\n\n'}
                  <strong>Component Stack:</strong>
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary__actions">
              <button onClick={this.handleReset} className="btn btn--primary" aria-label="Anwendung neu laden">
                🔄 Erneut versuchen
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="btn btn--secondary"
                aria-label="Zur Startseite"
              >
                🏠 Zur Startseite
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  resetOnError: PropTypes.bool,
};

ErrorBoundary.defaultProps = {
  fallback: null,
  resetOnError: false,
};

export default ErrorBoundary;
