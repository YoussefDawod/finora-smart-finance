import React from 'react';
import i18n from '@/i18n';
import Button from '@/components/common/Button/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  /**
   * Detect chunk / dynamic-import loading errors.
   * These occur after deployments or network issues when the browser
   * tries to fetch a JS chunk that no longer exists.
   */
  isChunkLoadError = () => {
    const msg = this.state.error?.message || '';
    return (
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk')
    );
  };

  handleRetry = () => {
    // Chunk-load errors cannot be recovered by resetting state
    // because React lazy() caches the rejected promise.
    // A full page reload is required.
    if (this.isChunkLoadError()) {
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optional: reload the page or trigger a re-fetch if a function is passed
    if (this.props.onRetry) {
        this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      
      return (
        <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            backgroundColor: 'var(--surface)', 
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            margin: '1rem'
        }}>
          <h2>{i18n.t('common.errors.somethingWrong')}</h2>
          <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          {/* <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginBottom: '1rem', opacity: 0.7, fontSize: '0.8em' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details> */}
          <Button variant="primary" onClick={this.handleRetry}>
            {i18n.t('common.retry')}
          </Button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
