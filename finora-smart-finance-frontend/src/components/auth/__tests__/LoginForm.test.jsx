import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================
// MOCKS
// ============================================

const mockLogin = vi.fn().mockResolvedValue({});
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

vi.mock('@/hooks', () => ({
  useAuth: () => ({ login: mockLogin }),
  useToast: () => mockToast,
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('@/api/errorHandler', () => ({
  parseApiError: e => ({ message: e?.response?.data?.message || 'error' }),
}));

vi.mock('@/components/common/Checkbox/Checkbox', () => ({
  default: ({ checked, onChange, id, children }) => (
    <label>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} />
      {children}
    </label>
  ),
}));

// LoginForm imports
import LoginForm from '../LoginForm/LoginForm';

// ============================================
// HELPERS
// ============================================

const renderForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );

// ============================================
// TESTS
// ============================================

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendert Username-Input', () => {
    renderForm();
    expect(screen.getByPlaceholderText('auth.login.usernamePlaceholder')).toBeInTheDocument();
  });

  it('rendert Password-Input', () => {
    renderForm();
    expect(screen.getByPlaceholderText('auth.login.passwordPlaceholder')).toBeInTheDocument();
  });

  it('rendert Submit-Button', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /auth\.login\.submit/i })).toBeInTheDocument();
  });

  it('rendert Remember-Me-Checkbox', () => {
    renderForm();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('Forgot-Password-Link vorhanden mit href=/forgot-password', () => {
    renderForm();
    const link = screen.getByText('auth.login.forgot');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('validiert leeren Username bei Blur', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByPlaceholderText('auth.login.usernamePlaceholder');
    await user.click(input);
    await user.tab();
    expect(screen.getByText('auth.login.validation.usernameRequired')).toBeInTheDocument();
  });

  it('Submit-Button deaktiviert bei fehlendem Input', () => {
    renderForm();
    const btn = screen.getByRole('button', { name: /auth\.login\.submit/i });
    expect(btn).toBeDisabled();
  });

  it('ruft login() beim Absenden auf', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText('auth.login.usernamePlaceholder'), 'testuser');
    await user.type(screen.getByPlaceholderText('auth.login.passwordPlaceholder'), 'Password1!');

    const btn = screen.getByRole('button', { name: /auth\.login\.submit/i });
    await user.click(btn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'Password1!', false);
    });
  });

  it('zeigt API-Fehler via ErrorBanner', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText('auth.login.usernamePlaceholder'), 'testuser');
    await user.type(screen.getByPlaceholderText('auth.login.passwordPlaceholder'), 'Password1!');

    const btn = screen.getByRole('button', { name: /auth\.login\.submit/i });
    await user.click(btn);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
