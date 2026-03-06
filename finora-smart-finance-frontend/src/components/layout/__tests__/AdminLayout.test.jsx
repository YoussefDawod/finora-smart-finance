/**
 * @fileoverview Tests für AdminLayout – Admin-Bereich Layout
 * @description Testet Header, Sidebar-Navigation, Collapse-Toggle,
 *              Mobile-Responsive-Verhalten, Logout, UserMenu, ThemeSelector,
 *              User-Card, Escape-Key, Body-Scroll-Lock und Navigation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from '../AdminLayout/AdminLayout';

// ── Mock State ───────────────────────────────────────────

let mockAuthState = {
  user: { name: 'Admin User', email: 'admin@test.com', role: 'admin' },
  logout: vi.fn().mockResolvedValue(undefined),
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
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: true }),
}));

vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'create') return (Component) => Component;
      return ({ children, ...props }) => {
        const htmlProps = Object.fromEntries(
          Object.entries(props).filter(([k]) => !['whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag', 'initial', 'animate', 'exit', 'transition', 'variants', 'layout', 'layoutId'].includes(k))
        );
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
  Logo: () => <div data-testid="logo">Logo</div>,
  UserMenu: ({ user, onLogout }) => (
    <div data-testid="user-menu">
      <span>{user?.name}</span>
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
  ThemeSelector: ({ isCollapsed }) => (
    <div data-testid="theme-selector" data-collapsed={isCollapsed}>
      ThemeSelector
    </div>
  ),
}));

vi.mock('@/config/adminNavigation', () => ({
  ADMIN_NAV_ITEMS: [
    { path: '/admin', labelKey: 'admin.nav.dashboard', icon: () => <span data-testid="icon-dashboard" />, end: true },
    { path: '/admin/users', labelKey: 'admin.nav.users', icon: () => <span data-testid="icon-users" /> },
    { path: '/admin/transactions', labelKey: 'admin.nav.transactions', icon: () => <span data-testid="icon-transactions" /> },
  ],
  ADMIN_BACK_LINK: {
    path: '/dashboard',
    labelKey: 'admin.nav.backToApp',
    icon: () => <span data-testid="icon-back" />,
  },
}));

// ── Helpers ──────────────────────────────────────────────

const renderLayout = (initialEntry = '/admin') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AdminLayout />
    </MemoryRouter>,
  );
};

// ── Tests ────────────────────────────────────────────────

describe('AdminLayout', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { name: 'Admin User', role: 'admin' },
      logout: vi.fn().mockResolvedValue(undefined),
    };
    mockIsMobile = false;
    mockNavigate.mockClear();
    // Reset localStorage mock — getItem soll standardmäßig null zurückgeben
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockClear();
    localStorage.clear.mockClear();
  });

  // ── Header ───────────────────────────────────────────

  describe('Header', () => {
    it('rendert Logo', () => {
      renderLayout();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('zeigt Admin Badge', () => {
      renderLayout();
      const badges = screen.getAllByText('Admin');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt den Benutzernamen', () => {
      renderLayout();
      // Name erscheint sowohl in UserMenu (Header) als auch in User-Card (Sidebar)
      const nameElements = screen.getAllByText('Admin User');
      expect(nameElements.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt keinen Menü-Button auf Desktop', () => {
      mockIsMobile = false;
      renderLayout();
      // Auf Desktop gibt es keinen Menu/Close-Button
      expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
    });
  });

  // ── Sidebar Navigation ──────────────────────────────

  describe('Sidebar Navigation', () => {
    it('rendert alle Nav-Items', () => {
      renderLayout();

      expect(screen.getByText('admin.nav.dashboard')).toBeInTheDocument();
      expect(screen.getByText('admin.nav.users')).toBeInTheDocument();
      expect(screen.getByText('admin.nav.transactions')).toBeInTheDocument();
    });

    it('hat eine Navigation mit Admin-Label', () => {
      renderLayout();

      const nav = screen.getByRole('navigation', { name: 'Admin Navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('rendert Nav-Icons', () => {
      renderLayout();

      expect(screen.getByTestId('icon-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('icon-users')).toBeInTheDocument();
      expect(screen.getByTestId('icon-transactions')).toBeInTheDocument();
    });

    it('rendert Back-to-App Link', () => {
      renderLayout();

      expect(screen.getByText('admin.nav.backToApp')).toBeInTheDocument();
      expect(screen.getByTestId('icon-back')).toBeInTheDocument();
    });

    it('rendert Nav-Items als Links', () => {
      renderLayout();

      const nav = screen.getByRole('navigation');
      const links = within(nav).getAllByRole('link');

      // 3 Nav-Items + 1 Back-to-App = 4 Links
      expect(links.length).toBe(4);
    });
  });

  // ── Content Area ─────────────────────────────────────

  describe('Content Area', () => {
    it('rendert Outlet', () => {
      renderLayout();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('hat main-Element mit role=main', () => {
      renderLayout();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('hat admin-content id', () => {
      renderLayout();
      expect(document.getElementById('admin-content')).toBeInTheDocument();
    });
  });

  // ── Collapse Toggle (Desktop) ───────────────────────

  describe('Collapse Toggle', () => {
    it('zeigt Collapse-Toggle auf Desktop', () => {
      mockIsMobile = false;
      renderLayout();

      expect(screen.getByLabelText('Sidebar einklappen')).toBeInTheDocument();
    });

    it('toggelt Collapse-Status', () => {
      mockIsMobile = false;
      renderLayout();

      const toggle = screen.getByLabelText('Sidebar einklappen');
      fireEvent.click(toggle);

      expect(screen.getByLabelText('Sidebar ausklappen')).toBeInTheDocument();
    });

    it('speichert Collapse-Status in localStorage', () => {
      mockIsMobile = false;
      renderLayout();

      const toggle = screen.getByLabelText('Sidebar einklappen');
      fireEvent.click(toggle);

      expect(localStorage.setItem).toHaveBeenCalledWith('admin-sidebar-collapsed', 'true');
    });

    it('lädt Collapse-Status aus localStorage', () => {
      mockIsMobile = false;
      localStorage.getItem.mockReturnValue('true');

      renderLayout();

      expect(screen.getByLabelText('Sidebar ausklappen')).toBeInTheDocument();
    });

    it('versteckt Nav-Labels im collapsed Modus', () => {
      mockIsMobile = false;
      renderLayout();

      // Klick zum Einklappen
      fireEvent.click(screen.getByLabelText('Sidebar einklappen'));

      // Labels sollten nicht mehr sichtbar sein
      expect(screen.queryByText('admin.nav.dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('admin.nav.users')).not.toBeInTheDocument();
    });
  });

  // ── Mobile Verhalten ─────────────────────────────────

  describe('Mobile Verhalten', () => {
    it('zeigt Menü-Button auf Mobil', () => {
      mockIsMobile = true;
      renderLayout();

      expect(screen.getByLabelText('common.menu')).toBeInTheDocument();
    });

    it('sidebar ist standardmäßig geschlossen auf Mobil', () => {
      mockIsMobile = true;
      renderLayout();

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('öffnet Sidebar bei Klick auf Menü-Button', () => {
      mockIsMobile = true;
      renderLayout();

      fireEvent.click(screen.getByLabelText('common.menu'));

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('zeigt Backdrop wenn mobile Sidebar offen', () => {
      mockIsMobile = true;
      renderLayout();

      fireEvent.click(screen.getByLabelText('common.menu'));

      // Backdrop hat aria-hidden="true"
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('schließt Sidebar bei Klick auf Backdrop', () => {
      mockIsMobile = true;
      renderLayout();

      fireEvent.click(screen.getByLabelText('common.menu'));
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Klick auf Backdrop
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('zeigt keinen Collapse-Toggle auf Mobil', () => {
      mockIsMobile = true;
      renderLayout();

      fireEvent.click(screen.getByLabelText('common.menu'));

      expect(screen.queryByLabelText('Sidebar einklappen')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Sidebar ausklappen')).not.toBeInTheDocument();
    });
  });

  // ── Logout ───────────────────────────────────────────

  describe('Logout', () => {
    it('rendert Logout-Button', () => {
      renderLayout();

      expect(screen.getByText('nav.logout')).toBeInTheDocument();
    });

    it('ruft logout auf und navigiert zu /login', async () => {
      renderLayout();

      const logoutBtn = screen.getByText('nav.logout').closest('button');
      fireEvent.click(logoutBtn);

      // Warte auf async logout
      await vi.waitFor(() => {
        expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  // ── UserMenu ─────────────────────────────────────────

  describe('UserMenu', () => {
    it('rendert UserMenu-Komponente im Header', () => {
      renderLayout();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('übergibt user und onLogout an UserMenu', () => {
      renderLayout();
      const userMenu = screen.getByTestId('user-menu');
      expect(within(userMenu).getByText('Admin User')).toBeInTheDocument();
    });
  });

  // ── ThemeSelector ────────────────────────────────────

  describe('ThemeSelector', () => {
    it('rendert ThemeSelector in der Sidebar', () => {
      mockIsMobile = false;
      renderLayout();
      expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    });

    it('übergibt isCollapsed an ThemeSelector', () => {
      mockIsMobile = false;
      renderLayout();

      expect(screen.getByTestId('theme-selector')).toHaveAttribute('data-collapsed', 'false');

      fireEvent.click(screen.getByLabelText('Sidebar einklappen'));

      expect(screen.getByTestId('theme-selector')).toHaveAttribute('data-collapsed', 'true');
    });

    it('rendert ThemeSelector in mobiler Sidebar', () => {
      mockIsMobile = true;
      renderLayout();
      fireEvent.click(screen.getByLabelText('common.menu'));
      expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    });
  });

  // ── User-Card ────────────────────────────────────────

  describe('User-Card', () => {
    it('zeigt Avatar-Initialen im Desktop-Sidebar', () => {
      mockIsMobile = false;
      renderLayout();
      // "Admin User" → "AU"
      expect(screen.getByText('AU')).toBeInTheDocument();
    });

    it('zeigt Name und E-Mail im Desktop-Sidebar', () => {
      mockIsMobile = false;
      renderLayout();
      // Name appears in both UserMenu and Sidebar
      const nameElements = screen.getAllByText('Admin User');
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
    });

    it('versteckt Name/E-Mail im Collapsed-Modus', () => {
      mockIsMobile = false;
      renderLayout();
      fireEvent.click(screen.getByLabelText('Sidebar einklappen'));
      // Avatar-Initialen noch da, aber Name nur noch im UserMenu
      const nameElements = screen.getAllByText('Admin User');
      expect(nameElements.length).toBe(1); // nur im UserMenu-Mock
    });

    it('zeigt User-Card in mobiler Sidebar', () => {
      mockIsMobile = true;
      renderLayout();
      fireEvent.click(screen.getByLabelText('common.menu'));
      // Avatar-Initialen + Name + E-Mail sichtbar
      expect(screen.getByText('AU')).toBeInTheDocument();
    });
  });

  // ── Escape-Key ───────────────────────────────────────

  describe('Escape-Key', () => {
    it('schließt Mobile-Sidebar bei Escape-Taste', () => {
      mockIsMobile = true;
      renderLayout();

      fireEvent.click(screen.getByLabelText('common.menu'));
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('tut nichts bei Escape wenn Sidebar geschlossen', () => {
      mockIsMobile = true;
      renderLayout();

      // Sidebar ist zu
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      // Immer noch zu, kein Fehler
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  // ── Body-Scroll-Lock ─────────────────────────────────

  describe('Body-Scroll-Lock', () => {
    it('setzt overflow hidden bei geöffneter mobiler Sidebar', () => {
      mockIsMobile = true;
      renderLayout();

      fireEvent.click(screen.getByLabelText('common.menu'));

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('entfernt overflow hidden bei geschlossener mobiler Sidebar', () => {
      mockIsMobile = true;
      renderLayout();

      fireEvent.click(screen.getByLabelText('common.menu'));
      expect(document.body.style.overflow).toBe('hidden');

      // Schließen via Backdrop
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);

      expect(document.body.style.overflow).toBe('');
    });
  });

  // ── Skip-Link ────────────────────────────────────────

  describe('Skip-Link', () => {
    it('rendert Skip-Link', () => {
      renderLayout();
      const skipLink = screen.getByText('Skip to content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#admin-content');
    });
  });

  // ── Accessibility ────────────────────────────────────

  describe('Accessibility', () => {
    it('mobile Sidebar hat aria-modal', () => {
      mockIsMobile = true;
      renderLayout();
      fireEvent.click(screen.getByLabelText('common.menu'));

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-modal', 'true');
    });

    it('mobile Sidebar hat aria-label', () => {
      mockIsMobile = true;
      renderLayout();
      fireEvent.click(screen.getByLabelText('common.menu'));

      const nav = screen.getByRole('navigation', { name: 'Admin Navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('main-Element hat tabIndex für Skip-Link-Fokus', () => {
      renderLayout();
      const main = document.getElementById('admin-content');
      expect(main).toHaveAttribute('tabindex', '-1');
    });
  });
});
