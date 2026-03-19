import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MiniFooter from '../MiniFooter';

// ── Mocks ────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

const MOTION_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'variants',
  'transition',
  'layout',
]);

vi.mock('framer-motion', () => {
  const handler = {
    get(_, tag) {
      if (tag === '__esModule') return true;
      const Comp = React.forwardRef((props, ref) => {
        const filtered = {};
        Object.keys(props).forEach(k => {
          if (
            (!MOTION_PROPS.has(k) && !k.startsWith('on')) ||
            k === 'onClick' ||
            k === 'onChange' ||
            k === 'onSubmit'
          ) {
            filtered[k] = props[k];
          }
        });
        return React.createElement(tag, { ...filtered, ref });
      });
      Comp.displayName = `motion.${String(tag)}`;
      return Comp;
    },
  };
  return {
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }) => children,
  };
});

// ── Helper ───────────────────────────────────────────────

const renderMiniFooter = () =>
  render(
    <MemoryRouter>
      <MiniFooter />
    </MemoryRouter>
  );

// ── Tests ────────────────────────────────────────────────

describe('MiniFooter', () => {
  it('rendert ein <nav>-Element mit aria-label', () => {
    renderMiniFooter();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'miniFooter.ariaLabel');
  });

  it('rendert Home-Link zum Dashboard', () => {
    renderMiniFooter();
    const link = screen.getByText('miniFooter.home');
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('rendert Impressum-Link', () => {
    renderMiniFooter();
    const link = screen.getByText('footer.impressum');
    expect(link.closest('a')).toHaveAttribute('href', '/impressum');
  });

  it('rendert Datenschutz-Link', () => {
    renderMiniFooter();
    const link = screen.getByText('footer.privacy');
    expect(link.closest('a')).toHaveAttribute('href', '/privacy');
  });

  it('rendert AGB-Link', () => {
    renderMiniFooter();
    const link = screen.getByText('footer.terms');
    expect(link.closest('a')).toHaveAttribute('href', '/terms');
  });

  it('rendert Trennzeichen mit aria-hidden', () => {
    renderMiniFooter();
    const dividers = document.querySelectorAll('[aria-hidden="true"]');
    expect(dividers.length).toBeGreaterThanOrEqual(3);
  });
});
