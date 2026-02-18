/**
 * @fileoverview NotFoundPage Tests
 * @description Tests for 404 page rendering and navigation
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import NotFoundPage from '../NotFoundPage';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'errorPages.notFoundTitle': 'Seite nicht gefunden',
        'errorPages.notFoundSubtitle': 'Die Seite existiert nicht oder wurde verschoben.',
        'errorPages.backToDashboard': 'Zurück zum Dashboard',
      };
      return translations[key] || key;
    },
    i18n: { language: 'de' },
  }),
}));

describe('NotFoundPage', () => {
  const renderPage = () =>
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

  it('renders 404 error code', () => {
    renderPage();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders error title', () => {
    renderPage();
    expect(screen.getByText('Seite nicht gefunden')).toBeInTheDocument();
  });

  it('renders error subtitle', () => {
    renderPage();
    expect(screen.getByText('Die Seite existiert nicht oder wurde verschoben.')).toBeInTheDocument();
  });

  it('renders link back to dashboard', () => {
    renderPage();
    const link = screen.getByText('Zurück zum Dashboard');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('uses errorPages translation keys (not errors)', () => {
    // This test verifies the C7 fix: keys were moved from "errors" to "errorPages"
    renderPage();
    // If keys were still "errors.*", they would show the key string as fallback
    expect(screen.getByText('Seite nicht gefunden')).toBeInTheDocument();
    expect(screen.queryByText('errorPages.notFoundTitle')).not.toBeInTheDocument();
  });
});
