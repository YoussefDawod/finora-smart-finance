/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@styles/index.scss';
import { initAccessibility } from '@/utils/keyboardNavigation';
import './i18n';

// Initialize accessibility features
initAccessibility();

// Loading-Fallback für i18n
const I18nLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'var(--background, #f5f5f5)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--border, #e0e0e0)',
        borderTopColor: 'var(--primary, #6366f1)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<I18nLoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
