import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './context/ToastContext';
import { MotionProvider } from './context/MotionContext';
import { ThemeProvider } from './context/ThemeContext';
import { setupAuthInterceptor } from './api/authInterceptor';
import '@fontsource/plus-jakarta-sans/index.css';
import AppRoutes from './AppRoutes';
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
    <ThemeProvider>
      <MotionProvider>
        <ToastProvider maxToasts={5}>
          <AppRoutes />
        </ToastProvider>
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>
);

