import React from 'react';
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

  handleRetry = () => {
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
            backgroundColor: 'var(--surface-color)', 
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            margin: '1rem'
        }}>
          <h2>Something went wrong.</h2>
          <p style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          {/* <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginBottom: '1rem', opacity: 0.7, fontSize: '0.8em' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details> */}
          <Button variant="primary" onClick={this.handleRetry}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
