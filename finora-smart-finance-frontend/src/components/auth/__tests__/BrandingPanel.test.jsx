import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ============================================
// MOCKS
// ============================================

const MOTION_KEYS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'layout',
  'custom',
]);
function m(Tag) {
  function MotionMock({ children, ...props }) {
    const domProps = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_KEYS.has(k)));
    return <Tag {...domProps}>{children}</Tag>;
  }
  MotionMock.displayName = `motion.${Tag}`;
  return MotionMock;
}

vi.mock('framer-motion', () => ({
  motion: { div: m('div') },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { dir: () => 'ltr', language: 'de' },
  }),
}));

vi.mock('@/hooks', () => ({
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('@/components/common', () => ({
  BrandingBackground: () => <div data-testid="branding-bg" />,
}));

import BrandingPanel from '../BrandingPanel/BrandingPanel';

// ============================================
// HELPERS
// ============================================

const renderPanel = (mode = 'login', isDesktop = true) =>
  render(
    <MemoryRouter>
      <BrandingPanel mode={mode} isDesktop={isDesktop} />
    </MemoryRouter>
  );

// ============================================
// TESTS
// ============================================

describe('BrandingPanel', () => {
  it('rendert Logo und Badge', () => {
    renderPanel();
    expect(screen.getByAltText('Finora')).toBeInTheDocument();
    expect(screen.getByText('auth.branding.badge')).toBeInTheDocument();
  });

  it('rendert Tagline über i18n', () => {
    renderPanel();
    expect(screen.getByText('auth.branding.tagline')).toBeInTheDocument();
  });

  it('rendert BrandingBackground', () => {
    renderPanel();
    expect(screen.getByTestId('branding-bg')).toBeInTheDocument();
  });

  it('Login-Mode: zeigt Login-Headline und CTA zu /register', () => {
    renderPanel('login');
    expect(screen.getByText('auth.branding.login.headline')).toBeInTheDocument();
    expect(screen.getByText('auth.branding.login.cta')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/register');
  });

  it('Register-Mode: zeigt Register-Headline und CTA zu /login', () => {
    renderPanel('register');
    expect(screen.getByText('auth.branding.register.headline')).toBeInTheDocument();
    expect(screen.getByText('auth.branding.register.cta')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/login');
  });

  it('Forgot-Mode: zeigt Forgot-Headline und CTA zu /login', () => {
    renderPanel('forgot');
    expect(screen.getByText('auth.branding.forgot.headline')).toBeInTheDocument();
    expect(screen.getByText('auth.branding.forgot.cta')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/login');
  });

  it('Verify-Mode: zeigt Verify-Headline und CTA zu /login', () => {
    renderPanel('verify');
    expect(screen.getByText('auth.branding.verify.headline')).toBeInTheDocument();
    expect(screen.getByText('auth.branding.verify.cta')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/login');
  });

  it('rendert Footer', () => {
    renderPanel();
    expect(screen.getByText('auth.branding.footer')).toBeInTheDocument();
  });
});
