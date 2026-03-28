/**
 * @fileoverview Tests für AdminRoute – Route-Schutz für Admin-Bereich
 * @description Testet alle Zugriffsszenarien: Loading, Unauthentifiziert,
 *              Nicht-Admin, Admin-Zugang.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from '../AdminRoute';

// ── Mocks ────────────────────────────────────────────────

// Mutable auth state – wird in beforeEach zurückgesetzt
let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

vi.mock('@/hooks', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/components/common/Skeleton/Skeleton', () => ({
  default: props => <div data-testid="skeleton" {...props} />,
}));

// ── Helpers ──────────────────────────────────────────────

/**
 * Rendert AdminRoute mit MemoryRouter an initialEntry
 */
const renderAdminRoute = (initialEntry = '/admin') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div data-testid="admin-content">Admin Panel</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

// ── Tests ────────────────────────────────────────────────

describe('AdminRoute', () => {
  beforeEach(() => {
    mockAuthState = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
    };
  });

  // ── Loading State ────────────────────────────────────

  describe('Loading State', () => {
    it('zeigt Loading-Screen während Auth geladen wird', () => {
      mockAuthState = { isAuthenticated: false, isLoading: true, user: null };

      renderAdminRoute();

      const loadingEl = screen.getByRole('generic', { busy: true });
      expect(loadingEl).toBeInTheDocument();
      expect(loadingEl).toHaveAttribute('aria-busy', 'true');
      expect(loadingEl).toHaveAttribute('aria-label', 'admin.loadingPanel');
    });

    it('rendert Skeleton-Elemente im Loading-Screen', () => {
      mockAuthState = { isAuthenticated: false, isLoading: true, user: null };

      renderAdminRoute();

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt keinen Admin-Content während Loading', () => {
      mockAuthState = { isAuthenticated: false, isLoading: true, user: null };

      renderAdminRoute();

      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });

  // ── Unauthentifiziert ────────────────────────────────

  describe('Nicht authentifiziert', () => {
    it('leitet zu /login um wenn nicht eingeloggt', () => {
      mockAuthState = { isAuthenticated: false, isLoading: false, user: null };

      renderAdminRoute();

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('zeigt keinen Admin-Content für unauthentifizierte User', () => {
      mockAuthState = { isAuthenticated: false, isLoading: false, user: null };

      renderAdminRoute();

      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });

  // ── Nicht-Admin Rolle ────────────────────────────────

  describe('Nicht-Admin Rolle', () => {
    it('leitet User-Rolle zu /dashboard um', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { name: 'Test', role: 'user' },
      };

      renderAdminRoute();

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('leitet um wenn User keine Rolle hat', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { name: 'Test' },
      };

      renderAdminRoute();

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('leitet um wenn user null ist aber authentifiziert', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: null,
      };

      renderAdminRoute();

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  // ── Admin Zugang ─────────────────────────────────────

  describe('Admin Zugang', () => {
    it('rendert Children für Admin-User', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { name: 'Admin', role: 'admin' },
      };

      renderAdminRoute();

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('zeigt keine Login- oder Dashboard-Seite für Admin', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { name: 'Admin', role: 'admin' },
      };

      renderAdminRoute();

      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });
  });

  // ── Edge Cases ───────────────────────────────────────

  describe('Edge Cases', () => {
    it('behandelt superadmin-Rolle nicht als Admin', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { name: 'Super', role: 'superadmin' },
      };

      renderAdminRoute();

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('behandelt leere Rolle nicht als Admin', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { name: 'NoRole', role: '' },
      };

      renderAdminRoute();

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });
});
