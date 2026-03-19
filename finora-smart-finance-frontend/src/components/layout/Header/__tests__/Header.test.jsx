/**
 * @fileoverview Tests für Header Component — Aurora Flow Glass Neubau
 * @description Desktop/Mobile Rendering, Auth States, Badges, HamburgerMenu, Logout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';

// ── Mock State ───────────────────────────────────────────

let mockAuthState = {
  user: { name: 'Test User', email: 'test@example.com', role: 'user' },
  logout: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
  isLoading: false,
  isViewer: false,
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
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'create') return Component => Component;
        return ({ children, ...props }) => {
          const htmlProps = Object.fromEntries(
            Object.entries(props).filter(
              ([k]) =>
                ![
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
                ].includes(k)
            )
          );
          const Tag = typeof prop === 'string' ? prop : 'div';
          return <Tag {...htmlProps}>{children}</Tag>;
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

vi.mock('@/components/common', () => ({
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

vi.mock('../../HamburgerMenu/HamburgerMenu', () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="hamburger-menu" role="navigation">
        <button data-testid="close-menu" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

// ── Helpers ──────────────────────────────────────────────

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

// ── Tests ────────────────────────────────────────────────

describe('Header', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { name: 'Test User', email: 'test@example.com', role: 'user' },
      logout: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: true,
      isLoading: false,
      isViewer: false,
    };
    mockIsMobile = false;
    mockNavigate.mockClear();
  });

  // ── Desktop Rendering ────────────────────────────────

  describe('Desktop Rendering', () => {
    it('zeigt Logo auf Desktop', () => {
      renderHeader();
      expect(screen.getByAltText('Finora')).toBeInTheDocument();
    });

    it('zeigt keinen Hamburger-Button auf Desktop', () => {
      renderHeader();
      expect(screen.queryByLabelText('common.menu')).not.toBeInTheDocument();
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
      expect(screen.queryByAltText('Finora')).not.toBeInTheDocument();
    });

    it('Hamburger hat aria-label', () => {
      mockIsMobile = true;
      renderHeader();
      expect(screen.getByLabelText('common.menu')).toBeInTheDocument();
    });

    it('Hamburger hat aria-expanded=false initial', () => {
      mockIsMobile = true;
      renderHeader();
      expect(screen.getByLabelText('common.menu')).toHaveAttribute('aria-expanded', 'false');
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

  // ── Auth States ──────────────────────────────────────

  describe('Auth States', () => {
    it('zeigt Skeleton im Loading-Zustand', () => {
      mockAuthState.isLoading = true;
      renderHeader();
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('zeigt UserMenu wenn authentifiziert', () => {
      renderHeader();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('zeigt Login-Link wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.isLoading = false;
      renderHeader();
      expect(screen.getByText('auth.loginOrRegister')).toBeInTheDocument();
    });

    it('Auth-Link zeigt auf /login', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.isLoading = false;
      renderHeader();
      const link = screen.getByText('auth.loginOrRegister');
      expect(link.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  // ── Badges ───────────────────────────────────────────

  describe('Badges', () => {
    it('zeigt Admin-Badge für Admin-Benutzer', () => {
      mockAuthState.user = { name: 'AdminUser', role: 'admin' };
      mockAuthState.isViewer = false;
      renderHeader();
      expect(screen.getByText('admin.badge')).toBeInTheDocument();
    });

    it('zeigt Viewer-Badge für Viewer-Benutzer', () => {
      mockAuthState.user = { name: 'ViewerUser', role: 'viewer' };
      mockAuthState.isViewer = true;
      renderHeader();
      expect(screen.getByText('admin.viewerBadge')).toBeInTheDocument();
    });

    it('zeigt kein Badge für normale Benutzer', () => {
      mockAuthState.user = { name: 'Normal User', role: 'user' };
      renderHeader();
      expect(screen.queryByText('admin.badge')).not.toBeInTheDocument();
      expect(screen.queryByText('admin.viewerBadge')).not.toBeInTheDocument();
    });
  });

  // ── Logout ───────────────────────────────────────────

  describe('Logout', () => {
    it('ruft logout auf und navigiert zu /dashboard', async () => {
      renderHeader();

      fireEvent.click(screen.getByText('Logout'));

      await vi.waitFor(() => {
        expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
