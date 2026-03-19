/**
 * @fileoverview AdminUserTable Tests
 * @description Tests für die AdminUserTable-Komponente –
 *              Loading, Empty State, Benutzerzeilen, Sort, Pagination, View-Button.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminUserTable from '../AdminUserTable';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, params) => {
      if (params) return `${key} ${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'de' },
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
    role: 'user',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-02-01T12:00:00Z',
  },
  {
    _id: 'u2',
    name: 'Bob Admin',
    email: 'bob@example.com',
    role: 'admin',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-14T10:00:00Z',
    lastLogin: null,
  },
  {
    _id: 'u3',
    name: 'Charlie Banned',
    email: 'charlie@example.com',
    role: 'user',
    isActive: false,
    isVerified: false,
    createdAt: '2024-01-13T10:00:00Z',
    lastLogin: '2024-01-20T08:00:00Z',
  },
];

const defaultPagination = {
  total: 3,
  page: 1,
  pages: 1,
  limit: 10,
};

const multiPagePagination = {
  total: 25,
  page: 2,
  pages: 3,
  limit: 10,
};

const defaultProps = {
  users: mockUsers,
  pagination: defaultPagination,
  loading: false,
  sort: '-createdAt',
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
  onViewUser: vi.fn(),
  actionLoading: null,
};

describe('AdminUserTable', () => {
  // ── Loading State ───────────────────────────────

  describe('Loading State', () => {
    it('zeigt Skeleton-Platzhalter beim Laden', () => {
      const { container } = render(<AdminUserTable {...defaultProps} loading={true} users={[]} />);
      expect(
        container.querySelector('[class*="SkeletonTableRow"], [class*="container"]')
      ).toBeInTheDocument();
    });

    it('zeigt keine Tabelle im Loading-State', () => {
      render(<AdminUserTable {...defaultProps} loading={true} users={[]} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // ── Empty State ─────────────────────────────────

  describe('Empty State', () => {
    it('zeigt noResults-Nachricht bei leerer Liste', () => {
      render(<AdminUserTable {...defaultProps} loading={false} users={[]} />);
      expect(screen.getByText('admin.users.noResults')).toBeInTheDocument();
    });
  });

  // ── Benutzerzeilen ──────────────────────────────

  describe('User Rows', () => {
    it('rendert alle Benutzernamen', () => {
      render(<AdminUserTable {...defaultProps} />);
      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
      expect(screen.getByText('Charlie Banned')).toBeInTheDocument();
    });

    it('rendert alle E-Mails', () => {
      render(<AdminUserTable {...defaultProps} />);
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
    });

    it('zeigt Admin-Badge für Admin-Benutzer', () => {
      render(<AdminUserTable {...defaultProps} />);
      // admin Rolle: Bob hat 'admin.users.roleAdmin', andere 'admin.users.roleUser'
      const roleTexts = screen.getAllByText('admin.users.roleAdmin');
      expect(roleTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt User-Badge für normale Benutzer', () => {
      render(<AdminUserTable {...defaultProps} />);
      const roleTexts = screen.getAllByText('admin.users.roleUser');
      expect(roleTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt Active-Badge für aktive Benutzer', () => {
      render(<AdminUserTable {...defaultProps} />);
      const activeTexts = screen.getAllByText('admin.users.active');
      expect(activeTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt Banned-Badge für gesperrte Benutzer', () => {
      render(<AdminUserTable {...defaultProps} />);
      const bannedTexts = screen.getAllByText('admin.users.banned');
      expect(bannedTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt korrektes Datumsformat', () => {
      render(<AdminUserTable {...defaultProps} />);
      // Intl.DateTimeFormat('de-DE') formatiert 2024-01-15 als 15.01.2024
      expect(screen.getByText('15.01.2024')).toBeInTheDocument();
    });

    it('zeigt — für fehlendes Datum', () => {
      const users = [
        {
          _id: 'u99',
          name: 'NoDate',
          email: 'n@d.com',
          role: 'user',
          isActive: true,
          isVerified: true,
          createdAt: null,
        },
      ];
      render(<AdminUserTable {...defaultProps} users={users} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('rendert 3 View-Buttons für 3 Benutzer', () => {
      render(<AdminUserTable {...defaultProps} />);
      const buttons = screen.getAllByRole('button', { name: /admin\.users\.viewDetails/ });
      expect(buttons).toHaveLength(3);
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('ruft onSortChange beim Klick auf Name-Header auf', () => {
      const onSortChange = vi.fn();
      render(<AdminUserTable {...defaultProps} onSortChange={onSortChange} />);

      const nameHeader = screen.getAllByText('admin.users.name')[0];
      fireEvent.click(nameHeader);

      expect(onSortChange).toHaveBeenCalledWith('-name');
    });

    it('wechselt Sortierrichtung bei erneutem Klick', () => {
      const onSortChange = vi.fn();
      render(<AdminUserTable {...defaultProps} sort="-name" onSortChange={onSortChange} />);

      const nameHeader = screen.getAllByText('admin.users.name')[0];
      fireEvent.click(nameHeader);

      expect(onSortChange).toHaveBeenCalledWith('name');
    });

    it('setzt aria-sort descending auf aktive Spalte', () => {
      const { container } = render(<AdminUserTable {...defaultProps} sort="-createdAt" />);
      const sortedTh = container.querySelector('th[aria-sort="descending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort ascending auf aktive Spalte', () => {
      const { container } = render(<AdminUserTable {...defaultProps} sort="name" />);
      const sortedTh = container.querySelector('th[aria-sort="ascending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort none auf inaktive Spalten', () => {
      const { container } = render(<AdminUserTable {...defaultProps} sort="-createdAt" />);
      const noneSorted = container.querySelectorAll('th[aria-sort="none"]');
      expect(noneSorted.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('zeigt keine Pagination bei einer Seite', () => {
      render(<AdminUserTable {...defaultProps} pagination={defaultPagination} />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('zeigt Pagination bei mehreren Seiten', () => {
      render(<AdminUserTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('rendert Seiten-Buttons', () => {
      render(<AdminUserTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('markiert aktuelle Seite mit aria-current', () => {
      render(<AdminUserTable {...defaultProps} pagination={multiPagePagination} />);
      const activePage = screen.getByText('2');
      expect(activePage).toHaveAttribute('aria-current', 'page');
    });

    it('ruft onPageChange beim Klick auf Seite auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminUserTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByText('3'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('deaktiviert Prev-Button auf erster Seite', () => {
      const pag = { ...multiPagePagination, page: 1 };
      render(<AdminUserTable {...defaultProps} pagination={pag} />);
      const prevBtn = screen.getByLabelText('admin.users.prevPage');
      expect(prevBtn).toBeDisabled();
    });

    it('deaktiviert Next-Button auf letzter Seite', () => {
      const pag = { ...multiPagePagination, page: 3 };
      render(<AdminUserTable {...defaultProps} pagination={pag} />);
      const nextBtn = screen.getByLabelText('admin.users.nextPage');
      expect(nextBtn).toBeDisabled();
    });

    it('ruft onPageChange mit page-1 bei Prev-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminUserTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByLabelText('admin.users.prevPage'));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('ruft onPageChange mit page+1 bei Next-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminUserTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByLabelText('admin.users.nextPage'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('zeigt Showing-Info', () => {
      render(<AdminUserTable {...defaultProps} pagination={multiPagePagination} />);
      // Showing mit from/to/total Params
      expect(screen.getByText(/admin\.users\.showing/)).toBeInTheDocument();
    });
  });

  // ── View Button ─────────────────────────────────

  describe('View Button', () => {
    it('ruft onViewUser mit User-Objekt beim Klick auf', () => {
      const onViewUser = vi.fn();
      render(<AdminUserTable {...defaultProps} onViewUser={onViewUser} />);

      const viewButtons = screen.getAllByRole('button', { name: /admin\.users\.viewDetails/ });
      fireEvent.click(viewButtons[0]);

      expect(onViewUser).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('deaktiviert View-Button bei laufender Aktion', () => {
      render(<AdminUserTable {...defaultProps} actionLoading="u1" />);

      const buttons = screen.getAllByRole('button', { name: /admin\.users\.viewDetails/ });
      // Der erste Button (für u1) sollte deaktiviert sein
      expect(buttons[0]).toBeDisabled();
      // Die anderen sollten aktiviert sein
      expect(buttons[1]).not.toBeDisabled();
    });
  });

  // ── Banned Row Styling ──────────────────────────

  describe('Banned Row', () => {
    it('markiert gebannte Benutzer mit bannedRow-Klasse', () => {
      const { container } = render(<AdminUserTable {...defaultProps} />);
      const bannedRows = container.querySelectorAll('[class*="bannedRow"]');
      expect(bannedRows).toHaveLength(1); // Charlie Banned
    });
  });
});
