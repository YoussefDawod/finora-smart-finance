import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const mockAuth = { isAuthenticated: false, isLoading: false };
vi.mock('@/hooks', () => ({
  useAuth: () => mockAuth,
  useMotion: () => ({ shouldAnimate: false }),
  useIsDesktop: () => true,
}));

vi.mock('@/components/auth', () => ({
  LoginForm: () => <div data-testid="login-form" />,
  MultiStepRegisterForm: () => <div data-testid="register-form" />,
  ForgotPasswordRequestForm: () => <div data-testid="forgot-form" />,
  ResetPasswordForm: ({ token }) => <div data-testid="reset-form">{token}</div>,
  BrandingPanel: ({ mode }) => <div data-testid="branding-panel">{mode}</div>,
}));

vi.mock('@/components/common/Skeleton', () => ({
  AuthPageSkeleton: () => <div data-testid="auth-skeleton" />,
}));

import AuthPage from '../../../pages/AuthPage/AuthPage';

// ============================================
// HELPERS
// ============================================

const renderPage = (path = '/login') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthPage />
    </MemoryRouter>
  );

// ============================================
// TESTS
// ============================================

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAuthenticated = false;
    mockAuth.isLoading = false;
  });

  it('/login rendert LoginForm', () => {
    renderPage('/login');
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('/register rendert MultiStepRegisterForm', () => {
    renderPage('/register');
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('/forgot-password rendert ForgotPasswordRequestForm', () => {
    renderPage('/forgot-password');
    expect(screen.getByTestId('forgot-form')).toBeInTheDocument();
  });

  it('/forgot-password?token=xyz rendert ResetPasswordForm', () => {
    renderPage('/forgot-password?token=xyz');
    expect(screen.getByTestId('reset-form')).toBeInTheDocument();
    expect(screen.getByTestId('reset-form')).toHaveTextContent('xyz');
  });

  it('rendert BrandingPanel mit korrektem mode', () => {
    renderPage('/login');
    expect(screen.getByTestId('branding-panel')).toHaveTextContent('login');
  });

  it('BrandingPanel mode=register bei /register', () => {
    renderPage('/register');
    expect(screen.getByTestId('branding-panel')).toHaveTextContent('register');
  });

  it('BrandingPanel mode=forgot bei /forgot-password', () => {
    renderPage('/forgot-password');
    expect(screen.getByTestId('branding-panel')).toHaveTextContent('forgot');
  });

  it('zeigt Skeleton bei isLoading=true', () => {
    mockAuth.isLoading = true;
    renderPage('/login');
    expect(screen.getByTestId('auth-skeleton')).toBeInTheDocument();
  });
});
