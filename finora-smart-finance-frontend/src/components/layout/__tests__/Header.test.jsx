/**
 * @fileoverview Tests für Header Component
 * @description Testet Logo/Hamburger-Rendering, UserMenu, AdminBadge,
 *              HamburgerMenu-Integration, Escape-Key und Responsive-Verhalten.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header/Header';

// ── Mock State ───────────────────────────────────────────

let mockAuthState = {
  user: { name: 'Test User', email: 'test@example.com', role: 'user' },
  logout: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
  isLoading: false,
};

let mockIsMobile = false;

const mockNavigate = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockIsMobile,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'create') return (Component) => Component;
      return ({ children, ...props }) => {
        const { whileHover, whileTap, whileFocus, whileInView, whileDrag,
          initial, animate, exit, transition, variants, layout, layoutId,
          ...htmlProps } = props;
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

vi.mock('@/components/common', () => ({
  Logo: ({ onClick }) => <div data-testid="logo" onClick={onClick}>Logo</div>,
  UserMenu: ({ user, onLogout }) => (
    <div data-testid="user-menu">
      <span>{user?.name}</span>
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
}));

vi.mock('@/components/common/Skeleton/Skeleton', () => ({
  default: () => <div data-testid="skeleton">Loading...</div>,
}));

// Mock HamburgerMenu to track isOpen prop
vi.mock('../HamburgerMenu/HamburgerMenu', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="hamburger-menu" role="navigation">
        <button data-testid="close-menu" onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

// ── Helpers ──────────────────────────────────────────────

const renderHeader = () => {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
};

// ── Tests ────────────────────────────────────────────────

describe('Header', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { name: 'Test User', email: 'test@example.com', role: 'user' },
      logout: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: true,
      isLoading: false,
    };
    mockIsMobile = false;
    mockNavigate.mockClear();
  });

  // ── Desktop Rendering ────────────────────────────────

  describe('Desktop Rendering', () => {
    it('zeigt Logo auf Desktop', () => {
      mockIsMobile = false;
      renderHeader();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('zeigt keinen Hamburger-Button auf Desktop', () => {
      mockIsMobile = false;
      renderHeader();
      expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
    });

    it('rendert UserMenu für authentifizierten Benutzer', () => {
      mockIsMobile = false;
      renderHeader();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('hat role="banner"', () => {
      renderHeader();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  // ── Mobile Rendering ─────────────────────────────────

  describe('Mobile Rendering', () => {
    it('zeigt Hamburger-Button auf Mobile', () => {
      mockIsMobile = true;
      renderHeader();
      expect(screen.getByLabelText('common.menu')).toBeInTheDocument();
    });

    it('zeigt kein Logo auf Mobile', () => {
      mockIsMobile = true;
      renderHeader();
      expect(screen.queryByTestId('logo')).not.toBeInTheDocument();
    });

    it('Hamburger hat aria-expanded', () => {
      mockIsMobile = true;
      renderHeader();
      const btn = screen.getByLabelText('common.menu');
      expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // ── HamburgerMenu Integration ────────────────────────

  describe('HamburgerMenu Integration', () => {
    it('öffnet HamburgerMenu bei Klick auf Hamburger', () => {
      mockIsMobile = true;
      renderHeader();

      expect(screen.queryByTestId('hamburger-menu')).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('common.menu'));

      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
    });

    it('schließt HamburgerMenu via onClose', () => {
      mockIsMobile = true;
      renderHeader();

      fireEvent.click(screen.getByLabelText('common.menu'));
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-menu'));

      expect(screen.queryByTestId('hamburger-menu')).not.toBeInTheDocument();
    });

    it('schließt HamburgerMenu bei Escape', () => {
      mockIsMobile = true;
      renderHeader();

      fireEvent.click(screen.getByLabelText('common.menu'));
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByTestId('hamburger-menu')).not.toBeInTheDocument();
    });
  });

  // ── Admin Badge ──────────────────────────────────────

  describe('Admin Badge', () => {
    it('zeigt Admin-Badge für Admin-Benutzer', () => {
      mockAuthState.user = { name: 'AdminUser', role: 'admin' };
      renderHeader();
      // admin.badge fallback is 'Admin'
      const badges = screen.getAllByText('Admin');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt kein Admin-Badge für normale Benutzer', () => {
      mockAuthState.user = { name: 'Normal User', role: 'user' };
      renderHeader();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  // ── Auth-Zustände ────────────────────────────────────

  describe('Auth-Zustände', () => {
    it('zeigt Skeleton im Loading-Zustand', () => {
      mockAuthState.isLoading = true;
      renderHeader();
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('zeigt Login-Link wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.isLoading = false;
      renderHeader();
      expect(screen.getByText('auth.loginOrRegister')).toBeInTheDocument();
    });

    it('zeigt UserMenu wenn authentifiziert', () => {
      renderHeader();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  // ── Logout ───────────────────────────────────────────

  describe('Logout', () => {
    it('ruft logout auf und navigiert zu /dashboard', async () => {
      renderHeader();

      const logoutBtn = screen.getByText('Logout');
      fireEvent.click(logoutBtn);

      await vi.waitFor(() => {
        expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
