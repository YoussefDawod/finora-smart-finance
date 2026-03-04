/**
 * @fileoverview Tests für MiniFooter Component
 * @description Testet Link-Rendering, Navigation und Accessibility.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MiniFooter from '../MiniFooter';

// ── Mocks ────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

// ── Helpers ──────────────────────────────────────────────

const renderMiniFooter = () => {
  return render(
    <MemoryRouter>
      <MiniFooter />
    </MemoryRouter>,
  );
};

// ── Tests ────────────────────────────────────────────────

describe('MiniFooter', () => {
  it('rendert als nav-Element', () => {
    renderMiniFooter();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('hat korrektes aria-label', () => {
    renderMiniFooter();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'miniFooter.ariaLabel');
  });

  it('rendert den Startseite-Link', () => {
    renderMiniFooter();
    const homeLink = screen.getByText('miniFooter.home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('rendert den Impressum-Link', () => {
    renderMiniFooter();
    const link = screen.getByText('footer.impressum');
    expect(link.closest('a')).toHaveAttribute('href', '/impressum');
  });

  it('rendert den Datenschutz-Link', () => {
    renderMiniFooter();
    const link = screen.getByText('footer.privacy');
    expect(link.closest('a')).toHaveAttribute('href', '/privacy');
  });

  it('rendert den AGB-Link', () => {
    renderMiniFooter();
    const link = screen.getByText('footer.terms');
    expect(link.closest('a')).toHaveAttribute('href', '/terms');
  });

  it('rendert genau 4 Links', () => {
    renderMiniFooter();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('rendert Trenner-Punkte mit aria-hidden', () => {
    const { container } = renderMiniFooter();
    const dividers = container.querySelectorAll('[aria-hidden="true"]');
    expect(dividers).toHaveLength(3);
    dividers.forEach((divider) => {
      expect(divider.textContent).toBe('·');
    });
  });
});
