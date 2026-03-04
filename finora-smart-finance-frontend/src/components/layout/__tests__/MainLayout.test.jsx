/**
 * @fileoverview Tests für MainLayout Component
 * @description Testet Header, Sidebar, Content, Footer, Skip-Link,
 *              Responsive-Verhalten und localStorage-Persistenz.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../MainLayout/MainLayout';

// ── Mock State ───────────────────────────────────────────

let mockIsMobile = false;

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockIsMobile,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

// Mock child components to isolate MainLayout logic
vi.mock('../Header/Header', () => ({
  default: () => <header data-testid="header">Header</header>,
}));

vi.mock('../Sidebar/Sidebar', () => ({
  default: ({ isCollapsed, onToggleCollapse }) => (
    <aside data-testid="sidebar" data-collapsed={isCollapsed}>
      <button data-testid="collapse-btn" onClick={onToggleCollapse}>
        Toggle
      </button>
    </aside>
  ),
}));

vi.mock('../Footer/Footer', () => ({
  default: ({ isCollapsed, isMobile }) => (
    <footer data-testid="footer" data-collapsed={isCollapsed} data-mobile={isMobile}>
      Footer
    </footer>
  ),
}));

// ── Helpers ──────────────────────────────────────────────

const renderLayout = () => {
  return render(
    <MemoryRouter>
      <MainLayout />
    </MemoryRouter>,
  );
};

// ── Tests ────────────────────────────────────────────────

describe('MainLayout', () => {
  beforeEach(() => {
    mockIsMobile = false;
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockClear();
  });

  // ── Struktur ─────────────────────────────────────────

  describe('Struktur', () => {
    it('rendert Header', () => {
      renderLayout();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('rendert Sidebar auf Desktop', () => {
      mockIsMobile = false;
      renderLayout();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('rendert Footer', () => {
      renderLayout();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('rendert Outlet (Content-Area)', () => {
      renderLayout();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('rendert main-Element mit role="main"', () => {
      renderLayout();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('hat main-content id für Skip-Link', () => {
      renderLayout();
      expect(document.getElementById('main-content')).toBeInTheDocument();
    });

    it('main hat tabIndex für Skip-Link-Fokus', () => {
      renderLayout();
      const main = document.getElementById('main-content');
      expect(main).toHaveAttribute('tabindex', '-1');
    });
  });

  // ── Skip-Link ────────────────────────────────────────

  describe('Skip-Link', () => {
    it('rendert Skip-Link', () => {
      renderLayout();
      const skipLink = screen.getByText('Skip to content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  // ── Responsive ───────────────────────────────────────

  describe('Responsive', () => {
    it('rendert keine Sidebar auf Mobile', () => {
      mockIsMobile = true;
      renderLayout();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('rendert Sidebar auf Desktop', () => {
      mockIsMobile = false;
      renderLayout();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('übergibt isMobile an Footer', () => {
      mockIsMobile = true;
      renderLayout();
      expect(screen.getByTestId('footer')).toHaveAttribute('data-mobile', 'true');
    });
  });

  // ── Sidebar Collapse Persistence ─────────────────────

  describe('Sidebar Collapse Persistence', () => {
    it('Sidebar ist standardmäßig expanded', () => {
      renderLayout();
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    });

    it('lädt collapse-Status aus localStorage', () => {
      localStorage.getItem.mockReturnValue('true');
      renderLayout();
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
    });

    it('speichert collapse-Status in localStorage bei Toggle', () => {
      renderLayout();

      fireEvent.click(screen.getByTestId('collapse-btn'));

      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true');
    });

    it('toggelt collapse und speichert neuen Status', () => {
      renderLayout();

      // Collapse
      fireEvent.click(screen.getByTestId('collapse-btn'));
      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true');

      // Expand
      fireEvent.click(screen.getByTestId('collapse-btn'));
      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'false');
    });

    it('übergibt isCollapsed an Footer', () => {
      renderLayout();

      fireEvent.click(screen.getByTestId('collapse-btn'));

      expect(screen.getByTestId('footer')).toHaveAttribute('data-collapsed', 'true');
    });
  });

  // ── Children-Rendering ───────────────────────────────

  describe('Children-Rendering', () => {
    it('rendert children statt Outlet wenn übergeben', () => {
      render(
        <MemoryRouter>
          <MainLayout>
            <div data-testid="custom-content">Custom Content</div>
          </MainLayout>
        </MemoryRouter>,
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });
});
