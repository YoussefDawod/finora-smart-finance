/**
 * @fileoverview Tests für HamburgerMenu Component
 * @description Testet Rendering, Escape-Key, Backdrop-Klick, Navigation,
 *              User-Card, ThemeSelector, AdminLink und Accessibility.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';

// ── Mock State ───────────────────────────────────────────

let mockAuthState = {
  user: { name: 'Max Muster', email: 'max@example.com', role: 'user' },
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
  ThemeSelector: () => <div data-testid="theme-selector">ThemeSelector</div>,
}));

vi.mock('@/config/navigation', () => ({
  NAV_ITEMS: [
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: () => <span data-testid="icon-dashboard" /> },
    { path: '/transactions', labelKey: 'nav.transactions', icon: () => <span data-testid="icon-transactions" /> },
    { path: '/settings', labelKey: 'nav.settings', icon: () => <span data-testid="icon-settings" /> },
  ],
}));

// ── Helpers ──────────────────────────────────────────────

const renderMenu = (props = {}) => {
  const defaultProps = { isOpen: true, onClose: vi.fn() };
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <HamburgerMenu {...defaultProps} {...props} />
    </MemoryRouter>,
  );
};

// ── Tests ────────────────────────────────────────────────

describe('HamburgerMenu', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { name: 'Max Muster', email: 'max@example.com', role: 'user' },
      logout: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: true,
    };
    mockNavigate.mockClear();
    document.body.style.overflow = '';
  });

  // ── Rendering ────────────────────────────────────────

  describe('Rendering', () => {
    it('rendert nichts wenn isOpen=false', () => {
      renderMenu({ isOpen: false });
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('rendert Navigation wenn isOpen=true', () => {
      renderMenu({ isOpen: true });
      // motion.aside renders as <aside role="navigation">
      const nav = document.querySelector('[role="navigation"]');
      expect(nav).toBeInTheDocument();
    });

    it('rendert Logo', () => {
      renderMenu();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('rendert alle Nav-Items', () => {
      renderMenu();
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
      expect(screen.getByText('nav.transactions')).toBeInTheDocument();
      expect(screen.getByText('nav.settings')).toBeInTheDocument();
    });

    it('rendert Nav-Icons', () => {
      renderMenu();
      expect(screen.getByTestId('icon-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('icon-transactions')).toBeInTheDocument();
      expect(screen.getByTestId('icon-settings')).toBeInTheDocument();
    });

    it('rendert ThemeSelector', () => {
      renderMenu();
      expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    });
  });

  // ── User-Card ────────────────────────────────────────

  describe('User-Card', () => {
    it('zeigt Avatar-Initialen', () => {
      renderMenu();
      // "Max Muster" → "MM"
      expect(screen.getByText('MM')).toBeInTheDocument();
    });

    it('zeigt Benutzername', () => {
      renderMenu();
      expect(screen.getByText('Max Muster')).toBeInTheDocument();
    });

    it('zeigt E-Mail', () => {
      renderMenu();
      expect(screen.getByText('max@example.com')).toBeInTheDocument();
    });

    it('zeigt Admin-Badge für Admin', () => {
      mockAuthState.user = { name: 'AdminUser', email: 'a@t.com', role: 'admin' };
      renderMenu();
      // admin.badge fallback is 'Admin'
      const badges = screen.getAllByText('Admin');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt keine User-Card wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      renderMenu();
      expect(screen.queryByText('MM')).not.toBeInTheDocument();
    });
  });

  // ── Admin-Link ───────────────────────────────────────

  describe('Admin-Link', () => {
    it('zeigt Admin-Panel-Link für Admin', () => {
      mockAuthState.user = { name: 'Admin', email: 'a@t.com', role: 'admin' };
      renderMenu();
      expect(screen.getByText('nav.adminPanel')).toBeInTheDocument();
    });

    it('zeigt keinen Admin-Panel-Link für normale Benutzer', () => {
      renderMenu();
      expect(screen.queryByText('nav.adminPanel')).not.toBeInTheDocument();
    });
  });

  // ── Close-Verhalten ──────────────────────────────────

  describe('Close-Verhalten', () => {
    it('schließt bei Escape-Taste', () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('schließt bei Backdrop-Klick', () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('schließt bei Navigation', () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.click(screen.getByText('nav.transactions'));

      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });

  // ── Body-Scroll-Lock ─────────────────────────────────

  describe('Body-Scroll-Lock', () => {
    it('sperrt Body-Scroll wenn geöffnet', () => {
      renderMenu({ isOpen: true });
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('gibt Body-Scroll frei wenn geschlossen', () => {
      const { unmount } = renderMenu({ isOpen: true });
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  // ── Logout / Login ───────────────────────────────────

  describe('Logout / Login', () => {
    it('rendert Logout-Button für authentifizierte Benutzer', () => {
      renderMenu();
      expect(screen.getByText('nav.logout')).toBeInTheDocument();
    });

    it('ruft logout auf und navigiert', async () => {
      const onClose = vi.fn();
      renderMenu({ onClose });

      fireEvent.click(screen.getByText('nav.logout'));

      await vi.waitFor(() => {
        expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('zeigt Login-Button wenn nicht authentifiziert', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null;
      renderMenu();
      expect(screen.getByText('auth.loginOrRegister')).toBeInTheDocument();
    });
  });

  // ── Accessibility ────────────────────────────────────

  describe('Accessibility', () => {
    it('hat aria-modal="true"', () => {
      renderMenu();
      const nav = document.querySelector('[role="navigation"]');
      expect(nav).toHaveAttribute('aria-modal', 'true');
    });

    it('hat aria-label', () => {
      renderMenu();
      const nav = document.querySelector('[aria-label="common.navigation"]');
      expect(nav).toBeInTheDocument();
    });

    it('Backdrop hat aria-hidden="true"', () => {
      renderMenu();
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });
});
