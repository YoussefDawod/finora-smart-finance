import React from 'react';
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
    t: key => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

const MOTION_PROPS = new Set([
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileInView',
  'whileDrag',
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'layout',
  'layoutId',
]);

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'create') return Component => Component;
        return ({ children, ...props }) => {
          const htmlProps = Object.fromEntries(
            Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key))
          );
          const Tag = typeof prop === 'string' ? prop : 'div';
          return React.createElement(Tag, htmlProps, children);
        };
      },
    }
  );
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

  it('rendert nichts bei visible=false', () => {
    render(<BackToTop visible={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('rendert Button bei visible=true', () => {
    render(<BackToTop visible={true} />);
    const button = screen.getByRole('button', { name: 'footer.backToTop' });
    expect(button).toBeInTheDocument();
  });

  it('Button hat aria-label', () => {
    render(<BackToTop visible={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'footer.backToTop');
  });

  it('Button hat title', () => {
    render(<BackToTop visible={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'footer.backToTop');
  });

  it('Klick ruft window.scrollTo auf', () => {
    render(<BackToTop visible={true} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  describe('shouldAnimate Guard', () => {
    it('rendert korrekt wenn shouldAnimate=false', () => {
      mockShouldAnimate = false;
      render(<BackToTop visible={true} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('rendert korrekt wenn shouldAnimate=true', () => {
      mockShouldAnimate = true;
      render(<BackToTop visible={true} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
