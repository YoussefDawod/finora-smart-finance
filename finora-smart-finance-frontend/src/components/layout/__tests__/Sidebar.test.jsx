/**
 * @fileoverview Tests für Sidebar Component (Desktop only)
 * @description Testet Desktop-Rendering, Collapse-Toggle, Navigation,
 *              User-Card, ThemeSelector, AdminLink, Logout und A11y.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

// ── Mock State ───────────────────────────────────────────

let mockAuthState = {
  user: { name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
  logout: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
};

const mockNavigate = vi.fn();

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
    t: (key, fallback) => fallback || key,
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
  ThemeSelector: ({ isCollapsed }) => (
    <div data-testid="theme-selector" data-collapsed={isCollapsed}>
      ThemeSelector
    </div>
  ),
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

const renderSidebar = (props = {}) => {
  const defaultProps = {
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
  };
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Sidebar {...defaultProps} {...props} />
    </MemoryRouter>
  );
};

// ── Tests ────────────────────────────────────────────────

describe('Sidebar', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
      logout: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: true,
    };
    mockNavigate.mockClear();
  });

  // ── Desktop Rendering ────────────────────────────────

  describe('Desktop Rendering', () => {
    it('rendert Sidebar als aside-Element', () => {
      const { container } = renderSidebar();
      expect(container.querySelector('aside')).toBeInTheDocument();
    });

    it('rendert alle Nav-Items', () => {
      renderSidebar();
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
      expect(screen.getByText('nav.transactions')).toBeInTheDocument();
      expect(screen.getByText('nav.settings')).toBeInTheDocument();
    });

    it('rendert Nav-Icons', () => {
      renderSidebar();
      expect(screen.getByTestId('icon-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('icon-transactions')).toBeInTheDocument();
      expect(screen.getByTestId('icon-settings')).toBeInTheDocument();
    });

    it('rendert ThemeSelector', () => {
      renderSidebar();
      expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    });

    it('übergibt isCollapsed an ThemeSelector', () => {
      renderSidebar({ isCollapsed: true });
      expect(screen.getByTestId('theme-selector')).toHaveAttribute('data-collapsed', 'true');
    });
  });

  // ── Collapse Toggle ──────────────────────────────────

  describe('Collapse Toggle', () => {
    it('rendert Collapse-Button', () => {
      renderSidebar();
      expect(screen.getByLabelText('common.collapse')).toBeInTheDocument();
    });

    it('zeigt Expand-Label wenn collapsed', () => {
      renderSidebar({ isCollapsed: true });
      expect(screen.getByLabelText('common.expand')).toBeInTheDocument();
    });

    it('ruft onToggleCollapse bei Klick auf', () => {
      const onToggleCollapse = vi.fn();
      renderSidebar({ onToggleCollapse });

      fireEvent.click(screen.getByLabelText('common.collapse'));

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('versteckt Nav-Labels im collapsed Modus', () => {
      renderSidebar({ isCollapsed: true });

      expect(screen.queryByText('nav.dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('nav.transactions')).not.toBeInTheDocument();
    });
  });

  // ── User-Card ────────────────────────────────────────

  describe('User-Card', () => {
    it('zeigt Avatar-Initialen', () => {
      renderSidebar();
      // "Jane Doe" → "JD"
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('zeigt Name und E-Mail', () => {
      renderSidebar();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('versteckt Name und E-Mail im Collapsed-Modus', () => {
      renderSidebar({ isCollapsed: true });

      // Initialen noch da
      expect(screen.getByText('JD')).toBeInTheDocument();

      // Name und E-Mail nicht sichtbar
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
    });

    it('zeigt Admin-Badge für Admin', () => {
      mockAuthState.user = { name: 'AdminUser', email: 'a@t.com', role: 'admin' };
      renderSidebar();
      // admin.badge fallback is 'Admin'
      const badges = screen.getAllByText('admin.badge');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt keine User-Card wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      renderSidebar();
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });
  });

  // ── Admin-Link ───────────────────────────────────────

  describe('Admin-Link', () => {
    it('zeigt Admin-Panel-Link für Admin', () => {
      mockAuthState.user = { name: 'Admin', email: 'a@t.com', role: 'admin' };
      renderSidebar();
      expect(screen.getByText('nav.adminPanel')).toBeInTheDocument();
    });

    it('zeigt keinen Admin-Panel-Link für normale Benutzer', () => {
      renderSidebar();
      expect(screen.queryByText('nav.adminPanel')).not.toBeInTheDocument();
    });

    it('versteckt Admin-Label im Collapsed-Modus', () => {
      mockAuthState.user = { name: 'Admin', email: 'a@t.com', role: 'admin' };
      renderSidebar({ isCollapsed: true });
      expect(screen.queryByText('nav.adminPanel')).not.toBeInTheDocument();
    });
  });

  // ── Navigation ───────────────────────────────────────

  describe('Navigation', () => {
    it('navigiert bei Klick auf Nav-Item', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('nav.transactions'));

      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });

  // ── Logout / Login ───────────────────────────────────

  describe('Logout / Login', () => {
    it('rendert Logout-Button', () => {
      renderSidebar();
      expect(screen.getByText('nav.logout')).toBeInTheDocument();
    });

    it('ruft logout auf und navigiert', async () => {
      renderSidebar();

      fireEvent.click(screen.getByText('nav.logout'));

      await vi.waitFor(() => {
        expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('versteckt Logout-Label im Collapsed-Modus', () => {
      renderSidebar({ isCollapsed: true });
      expect(screen.queryByText('nav.logout')).not.toBeInTheDocument();
    });

    it('zeigt Login-Button wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      renderSidebar();
      expect(screen.getByText('auth.loginOrRegister')).toBeInTheDocument();
    });

    it('versteckt Login-Label im Collapsed-Modus', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      renderSidebar({ isCollapsed: true });
      expect(screen.queryByText('auth.loginOrRegister')).not.toBeInTheDocument();
    });
  });

  // ── ThemeSelector Auto-Expand ────────────────────────

  describe('ThemeSelector Auto-Expand', () => {
    it('ruft onToggleCollapse wenn collapsed ThemeSection geklickt wird', () => {
      const onToggleCollapse = vi.fn();
      renderSidebar({ isCollapsed: true, onToggleCollapse });

      // Find the theme section wrapper (has role="button" when collapsed)
      const themeBtn = screen.getByRole('button', { name: 'themeSelector.ariaLabel' });
      fireEvent.click(themeBtn);

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });
  });
});
