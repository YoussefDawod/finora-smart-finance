/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@styles/index.scss';
import { initAccessibility } from '@/utils/keyboardNavigation';
import './i18n';

// Initialize accessibility features
initAccessibility();

// Loading-Fallback für i18n - Skeleton statt Spinner
const I18nLoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    gap: '24px',
    background: 'var(--background, #f5f5f5)',
    padding: '48px',
  }}>
    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Logo Skeleton */}
      <div style={{
        width: '120px',
        height: '40px',
        background: 'linear-gradient(90deg, var(--surface-2, #e0e0e0) 0%, var(--surface, #f0f0f0) 50%, var(--surface-2, #e0e0e0) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '12px',
      }} />
      {/* Content Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          width: '100%',
          height: '48px',
          background: 'linear-gradient(90deg, var(--surface-2, #e0e0e0) 0%, var(--surface, #f0f0f0) 50%, var(--surface-2, #e0e0e0) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '12px',
        }} />
      ))}
    </div>
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<I18nLoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
