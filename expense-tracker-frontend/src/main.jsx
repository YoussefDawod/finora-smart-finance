import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { setupAuthInterceptor } from './api/authInterceptor';
import App from './App.jsx';
import { initPerformanceMonitoring, generatePerformanceReport } from './utils/performance.js';

// Init APIs
setupAuthInterceptor();

// Performance Monitoring in Production starten
if (import.meta.env.PROD) {
  initPerformanceMonitoring();

  // Performance Report nach 5 Sekunden
  setTimeout(() => {
    generatePerformanceReport();
  }, 5000);
}

// Development: Performance Warnings
if (import.meta.env.DEV) {
  console.log('🔧 Development Mode - Performance Monitoring aktiv');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider maxToasts={5}>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
