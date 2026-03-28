/**
 * @fileoverview AdminErrorBoundary Component
 * @description React Error Boundary für den Admin-Bereich.
 *              Fängt unbehandelte Rendering-Fehler ab und zeigt
 *              eine nutzerfreundliche Fehlermeldung mit Retry-Button.
 *
 * @module components/admin/AdminErrorBoundary
 */

import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import styles from './AdminErrorBoundary.module.scss';

/**
 * AdminErrorBoundary
 *
 * React Class Component (Error Boundaries erfordern getDerivedStateFromError).
 * Fängt Render-Fehler in Kind-Komponenten ab und zeigt Fallback-UI.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Function} [props.t] - i18n translate function
 */
class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Optional: Fehler an Error-Reporting senden
    console.error('[AdminErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  handleToggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, showDetails } = this.state;
    const { children, t } = this.props;

    if (!hasError) {
      return children;
    }

    // Fallback-Texte (falls t nicht vorhanden)
    const title = t?.('admin.errorBoundary.title') || 'Etwas ist schiefgelaufen';
    const message =
      t?.('admin.errorBoundary.message') ||
      'Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
    const retryLabel = t?.('admin.errorBoundary.retry') || 'Erneut versuchen';
    const detailsLabel = t?.('admin.errorBoundary.details') || 'Technische Details';

    return (
      <div className={styles.errorBoundary} role="alert">
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>
            <FiAlertTriangle size={48} />
          </div>
          <h2 className={styles.errorTitle}>{title}</h2>
          <p className={styles.errorMessage}>{message}</p>
          <button className={styles.retryButton} onClick={this.handleRetry} type="button">
            <FiRefreshCw size={16} />
            {retryLabel}
          </button>
          {error && (
            <div className={styles.detailsSection}>
              <button
                className={styles.detailsToggle}
                onClick={this.handleToggleDetails}
                type="button"
                aria-expanded={showDetails}
              >
                {detailsLabel}
              </button>
              {showDetails && (
                <pre className={styles.errorDetails}>{error.message || String(error)}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default AdminErrorBoundary;
