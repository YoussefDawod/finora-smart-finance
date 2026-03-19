/**
 * @fileoverview Tests für Legal/Public Pages — Content-Rendering
 * @description Testet, ob alle öffentlichen Seiten ihren Titel korrekt rendern.
 *              Back-Button und MiniFooter wurden durch PublicLayout ersetzt.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock Setup ───────────────────────────────────────────

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

describe('Legal/Public Pages — Content Rendering', () => {
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
    it(`${name} — rendert den Seitentitel`, () => {
      render(
        <MemoryRouter>
          <Component />
        </MemoryRouter>
      );
      expect(screen.getByText(titleKey)).toBeInTheDocument();
    });
  });
});
