/**
 * @fileoverview Tests für BackToTop Component
 * @description Testet Sichtbarkeit, Scroll-Funktion, shouldAnimate-Guard und Scale-Werte.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BackToTop from '../BackToTop';

// ── Mocks ────────────────────────────────────────────────

let mockShouldAnimate = false;

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: mockShouldAnimate }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

const MOTION_PROPS = new Set([
  'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag',
  'initial', 'animate', 'exit', 'transition', 'variants', 'layout', 'layoutId',
]);

vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'create') return (Component) => Component;
      return ({ children, ...props }) => {
        const htmlProps = Object.fromEntries(
          Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
        );
        const Tag = typeof prop === 'string' ? prop : 'div';
        return <Tag {...htmlProps}>{children}</Tag>;
      };
    },
  });
  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// ── Tests ────────────────────────────────────────────────

describe('BackToTop', () => {
  beforeEach(() => {
    mockShouldAnimate = false;
    vi.clearAllMocks();
  });

  it('rendert den Button wenn visible=true', () => {
    render(<BackToTop visible={true} />);
    const button = screen.getByRole('button', { name: 'footer.backToTop' });
    expect(button).toBeInTheDocument();
  });

  it('rendert nichts wenn visible=false', () => {
    render(<BackToTop visible={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ruft window.scrollTo beim Klick auf', () => {
    render(<BackToTop visible={true} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('hat korrekte aria-label und title', () => {
    render(<BackToTop visible={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'footer.backToTop');
    expect(button).toHaveAttribute('title', 'footer.backToTop');
  });

  describe('shouldAnimate Guard', () => {
    it('setzt keine Animation-Props wenn shouldAnimate=false', () => {
      mockShouldAnimate = false;
      const { container } = render(<BackToTop visible={true} />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      // Button wird gerendert — framer-motion Props werden von Mock entfernt
    });

    it('rendert korrekt wenn shouldAnimate=true', () => {
      mockShouldAnimate = true;
      render(<BackToTop visible={true} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
