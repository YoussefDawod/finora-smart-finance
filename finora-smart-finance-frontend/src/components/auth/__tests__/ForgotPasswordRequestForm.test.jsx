import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================
// MOCKS
// ============================================

const mockForgotPassword = vi.fn().mockResolvedValue({});
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

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
  motion: { div: m('div'), span: m('span') },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key),
    i18n: { dir: () => 'ltr', language: 'de' },
  }),
}));

vi.mock('@/hooks', () => ({
  useAuth: () => ({ forgotPassword: mockForgotPassword }),
  useToast: () => mockToast,
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('@/api/errorHandler', () => ({
  parseApiError: e => ({ message: e?.response?.data?.message || 'error' }),
}));

import ForgotPasswordRequestForm from '../ForgotPasswordRequestForm/ForgotPasswordRequestForm';

// ============================================
// HELPERS
// ============================================

const renderForm = () =>
  render(
    <MemoryRouter>
      <ForgotPasswordRequestForm />
    </MemoryRouter>
  );

// ============================================
// TESTS
// ============================================

describe('ForgotPasswordRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendert Email-Input und Submit-Button', () => {
    renderForm();
    expect(screen.getByPlaceholderText('auth.forgot.emailPlaceholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auth\.forgot\.submit/ })).toBeInTheDocument();
  });

  it('zeigt Validierungsfehler bei leerem Email auf Blur', async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByPlaceholderText('auth.forgot.emailPlaceholder');
    await user.click(input);
    await user.tab();

    expect(screen.getByText('auth.forgot.validation.emailRequired')).toBeInTheDocument();
  });

  it('zeigt Fehler bei ungültiger Email', async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByPlaceholderText('auth.forgot.emailPlaceholder');
    await user.type(input, 'invalid');
    await user.tab();

    expect(screen.getByText('auth.forgot.validation.emailInvalid')).toBeInTheDocument();
  });

  it('Submit-Button disabled bei leerem Feld', () => {
    renderForm();
    const btn = screen.getByRole('button', { name: /auth\.forgot\.submit/ });
    expect(btn).toBeDisabled();
  });

  it('ruft forgotPassword auf bei gültiger Email', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByPlaceholderText('auth.forgot.emailPlaceholder'),
      'test@example.com'
    );
    await user.click(screen.getByRole('button', { name: /auth\.forgot\.submit/ }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('zeigt Erfolgs-State nach erfolgreichem Submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByPlaceholderText('auth.forgot.emailPlaceholder'),
      'test@example.com'
    );
    await user.click(screen.getByRole('button', { name: /auth\.forgot\.submit/ }));

    await waitFor(() => {
      expect(screen.getByText('auth.forgot.successTitle')).toBeInTheDocument();
    });
  });

  it('zeigt API-Fehler via parseApiError', async () => {
    mockForgotPassword.mockRejectedValueOnce({
      response: { data: { message: 'User not found' } },
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByPlaceholderText('auth.forgot.emailPlaceholder'),
      'test@example.com'
    );
    await user.click(screen.getByRole('button', { name: /auth\.forgot\.submit/ }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });
});
