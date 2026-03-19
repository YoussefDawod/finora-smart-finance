import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================
// MOCKS
// ============================================

const mockVerifyEmail = vi.fn().mockResolvedValue({});
const mockResendVerificationEmail = vi.fn().mockResolvedValue({});
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
  motion: { div: m('div') },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key),
    i18n: { dir: () => 'ltr', language: 'de' },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks', () => ({
  useAuth: () => ({
    verifyEmail: mockVerifyEmail,
    resendVerificationEmail: mockResendVerificationEmail,
  }),
  useToast: () => mockToast,
  useMotion: () => ({ shouldAnimate: false }),
}));

import VerifyEmailForm from '../VerifyEmailForm/VerifyEmailForm';

// ============================================
// HELPERS
// ============================================

const renderForm = (email = 'test@example.com') =>
  render(
    <MemoryRouter>
      <VerifyEmailForm email={email} />
    </MemoryRouter>
  );

// ============================================
// TESTS
// ============================================

describe('VerifyEmailForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendert 6 Code-Input-Felder', () => {
    renderForm();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('erstes Feld hat autoFocus', () => {
    renderForm();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveFocus();
  });

  it('erlaubt nur eine Ziffer pro Feld', async () => {
    const user = userEvent.setup();
    renderForm();
    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], 'a');
    expect(inputs[0]).toHaveValue('');

    await user.type(inputs[0], '5');
    expect(inputs[0]).toHaveValue('5');
  });

  it('auto-fokussiert nächstes Feld nach Eingabe', async () => {
    const user = userEvent.setup();
    renderForm();
    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], '1');
    expect(inputs[1]).toHaveFocus();
  });

  it('verarbeitet Paste von 6-stelligem Code', async () => {
    const user = userEvent.setup();
    renderForm();
    const inputs = screen.getAllByRole('textbox');

    await user.click(inputs[0]);
    await user.paste('123456');

    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('4');
    expect(inputs[4]).toHaveValue('5');
    expect(inputs[5]).toHaveValue('6');
  });

  it('auto-submit bei 6 Ziffern — ruft verifyEmail auf', async () => {
    const user = userEvent.setup();
    renderForm();
    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('123456');
    });
  });

  it('zeigt Erfolgs-State nach Verifizierung', async () => {
    const user = userEvent.setup();
    renderForm();
    const inputs = screen.getAllByRole('textbox');

    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }

    await waitFor(() => {
      expect(screen.getByText('auth.verifyForm.successTitle')).toBeInTheDocument();
    });
  });

  it('Resend-Button vorhanden und klickbar', () => {
    renderForm();
    const resendBtn = screen.getByRole('button', { name: /auth\.verifyForm\.resendAction/ });
    expect(resendBtn).toBeInTheDocument();
    expect(resendBtn).not.toBeDisabled();
  });

  it('ruft resendVerificationEmail auf bei Klick', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /auth\.verifyForm\.resendAction/ }));

    await waitFor(() => {
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com');
    });
  });
});
