/* eslint-disable react-refresh/only-export-components */
/**
 * @fileoverview Test Utilities
 * @description Hilfreiche Test-Wrapper und Utilities
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MotionProvider } from '@/context/MotionContext';

/**
 * Wrapper-Komponente mit allen Providern
 */
const AllProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MotionProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </MotionProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

/**
 * Custom render mit allen Providern
 * @param {React.ReactElement} ui - Komponente zum Rendern
 * @param {Object} options - Render-Optionen
 */
const customRender = (ui, options = {}) => {
  return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Render mit nur Router (für einfache Komponenten)
 */
const renderWithRouter = (ui, options = {}) => {
  return render(ui, { wrapper: BrowserRouter, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render, renderWithRouter };
