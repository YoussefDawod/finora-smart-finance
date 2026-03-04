/**
 * @fileoverview FeaturesPage Tests
 * @description Seitenspezifische Tests für die Features-Seite (Grid, Karten, Icons)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockFeatures = [
  { title: 'Transaktionen', description: 'Verwalte deine Ein-/Ausgaben' },
  { title: 'Dashboard', description: 'Finanz-Übersicht auf einen Blick' },
  { title: 'Export', description: 'PDF & CSV Export' },
];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'features.items' && opts?.returnObjects) return mockFeatures;
      return key;
    },
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    noticeSeen: true, showNotice: false,
    dismissNotice: vi.fn(), reopenNotice: vi.fn(), closeNotice: vi.fn(),
  }),
}));

import FeaturesPage from '@/pages/FeaturesPage';

describe('FeaturesPage — Feature-Karten', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(<MemoryRouter><FeaturesPage /></MemoryRouter>);

  it('rendert alle Feature-Karten', () => {
    renderPage();
    mockFeatures.forEach((f) => {
      expect(screen.getByText(f.title)).toBeInTheDocument();
      expect(screen.getByText(f.description)).toBeInTheDocument();
    });
  });

  it('rendert korrekte Anzahl Feature-Karten', () => {
    renderPage();
    const titles = mockFeatures.map((f) => screen.getByText(f.title));
    expect(titles).toHaveLength(mockFeatures.length);
  });

  it('rendert Seitentitel und Untertitel', () => {
    renderPage();
    expect(screen.getByText('features.title')).toBeInTheDocument();
    expect(screen.getByText('features.subtitle')).toBeInTheDocument();
  });

  it('rendert MiniFooter', () => {
    renderPage();
    expect(screen.getByText('miniFooter.home')).toBeInTheDocument();
  });

  it('rendert Zurück-Button mit aria-label', () => {
    renderPage();
    expect(screen.getByLabelText('common.back')).toBeInTheDocument();
  });
});
