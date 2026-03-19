import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================
// MOCKS
// ============================================

const mockResetPassword = vi.fn().mockResolvedValue({});
const mockNavigate = vi.fn();
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
    t: key => key,
    i18n: { dir: () => 'ltr', language: 'de' },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks', () => ({
  useAuth: () => ({ resetPassword: mockResetPassword }),
  useToast: () => mockToast,
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('@/validators', () => ({
  calculatePasswordStrength: () => ({ level: 'strong', score: 80 }),
  validatePassword: pw => (!pw ? 'required' : ''),
  validatePasswordMatch: (pw, confirm) => {
    if (!confirm) return 'confirmRequired';
    if (pw !== confirm) return 'mismatch';
    return '';
  },
}));

vi.mock('../PasswordInput/PasswordInput', () => ({
  default: ({ id, name, value, onChange, onBlur, placeholder, disabled }) => (
    <input
      id={id}
      name={name}
      type="password"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
    />
  ),
}));

vi.mock('../ErrorBanner/ErrorBanner', () => ({
  default: ({ error }) => (error ? <div role="alert">{error}</div> : null),
}));

import ResetPasswordForm from '../ResetPasswordForm/ResetPasswordForm';

// ============================================
// HELPERS
// ============================================

const renderForm = (token = 'test-token') =>
  render(
    <MemoryRouter>
      <ResetPasswordForm token={token} />
    </MemoryRouter>
  );

// ============================================
// TESTS
// ============================================

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rendert Passwort- und Bestätigungs-Felder', () => {
    renderForm();
    expect(screen.getByPlaceholderText('auth.reset.passwordPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.reset.confirmPlaceholder')).toBeInTheDocument();
  });

  it('Submit-Button disabled wenn Felder leer', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /auth\.reset\.submit/ })).toBeDisabled();
  });

  it('zeigt Validierungsfehler bei leerem Passwort-Blur', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForm();

    const pw = screen.getByPlaceholderText('auth.reset.passwordPlaceholder');
    await user.click(pw);
    await user.tab();

    expect(screen.getByText('auth.reset.validation.passwordRequired')).toBeInTheDocument();
  });

  it('zeigt Mismatch-Fehler bei unterschiedlichen Passwörtern', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForm();

    await user.type(screen.getByPlaceholderText('auth.reset.passwordPlaceholder'), 'Strong1!');
    await user.type(screen.getByPlaceholderText('auth.reset.confirmPlaceholder'), 'Different1!');
    await user.tab();

    expect(screen.getByText('auth.reset.validation.passwordMismatch')).toBeInTheDocument();
  });

  it('ruft resetPassword mit Token und Passwort auf', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForm('my-token');

    await user.type(screen.getByPlaceholderText('auth.reset.passwordPlaceholder'), 'Strong1!');
    await user.type(screen.getByPlaceholderText('auth.reset.confirmPlaceholder'), 'Strong1!');
    await user.click(screen.getByRole('button', { name: /auth\.reset\.submit/ }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('my-token', 'Strong1!');
    });
  });

  it('zeigt Erfolgs-State nach Reset', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForm();

    await user.type(screen.getByPlaceholderText('auth.reset.passwordPlaceholder'), 'Strong1!');
    await user.type(screen.getByPlaceholderText('auth.reset.confirmPlaceholder'), 'Strong1!');
    await user.click(screen.getByRole('button', { name: /auth\.reset\.submit/ }));

    await waitFor(() => {
      expect(screen.getByText('auth.reset.successTitle')).toBeInTheDocument();
    });
  });

  it('zeigt API-Fehler bei fehlgeschlagenem Reset', async () => {
    mockResetPassword.mockRejectedValueOnce({
      response: { data: { message: 'Token expired' } },
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForm();

    await user.type(screen.getByPlaceholderText('auth.reset.passwordPlaceholder'), 'Strong1!');
    await user.type(screen.getByPlaceholderText('auth.reset.confirmPlaceholder'), 'Strong1!');
    await user.click(screen.getByRole('button', { name: /auth\.reset\.submit/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Token expired');
    });
  });
});
