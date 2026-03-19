/**
 * @fileoverview Tests für HamburgerMenu — Aurora Flow Glass (Mobile/Tablet)
 * @description Testet Open/Close, Escape-Key, Backdrop-Click, Navigation,
 *              Body Scroll Lock, Auth States, Focus-Trap, a11y und shouldAnimate.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HamburgerMenu from '../HamburgerMenu';

// ── Mock State ───────────────────────────────────────────

let mockAuthState = {
  user: { name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
  logout: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
  isViewer: false,
};

const mockNavigate = vi.fn();
let mockShouldAnimate = false;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
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
  useMotion: () => ({ shouldAnimate: mockShouldAnimate }),
}));

vi.mock('@/utils/motionPresets', () => ({
  MOTION_EASING: {
    spring: { stiffness: 420, damping: 34 },
  },
}));

let capturedMotionProps = {};

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'create') return Component => Component;
        return ({ children, whileHover, whileTap, ...props }) => {
          capturedMotionProps = { whileHover, whileTap };
          const htmlProps = Object.fromEntries(
            Object.entries(props).filter(
              ([k]) =>
                ![
                  'initial',
                  'animate',
                  'exit',
                  'transition',
                  'variants',
                  'layout',
                  'layoutId',
                  'whileFocus',
                  'whileInView',
                  'whileDrag',
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
  ThemeSelector: () => <div data-testid="theme-selector">ThemeSelector</div>,
}));

vi.mock('@/config/navigation', () => ({
  NAV_ITEMS: [
    {
      path: '/dashboard',
      labelKey: 'nav.dashboard',
      icon: () => <span data-testid="icon-dashboard" />,
    },
    {
      path: '/transactions',
      labelKey: 'nav.transactions',
      icon: () => <span data-testid="icon-transactions" />,
    },
    {
      path: '/settings',
      labelKey: 'nav.settings',
      icon: () => <span data-testid="icon-settings" />,
    },
  ],
}));

// ── Helpers ──────────────────────────────────────────────

const renderMenu = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <HamburgerMenu {...defaultProps} {...props} />
    </MemoryRouter>
  );
};

// ── Tests ────────────────────────────────────────────────

describe('HamburgerMenu', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
      logout: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: true,
      isViewer: false,
    };
    mockNavigate.mockClear();
    mockShouldAnimate = false;
    capturedMotionProps = {};
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  // ── Render States ────────────────────────────────────

  describe('Render', () => {
    it('rendert Menu Panel wenn isOpen=true', () => {
      renderMenu();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('rendert nichts wenn isOpen=false', () => {
      renderMenu({ isOpen: false });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('rendert Backdrop mit aria-hidden', () => {
      const { container } = renderMenu();
      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('rendert Logo-Link', () => {
      renderMenu();
      const logo = screen.getByAltText('Finora');
      expect(logo).toBeInTheDocument();
    });

    it('rendert alle Nav-Items', () => {
      renderMenu();
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
      expect(screen.getByText('nav.transactions')).toBeInTheDocument();
      expect(screen.getByText('nav.settings')).toBeInTheDocument();
    });

    it('rendert ThemeSelector', () => {
      renderMenu();
      expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    });
  });

  // ── Close Mechanisms ─────────────────────────────────

  describe('Close Mechanisms', () => {
    it('ruft onClose bei Escape-Key auf', () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ruft onClose bei Backdrop-Klick auf', () => {
      const onClose = vi.fn();
      const { container } = renderMenu({ onClose });

      const backdrop = container.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ruft onClose bei Navigation auf', () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.click(screen.getByText('nav.transactions'));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });

  // ── Body Scroll Lock ─────────────────────────────────

  describe('Body Scroll Lock', () => {
    it('setzt body overflow auf hidden bei Open', () => {
      renderMenu();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('setzt body overflow zurück bei Unmount', () => {
      const { unmount } = renderMenu();
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  // ── Navigation ───────────────────────────────────────

  describe('Navigation', () => {
    it('navigiert bei Klick auf Nav-Item', () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.click(screen.getByText('nav.settings'));

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ── Auth States ──────────────────────────────────────

  describe('Auth States', () => {
    it('zeigt UserCard mit Name und E-Mail', () => {
      renderMenu();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('zeigt Avatar-Initialen', () => {
      renderMenu();
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('zeigt Admin-Badge für Admin', () => {
      mockAuthState.user = { name: 'AdminUser', email: 'a@t.com', role: 'admin' };
      renderMenu();
      const badges = screen.getAllByText('admin.badge');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt Viewer-Badge für Viewer', () => {
      mockAuthState.user = { name: 'ViewerUser', email: 'v@t.com', role: 'viewer' };
      mockAuthState.isViewer = true;
      renderMenu();
      const badges = screen.getAllByText('admin.viewerBadge');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt Admin-Panel-Link für Admin', () => {
      mockAuthState.user = { name: 'Admin', email: 'a@t.com', role: 'admin' };
      renderMenu();
      expect(screen.getByText('nav.adminPanel')).toBeInTheDocument();
    });

    it('zeigt keinen Admin-Link für normale Benutzer', () => {
      renderMenu();
      expect(screen.queryByText('nav.adminPanel')).not.toBeInTheDocument();
    });

    it('zeigt keine UserCard wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      renderMenu();
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });
  });

  // ── Logout / Login ───────────────────────────────────

  describe('Logout / Login', () => {
    it('rendert Logout-Button', () => {
      renderMenu();
      expect(screen.getByText('nav.logout')).toBeInTheDocument();
    });

    it('ruft logout und onClose auf', async () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.click(screen.getByText('nav.logout'));

      await vi.waitFor(() => {
        expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('zeigt Login-Button wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      renderMenu();
      expect(screen.getByText('auth.loginOrRegister')).toBeInTheDocument();
    });

    it('navigiert zu /login bei Login-Klick', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.click(screen.getByText('auth.loginOrRegister'));

      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ── a11y ─────────────────────────────────────────────

  describe('Accessibility', () => {
    it('hat role="dialog" auf Menu', () => {
      renderMenu();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('hat aria-modal="true"', () => {
      renderMenu();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('hat aria-label auf Menu', () => {
      renderMenu();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'common.navigation');
    });

    it('hat aria-label auf nav Element', () => {
      renderMenu();
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'common.navigation');
    });
  });

  // ── shouldAnimate Guard ──────────────────────────────

  describe('shouldAnimate', () => {
    it('übergibt keine Motion-Props wenn shouldAnimate === false', () => {
      mockShouldAnimate = false;
      renderMenu();
      expect(capturedMotionProps.whileHover).toBeUndefined();
      expect(capturedMotionProps.whileTap).toBeUndefined();
    });

    it('übergibt Motion-Props wenn shouldAnimate === true', () => {
      mockShouldAnimate = true;
      renderMenu();
      expect(capturedMotionProps.whileHover).toBeDefined();
      expect(capturedMotionProps.whileTap).toBeDefined();
    });
  });
});
