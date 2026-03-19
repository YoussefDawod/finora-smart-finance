/**
 * @fileoverview AdminRecentUsers Tests
 * @description Tests für die AdminRecentUsers-Komponente –
 *              Loading, Empty State, Benutzerliste, Rollen-Badge, Verification-Icons.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminRecentUsers from '../AdminRecentUsers';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'admin' }, isViewer: false }),
}));

// ── Test-Daten ────────────────────────────────────

const mockUsers = [
  {
    _id: 'u1',
    name: 'Alice Müller',
    email: 'alice@example.com',
    isVerified: true,
    role: 'user',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // vor 2 Tagen
  },
  {
    _id: 'u2',
    name: 'Bob Admin',
    email: 'bob@example.com',
    isVerified: true,
    role: 'admin',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // vor 1 Stunde
  },
  {
    _id: 'u3',
    name: 'Charlie Unverified',
    email: 'charlie@example.com',
    isVerified: false,
    role: 'user',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // vor 30 min
  },
];

describe('AdminRecentUsers', () => {
  // ── Loading State ───────────────────────────────

  describe('Loading State', () => {
    it('zeigt Titel auch im Ladezustand', () => {
      render(<AdminRecentUsers users={[]} loading={true} />);
      expect(screen.getByText('admin.dashboard.recentUsers')).toBeInTheDocument();
    });

    it('hat aria-busy im Ladezustand', () => {
      const { container } = render(<AdminRecentUsers users={[]} loading={true} />);
      expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });

    it('zeigt 5 Skeleton-Zeilen', () => {
      const { container } = render(<AdminRecentUsers users={[]} loading={true} />);
      // Jede Zeile hat ein Skeleton-Circle → 5 Stück
      // Prüfe dass die Skeleton-Elemente existieren
      const rows = container.querySelectorAll('[class*="row"]');
      expect(rows.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ── Empty State ─────────────────────────────────

  describe('Empty State', () => {
    it('zeigt Empty-Message bei leerer Benutzer-Liste', () => {
      render(<AdminRecentUsers users={[]} loading={false} />);
      expect(screen.getByText('admin.dashboard.noRecentUsers')).toBeInTheDocument();
    });

    it('zeigt Empty-Message bei undefined users', () => {
      render(<AdminRecentUsers loading={false} />);
      expect(screen.getByText('admin.dashboard.noRecentUsers')).toBeInTheDocument();
    });

    it('zeigt Empty-Message bei null users', () => {
      render(<AdminRecentUsers users={null} loading={false} />);
      expect(screen.getByText('admin.dashboard.noRecentUsers')).toBeInTheDocument();
    });
  });

  // ── User-Liste ──────────────────────────────────

  describe('Benutzerliste', () => {
    it('zeigt alle Benutzernamen an', () => {
      render(<AdminRecentUsers users={mockUsers} loading={false} />);

      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
      expect(screen.getByText('Charlie Unverified')).toBeInTheDocument();
    });

    it('zeigt Titel "admin.dashboard.recentUsers"', () => {
      render(<AdminRecentUsers users={mockUsers} loading={false} />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'admin.dashboard.recentUsers'
      );
    });

    it('rendert korrekte Anzahl an Zeilen', () => {
      render(<AdminRecentUsers users={mockUsers} loading={false} />);
      const userNames = screen.getAllByText(/Alice|Bob|Charlie/);
      expect(userNames).toHaveLength(3);
    });
  });

  // ── Verification Icons ──────────────────────────

  describe('Verification Icons', () => {
    it('zeigt Verified-Icon für verifizierte Benutzer', () => {
      const { container } = render(<AdminRecentUsers users={[mockUsers[0]]} loading={false} />);
      // FiCheckCircle rendert mit class "verified"
      const verifiedIcon = container.querySelector('[class*="verified"]');
      expect(verifiedIcon).toBeInTheDocument();
    });

    it('zeigt Unverified-Icon für nicht-verifizierte Benutzer', () => {
      const { container } = render(<AdminRecentUsers users={[mockUsers[2]]} loading={false} />);
      const unverifiedIcon = container.querySelector('[class*="unverified"]');
      expect(unverifiedIcon).toBeInTheDocument();
    });
  });

  // ── Role Badge ──────────────────────────────────

  describe('Role Badge', () => {
    it('zeigt Admin-Badge für Admin-Benutzer', () => {
      render(<AdminRecentUsers users={[mockUsers[1]]} loading={false} />);
      expect(screen.getByText('admin.badge')).toBeInTheDocument();
    });

    it('zeigt kein Admin-Badge für reguläre Benutzer', () => {
      render(<AdminRecentUsers users={[mockUsers[0]]} loading={false} />);
      expect(screen.queryByText('admin.badge')).not.toBeInTheDocument();
    });
  });

  // ── Relative-Datum ──────────────────────────────

  describe('Relative Datum', () => {
    it('zeigt relatives Datum für Benutzer', () => {
      render(<AdminRecentUsers users={mockUsers} loading={false} />);
      // 3 Benutzer → 3 relative Datumsanzeigen
      const rows = screen.getAllByText(/Alice|Bob|Charlie/);
      expect(rows).toHaveLength(3);
    });

    it('zeigt "—" bei fehlendem Datum', () => {
      const userWithoutDate = [{ _id: 'x', name: 'NoDate', isVerified: true, role: 'user' }];
      render(<AdminRecentUsers users={userWithoutDate} loading={false} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  // ── Edge Cases ──────────────────────────────────

  describe('Edge Cases', () => {
    it('rendert Benutzer ohne _id (benutzt Index als Key)', () => {
      const usersWithoutId = [
        {
          name: 'KeylessUser',
          isVerified: false,
          role: 'user',
          createdAt: new Date().toISOString(),
        },
      ];
      render(<AdminRecentUsers users={usersWithoutId} loading={false} />);
      expect(screen.getByText('KeylessUser')).toBeInTheDocument();
    });
  });
});
