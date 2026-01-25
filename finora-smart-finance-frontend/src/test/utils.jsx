/* eslint-disable react-refresh/only-export-components */
/**
 * @fileoverview Test Utilities
 * @description Hilfreiche Test-Wrapper und Utilities
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MotionProvider } from '@/context/MotionContext';

/**
 * Erstellt einen frischen QueryClient für Tests
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Wrapper-Komponente mit allen Providern
 */
const AllProviders = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <MotionProvider>
            <ToastProvider>
              <AuthProvider>{children}</AuthProvider>
            </ToastProvider>
          </MotionProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
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
export { customRender as render, renderWithRouter, createTestQueryClient };
