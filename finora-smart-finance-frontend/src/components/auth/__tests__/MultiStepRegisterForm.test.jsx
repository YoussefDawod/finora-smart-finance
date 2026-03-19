import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================
// MOCKS
// ============================================

const mockRegister = vi.fn().mockResolvedValue({});
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
  motion: { div: m('div'), form: m('form') },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key),
    i18n: { dir: () => 'ltr', language: 'de' },
  }),
  Trans: ({ i18nKey, children }) => <span>{i18nKey || children}</span>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks', () => ({
  useAuth: () => ({ register: mockRegister }),
  useToast: () => mockToast,
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('@/api/errorHandler', () => ({
  parseApiError: e => ({ message: e?.response?.data?.message || 'error' }),
}));

vi.mock('@/components/common/Checkbox/Checkbox', () => ({
  default: ({ checked, onChange, id, children }) => (
    <label>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} data-testid={id} />
      {children}
    </label>
  ),
}));

vi.mock('@/validators/passwordValidator', () => ({
  validatePassword: () => ({ isValid: true, strength: 'strong', errors: [] }),
  getPasswordStrength: () => 'strong',
}));

import MultiStepRegisterForm from '../MultiStepRegisterForm/MultiStepRegisterForm';

// ============================================
// HELPERS
// ============================================

const renderForm = () =>
  render(
    <MemoryRouter>
      <MultiStepRegisterForm />
    </MemoryRouter>
  );

// ============================================
// TESTS
// ============================================

describe('MultiStepRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendert Step-Indicator mit 3 Steps', () => {
    renderForm();
    const buttons = screen.getAllByRole('button');
    // Step-Kreise sind buttons — mindestens 3 + Navigation
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('Step 1: Username-Input vorhanden', () => {
    renderForm();
    expect(
      screen.getByPlaceholderText('auth.register.step1.usernamePlaceholder')
    ).toBeInTheDocument();
  });

  it('Step 1: Email-Input vorhanden', () => {
    renderForm();
    expect(screen.getByPlaceholderText('auth.register.step1.emailPlaceholder')).toBeInTheDocument();
  });

  it('Step 1: bleibt bei Step 1 und zeigt Toast bei leerem Username', async () => {
    const user = userEvent.setup();
    renderForm();

    const nextBtn = screen.getByText('auth.register.navigation.next');
    await user.click(nextBtn);

    // Validation fails → toast warning, stays on step 1
    expect(mockToast.warning).toHaveBeenCalled();
    expect(
      screen.getByPlaceholderText('auth.register.step1.usernamePlaceholder')
    ).toBeInTheDocument();
  });

  it('kann von Step 1 zu Step 2 navigieren', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByPlaceholderText('auth.register.step1.usernamePlaceholder'),
      'TestUser'
    );

    const nextBtn = screen.getByText('auth.register.navigation.next');
    await user.click(nextBtn);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('auth.register.step2.passwordPlaceholder')
      ).toBeInTheDocument();
    });
  });

  it('Step 2: Passwort-Stärke-Anzeige sichtbar nach Eingabe', async () => {
    const user = userEvent.setup();
    renderForm();

    // Navigate to step 2
    await user.type(
      screen.getByPlaceholderText('auth.register.step1.usernamePlaceholder'),
      'TestUser'
    );
    await user.click(screen.getByText('auth.register.navigation.next'));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('auth.register.step2.passwordPlaceholder')
      ).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText('auth.register.step2.passwordPlaceholder'),
      'StrongPass1!'
    );

    expect(screen.getByText(/auth\.register\.strength\./)).toBeInTheDocument();
  });

  it('Zurück-Button navigiert zum vorherigen Step', async () => {
    const user = userEvent.setup();
    renderForm();

    // Navigate to step 2
    await user.type(
      screen.getByPlaceholderText('auth.register.step1.usernamePlaceholder'),
      'TestUser'
    );
    await user.click(screen.getByText('auth.register.navigation.next'));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('auth.register.step2.passwordPlaceholder')
      ).toBeInTheDocument();
    });

    // Click back
    await user.click(screen.getByText('auth.register.navigation.back'));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('auth.register.step1.usernamePlaceholder')
      ).toBeInTheDocument();
    });
  });
});
