/**
 * @fileoverview PricingPage Tests
 * @description Seitenspezifische Tests für die Pricing-Seite (Karten, Popular-Badge, CTA-Links)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockPlans = [
  {
    name: 'Gastmodus',
    price: 'Kostenlos',
    description: 'Schnell starten ohne Registrierung',
    features: ['Lokale Speicherung', 'Dashboard'],
    extraFeatures: [],
    cta: 'Jetzt starten',
  },
  {
    name: 'Vollzugang',
    price: 'Kostenlos',
    description: 'Alle Features mit Cloud-Sync',
    features: ['Cloud-Sync', 'Export'],
    extraFeatures: ['Newsletter', 'Budget-Alerts'],
    cta: 'Registrieren',
  },
];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'pricing.plans' && opts?.returnObjects) return mockPlans;
      return key;
    },
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    noticeSeen: true,
    showNotice: false,
    dismissNotice: vi.fn(),
    reopenNotice: vi.fn(),
    closeNotice: vi.fn(),
  }),
}));

import PricingPage from '@/pages/PricingPage';

describe('PricingPage — Pricing-Karten', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <PricingPage />
      </MemoryRouter>
    );

  it('rendert zwei Pricing-Karten', () => {
    renderPage();
    expect(screen.getByText('Gastmodus')).toBeInTheDocument();
    expect(screen.getByText('Vollzugang')).toBeInTheDocument();
  });

  it('zeigt Popular-Badge auf der zweiten Karte', () => {
    renderPage();
    expect(screen.getByText('pricing.popular')).toBeInTheDocument();
  });

  it('rendert Features als Liste', () => {
    renderPage();
    expect(screen.getByText('Lokale Speicherung')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cloud-Sync')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('CTA-Links: Gastmodus → /dashboard, Vollzugang → /register', () => {
    renderPage();
    const links = screen.getAllByRole('link');
    const guestLink = links.find(l => l.textContent === 'Jetzt starten');
    const fullLink = links.find(l => l.textContent === 'Registrieren');

    expect(guestLink).toHaveAttribute('href', '/dashboard');
    expect(fullLink).toHaveAttribute('href', '/register');
  });

  it('zeigt Show-More-Button nur bei Karte mit extraFeatures', () => {
    renderPage();
    // Plan 0 hat leere extraFeatures → kein Button
    // Plan 1 hat extraFeatures → Button sichtbar
    const showMoreButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.textContent.includes('pricing.showMore'));
    expect(showMoreButtons).toHaveLength(1);
  });

  it('klappt extraFeatures auf bei Klick auf Show-More', () => {
    renderPage();
    expect(screen.queryByText('Newsletter')).not.toBeInTheDocument();
    expect(screen.queryByText('Budget-Alerts')).not.toBeInTheDocument();

    const showMoreBtn = screen.getByText('pricing.showMore').closest('button');
    fireEvent.click(showMoreBtn);

    expect(screen.getByText('Newsletter')).toBeInTheDocument();
    expect(screen.getByText('Budget-Alerts')).toBeInTheDocument();
  });

  it('rendert Seitentitel', () => {
    renderPage();
    expect(screen.getByText('pricing.title')).toBeInTheDocument();
  });
});
