/**
 * @fileoverview AdminUserDetail Tests
 * @description Tests für die AdminUserDetail-Modal-Komponente –
 *              Details-Ansicht, Ban-Confirm, Delete-Confirm, Role-Change, Password-Reset.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminUserDetail from '../AdminUserDetail';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, params) => {
      if (params) return `${key} ${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/useViewerGuard', () => ({
  useViewerGuard: () => ({ isViewer: false, guard: fn => fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'admin' }, isViewer: false }),
}));

// Mock Modal (Portal-basiert → vereinfacht)
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return { ...actual, createPortal: node => node };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const filtered = { ...props };
      delete filtered.initial;
      delete filtered.animate;
      delete filtered.exit;
      delete filtered.transition;
      return <div {...filtered}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => children,
}));

// ── Test-Daten ────────────────────────────────────

const activeUser = {
  _id: 'u1',
  name: 'Alice Müller',
  email: 'alice@example.com',
  role: 'user',
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-15T10:00:00Z',
  lastLogin: '2024-02-01T12:00:00Z',
};

const bannedUser = {
  _id: 'u2',
  name: 'Bob Banned',
  email: 'bob@example.com',
  role: 'user',
  isActive: false,
  isVerified: false,
  createdAt: '2024-01-10T10:00:00Z',
  lastLogin: null,
  banReason: 'Spam',
};

const adminUser = {
  _id: 'u3',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T10:00:00Z',
  lastLogin: '2024-02-10T15:00:00Z',
};

const mockActions = {
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  changeRole: vi.fn(),
  deleteUser: vi.fn(),
  resetPassword: vi.fn(),
};

const defaultProps = {
  user: activeUser,
  isOpen: true,
  onClose: vi.fn(),
  actions: mockActions,
  actionLoading: null,
  onSuccess: vi.fn(),
  onError: vi.fn(),
};

describe('AdminUserDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActions.banUser.mockResolvedValue({ success: true });
    mockActions.unbanUser.mockResolvedValue({ success: true });
    mockActions.changeRole.mockResolvedValue({ success: true });
    mockActions.deleteUser.mockResolvedValue({ success: true });
    mockActions.resetPassword.mockResolvedValue({ success: true });
  });

  // ── Rendering ───────────────────────────────────

  describe('Rendering', () => {
    it('rendert nichts ohne user', () => {
      const { container } = render(<AdminUserDetail {...defaultProps} user={null} />);
      // Modal could render empty, but AdminUserDetail returns null
      expect(container.querySelector('[class*="content"]')).toBeNull();
    });

    it('zeigt Benutzernamen', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
    });

    it('zeigt E-Mail-Adresse', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    it('zeigt Role-Badge', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('admin.users.roleUser')).toBeInTheDocument();
    });

    it('zeigt Active-Badge für aktive Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('admin.users.active')).toBeInTheDocument();
    });

    it('zeigt Banned-Badge für gesperrte Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} user={bannedUser} />);
      expect(screen.getByText('admin.users.banned')).toBeInTheDocument();
    });

    it('zeigt Verified-Badge für verifizierte Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText(/admin\.users\.verified/)).toBeInTheDocument();
    });

    it('zeigt Unverified-Badge für nicht verifizierte Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} user={bannedUser} />);
      expect(screen.getByText(/admin\.users\.unverifiedLabel/)).toBeInTheDocument();
    });

    it('zeigt Admin-Badge für Admin-Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} user={adminUser} />);
      expect(screen.getByText('admin.users.roleAdmin')).toBeInTheDocument();
    });

    it('zeigt Ban-Reason für gesperrte Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} user={bannedUser} />);
      expect(screen.getByText('Spam')).toBeInTheDocument();
    });
  });

  // ── Action Buttons ──────────────────────────────

  describe('Action Buttons', () => {
    it('zeigt Ban-Button für aktive Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('admin.users.ban')).toBeInTheDocument();
    });

    it('zeigt Unban-Button für gesperrte Benutzer', () => {
      render(<AdminUserDetail {...defaultProps} user={bannedUser} />);
      expect(screen.getByText('admin.users.unban')).toBeInTheDocument();
    });

    it('zeigt Change-Role-Button', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('admin.users.changeRole')).toBeInTheDocument();
    });

    it('zeigt Reset-Password-Button', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('admin.users.resetPassword')).toBeInTheDocument();
    });

    it('zeigt Delete-Button', () => {
      render(<AdminUserDetail {...defaultProps} />);
      expect(screen.getByText('admin.users.delete')).toBeInTheDocument();
    });
  });

  // ── Ban Flow ────────────────────────────────────

  describe('Ban Flow', () => {
    it('öffnet Ban-Confirm beim Klick auf Ban-Button', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.ban'));
      expect(screen.getByText('admin.users.confirmBan')).toBeInTheDocument();
    });

    it('zeigt Reason-Eingabefeld in Ban-Confirm', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.ban'));
      expect(screen.getByPlaceholderText('admin.users.banReasonPlaceholder')).toBeInTheDocument();
    });

    it('ruft banUser-Aktion beim Bestätigen auf', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.ban'));

      const reasonInput = screen.getByPlaceholderText('admin.users.banReasonPlaceholder');
      fireEvent.change(reasonInput, { target: { value: 'Spam' } });

      const banButtons = screen.getAllByText('admin.users.ban');
      const confirmBtn = banButtons[banButtons.length - 1];
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockActions.banUser).toHaveBeenCalledWith('u1', 'Spam');
      });
    });

    it('ruft onSuccess nach erfolgreichem Ban auf', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.ban'));
      const banButtons = screen.getAllByText('admin.users.ban');
      fireEvent.click(banButtons[banButtons.length - 1]);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith('admin.users.banSuccess');
      });
    });

    it('ruft onError bei fehlgeschlagenem Ban auf', async () => {
      mockActions.banUser.mockResolvedValue({ success: false, error: 'Cannot ban admin' });
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.ban'));
      const banButtons = screen.getAllByText('admin.users.ban');
      fireEvent.click(banButtons[banButtons.length - 1]);

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Cannot ban admin');
      });
    });

    it('kehrt zurück beim Cancel-Klick', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.ban'));
      expect(screen.getByText('admin.users.confirmBan')).toBeInTheDocument();

      fireEvent.click(screen.getByText('common.cancel'));
      // Sollte wieder Details-Ansicht zeigen
      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
    });
  });

  // ── Unban Flow ──────────────────────────────────

  describe('Unban Flow', () => {
    it('ruft unbanUser direkt beim Klick auf Unban-Button auf', async () => {
      render(<AdminUserDetail {...defaultProps} user={bannedUser} />);

      fireEvent.click(screen.getByText('admin.users.unban'));

      await waitFor(() => {
        expect(mockActions.unbanUser).toHaveBeenCalledWith('u2');
      });
    });

    it('ruft onSuccess nach Unban auf', async () => {
      render(<AdminUserDetail {...defaultProps} user={bannedUser} />);

      fireEvent.click(screen.getByText('admin.users.unban'));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith('admin.users.unbanSuccess');
      });
    });
  });

  // ── Delete Flow ─────────────────────────────────

  describe('Delete Flow', () => {
    it('öffnet Delete-Confirm beim Klick', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.delete'));
      expect(screen.getByText('admin.users.confirmDelete')).toBeInTheDocument();
    });

    it('zeigt Warn-Text mit Benutzername', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.delete'));
      expect(screen.getByText(/admin\.users\.confirmDeleteText/)).toBeInTheDocument();
    });

    it('ruft deleteUser beim Bestätigen auf', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.delete'));
      const deleteButtons = screen.getAllByText('admin.users.delete');
      fireEvent.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(mockActions.deleteUser).toHaveBeenCalledWith('u1');
      });
    });

    it('ruft onSuccess nach Löschen auf', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.delete'));
      const deleteButtons = screen.getAllByText('admin.users.delete');
      fireEvent.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith('admin.users.deleteSuccess');
      });
    });
  });

  // ── Change Role Flow ────────────────────────────

  describe('Change Role Flow', () => {
    it('öffnet Role-Change-Confirm beim Klick', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.changeRole'));
      expect(screen.getByText('admin.users.confirmRoleChange')).toBeInTheDocument();
    });

    it('zeigt Bestätigungs-Text mit neuem Rolle (user → admin)', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.changeRole'));
      expect(screen.getByText(/admin\.users\.confirmRoleChangeText/)).toBeInTheDocument();
    });

    it('ruft changeRole mit "admin" auf für User-Rolle', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.changeRole'));

      const confirmButtons = screen.getAllByText('admin.users.changeRole');
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockActions.changeRole).toHaveBeenCalledWith('u1', 'admin');
      });
    });

    it('ruft changeRole mit "user" auf für Admin-Rolle', async () => {
      render(<AdminUserDetail {...defaultProps} user={adminUser} />);

      fireEvent.click(screen.getByText('admin.users.changeRole'));

      const confirmButtons = screen.getAllByText('admin.users.changeRole');
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockActions.changeRole).toHaveBeenCalledWith('u3', 'user');
      });
    });

    it('ruft onSuccess nach Role-Change auf', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.changeRole'));
      const confirmButtons = screen.getAllByText('admin.users.changeRole');
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith('admin.users.roleChangeSuccess');
      });
    });
  });

  // ── Reset Password Flow ─────────────────────────

  describe('Reset Password Flow', () => {
    it('öffnet Reset-Password-Ansicht beim Klick', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.resetPassword'));
      expect(screen.getByText('admin.users.resetPasswordTitle')).toBeInTheDocument();
    });

    it('zeigt Passwort-Eingabefeld', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.resetPassword'));
      expect(screen.getByPlaceholderText('admin.users.newPasswordPlaceholder')).toBeInTheDocument();
    });

    it('zeigt Validierungs-Hinweis bei zu kurzem Passwort', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.resetPassword'));

      const pwInput = screen.getByPlaceholderText('admin.users.newPasswordPlaceholder');
      fireEvent.change(pwInput, { target: { value: '123' } });

      expect(screen.getByText('admin.users.passwordMinLength')).toBeInTheDocument();
    });

    it('deaktiviert Button bei zu kurzem Passwort', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.resetPassword'));

      const pwInput = screen.getByPlaceholderText('admin.users.newPasswordPlaceholder');
      fireEvent.change(pwInput, { target: { value: '123' } });

      const resetButtons = screen.getAllByText('admin.users.resetPassword');
      const confirmBtn = resetButtons[resetButtons.length - 1];
      expect(confirmBtn).toBeDisabled();
    });

    it('ruft resetPassword mit Passwort auf', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.resetPassword'));

      const pwInput = screen.getByPlaceholderText('admin.users.newPasswordPlaceholder');
      fireEvent.change(pwInput, { target: { value: 'newSecure123' } });

      const resetButtons = screen.getAllByText('admin.users.resetPassword');
      fireEvent.click(resetButtons[resetButtons.length - 1]);

      await waitFor(() => {
        expect(mockActions.resetPassword).toHaveBeenCalledWith('u1', 'newSecure123');
      });
    });

    it('ruft onSuccess nach Reset auf', async () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.resetPassword'));

      const pwInput = screen.getByPlaceholderText('admin.users.newPasswordPlaceholder');
      fireEvent.change(pwInput, { target: { value: 'newSecure123' } });

      const resetButtons = screen.getAllByText('admin.users.resetPassword');
      fireEvent.click(resetButtons[resetButtons.length - 1]);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith('admin.users.passwordResetSuccess');
      });
    });

    it('kehrt nach Cancel zurück zu Details', () => {
      render(<AdminUserDetail {...defaultProps} />);

      fireEvent.click(screen.getByText('admin.users.resetPassword'));
      expect(screen.getByText('admin.users.resetPasswordTitle')).toBeInTheDocument();

      fireEvent.click(screen.getByText('common.cancel'));
      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
    });
  });

  // ── Loading State ───────────────────────────────

  describe('Action Loading', () => {
    it('deaktiviert Buttons bei laufender Aktion', () => {
      render(<AdminUserDetail {...defaultProps} actionLoading="u1" />);

      const banBtn = screen.getByText('admin.users.ban').closest('button');
      expect(banBtn).toBeDisabled();
    });
  });
});
