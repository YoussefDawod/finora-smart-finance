/**
 * @fileoverview Tests für Legal/Public Pages — navigate-Fallback
 * @description Testet handleBack mit history.length > 1 und leerer History,
 *              sowie Content-Rendering und MiniFooter-Integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock Setup ───────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts?.returnObjects) return [];
      return key;
    },
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
  Trans: ({ i18nKey }) => <span>{i18nKey}</span>,
}));

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: false }),
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

// ── Page Imports ─────────────────────────────────────────

import ImpressumPage from '@/pages/ImpressumPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import AboutPage from '@/pages/AboutPage';
import BlogPage from '@/pages/BlogPage';
import HelpPage from '@/pages/HelpPage';
import FaqPage from '@/pages/FaqPage';
import FeaturesPage from '@/pages/FeaturesPage';
import PricingPage from '@/pages/PricingPage';

// ── Tests ────────────────────────────────────────────────

describe('Legal/Public Pages — navigate Fallback', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // Generische Tests für alle Seiten
  const pages = [
    { name: 'ImpressumPage', Component: ImpressumPage, titleKey: 'impressum.title' },
    { name: 'TermsPage', Component: TermsPage, titleKey: 'terms.title' },
    { name: 'PrivacyPage', Component: PrivacyPage, titleKey: 'privacy.title' },
    { name: 'AboutPage', Component: AboutPage, titleKey: 'about.title' },
    { name: 'BlogPage', Component: BlogPage, titleKey: 'blog.title' },
    { name: 'HelpPage', Component: HelpPage, titleKey: 'help.title' },
    { name: 'FaqPage', Component: FaqPage, titleKey: 'faq.title' },
    { name: 'FeaturesPage', Component: FeaturesPage, titleKey: 'features.title' },
    { name: 'PricingPage', Component: PricingPage, titleKey: 'pricing.title' },
  ];

  pages.forEach(({ name, Component, titleKey }) => {
    describe(name, () => {
      it('rendert den Seitentitel', () => {
        render(
          <MemoryRouter>
            <Component />
          </MemoryRouter>,
        );
        expect(screen.getByText(titleKey)).toBeInTheDocument();
      });

      it('rendert den Zurück-Button mit aria-label', () => {
        render(
          <MemoryRouter>
            <Component />
          </MemoryRouter>,
        );
        const backButton = screen.getByLabelText('common.back');
        expect(backButton).toBeInTheDocument();
      });

      it('navigiert zu "/" wenn history leer (history.length <= 1)', () => {
        // window.history.length ist normalerweise >= 1
        Object.defineProperty(window, 'history', {
          writable: true,
          value: { length: 1 },
        });

        render(
          <MemoryRouter>
            <Component />
          </MemoryRouter>,
        );

        fireEvent.click(screen.getByLabelText('common.back'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });

      it('navigiert mit navigate(-1) wenn History vorhanden', () => {
        Object.defineProperty(window, 'history', {
          writable: true,
          value: { length: 5 },
        });

        render(
          <MemoryRouter>
            <Component />
          </MemoryRouter>,
        );

        fireEvent.click(screen.getByLabelText('common.back'));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
      });

      it('rendert MiniFooter', () => {
        render(
          <MemoryRouter>
            <Component />
          </MemoryRouter>,
        );
        // MiniFooter rendert Links wie miniFooter.home
        expect(screen.getByText('miniFooter.home')).toBeInTheDocument();
      });
    });
  });
});
