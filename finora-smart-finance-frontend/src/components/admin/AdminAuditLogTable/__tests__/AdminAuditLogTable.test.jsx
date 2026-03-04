/**
 * @fileoverview AdminAuditLogTable Tests
 * @description Tests für die AdminAuditLogTable-Komponente –
 *              Loading, Empty State, Zeilen, Action-Badges, Sort, Pagination, Formatierung.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminAuditLogTable from '../AdminAuditLogTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => {
      if (typeof fallback === 'string') return key;
      if (fallback && typeof fallback === 'object') return `${key} ${JSON.stringify(fallback)}`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

// ── Test-Daten ────────────────────────────────────

const mockLogs = [
  {
    _id: 'log1',
    adminName: 'Super Admin',
    action: 'USER_BANNED',
    targetUserName: 'Alice Müller',
    details: { reason: 'Spam' },
    ipAddress: '192.168.1.1',
    createdAt: '2024-03-15T10:30:00Z',
  },
  {
    _id: 'log2',
    adminName: 'System/API-Key',
    action: 'USER_CREATED',
    targetUserName: 'Bob Test',
    details: {},
    ipAddress: '10.0.0.1',
    createdAt: '2024-03-16T08:00:00Z',
  },
  {
    _id: 'log3',
    adminName: 'Admin2',
    action: 'ADMIN_LOGIN',
    targetUserName: null,
    details: null,
    ipAddress: null,
    createdAt: '2024-03-17T12:00:00Z',
  },
];

const defaultPagination = {
  total: 3,
  page: 1,
  pages: 1,
  limit: 20,
};

const multiPagePagination = {
  total: 60,
  page: 2,
  pages: 3,
  limit: 20,
};

const defaultProps = {
  logs: mockLogs,
  pagination: defaultPagination,
  loading: false,
  sort: '-createdAt',
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
};

describe('AdminAuditLogTable', () => {
  // ── Loading State ───────────────────────────────

  describe('Loading State', () => {
    it('zeigt Skeleton-Platzhalter beim Laden', () => {
      const { container } = render(<AdminAuditLogTable {...defaultProps} loading={true} logs={[]} />);
      expect(container.querySelector('[class*="SkeletonTableRow"], [class*="container"]')).toBeInTheDocument();
    });

    it('zeigt keine Tabelle im Loading-State', () => {
      render(<AdminAuditLogTable {...defaultProps} loading={true} logs={[]} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // ── Empty State ─────────────────────────────────

  describe('Empty State', () => {
    it('zeigt noResults-Nachricht bei leerer Liste', () => {
      render(<AdminAuditLogTable {...defaultProps} loading={false} logs={[]} />);
      expect(screen.getByText('admin.auditLog.noResults')).toBeInTheDocument();
    });
  });

  // ── Log Rows ────────────────────────────────────

  describe('Log Rows', () => {
    it('rendert Admin-Namen', () => {
      render(<AdminAuditLogTable {...defaultProps} />);
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('System/API-Key')).toBeInTheDocument();
      expect(screen.getByText('Admin2')).toBeInTheDocument();
    });

    it('rendert Action-Badges', () => {
      render(<AdminAuditLogTable {...defaultProps} />);
      expect(screen.getByText('admin.auditLog.actions_enum.USER_BANNED')).toBeInTheDocument();
      expect(screen.getByText('admin.auditLog.actions_enum.USER_CREATED')).toBeInTheDocument();
      expect(screen.getByText('admin.auditLog.actions_enum.ADMIN_LOGIN')).toBeInTheDocument();
    });

    it('rendert Target-Benutzernamen', () => {
      render(<AdminAuditLogTable {...defaultProps} />);
      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
      expect(screen.getByText('Bob Test')).toBeInTheDocument();
    });

    it('zeigt — für fehlende Werte', () => {
      render(<AdminAuditLogTable {...defaultProps} />);
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1); // log3 has no target, no details, no IP
    });

    it('rendert IP-Adressen', () => {
      render(<AdminAuditLogTable {...defaultProps} />);
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
    });

    it('zeigt Details für Objekte', () => {
      render(<AdminAuditLogTable {...defaultProps} />);
      // log1 details: { reason: 'Spam' } - should show JSON
      expect(screen.getByText(/reason.*Spam/)).toBeInTheDocument();
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('ruft onSortChange beim Klick auf Date-Header auf', () => {
      const onSortChange = vi.fn();
      render(<AdminAuditLogTable {...defaultProps} onSortChange={onSortChange} />);

      const dateHeaders = screen.getAllByText(/admin\.auditLog\.date/);
      fireEvent.click(dateHeaders[0]);

      // Current sort is '-createdAt' (desc), clicking toggles to 'createdAt' (asc)
      expect(onSortChange).toHaveBeenCalledWith('createdAt');
    });

    it('setzt desc-Sort bei Klick auf inaktive Spalte', () => {
      const onSortChange = vi.fn();
      render(<AdminAuditLogTable {...defaultProps} sort="-createdAt" onSortChange={onSortChange} />);

      const actionHeaders = screen.getAllByText(/admin\.auditLog\.action/);
      // The first match should be the header
      const headerAction = actionHeaders.find((el) => el.closest('th'));
      if (headerAction) fireEvent.click(headerAction);

      expect(onSortChange).toHaveBeenCalledWith('-action');
    });

    it('setzt aria-sort descending auf aktive Spalte', () => {
      const { container } = render(<AdminAuditLogTable {...defaultProps} sort="-createdAt" />);
      const sortedTh = container.querySelector('th[aria-sort="descending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort ascending auf aktive Spalte', () => {
      const { container } = render(<AdminAuditLogTable {...defaultProps} sort="action" />);
      const sortedTh = container.querySelector('th[aria-sort="ascending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort none auf inaktive Spalten', () => {
      const { container } = render(<AdminAuditLogTable {...defaultProps} sort="-createdAt" />);
      const noneSorted = container.querySelectorAll('th[aria-sort="none"]');
      expect(noneSorted.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('zeigt keine Pagination bei einer Seite', () => {
      render(<AdminAuditLogTable {...defaultProps} pagination={defaultPagination} />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('zeigt Pagination bei mehreren Seiten', () => {
      render(<AdminAuditLogTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('rendert Seiten-Buttons', () => {
      render(<AdminAuditLogTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('markiert aktuelle Seite mit aria-current', () => {
      render(<AdminAuditLogTable {...defaultProps} pagination={multiPagePagination} />);
      const activePage = screen.getByText('2');
      expect(activePage).toHaveAttribute('aria-current', 'page');
    });

    it('ruft onPageChange beim Klick auf Seite auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminAuditLogTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />,
      );

      fireEvent.click(screen.getByText('3'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('deaktiviert Prev-Button auf erster Seite', () => {
      const pag = { ...multiPagePagination, page: 1 };
      render(<AdminAuditLogTable {...defaultProps} pagination={pag} />);
      const prevBtn = screen.getByLabelText('admin.auditLog.prevPage');
      expect(prevBtn).toBeDisabled();
    });

    it('deaktiviert Next-Button auf letzter Seite', () => {
      const pag = { ...multiPagePagination, page: 3 };
      render(<AdminAuditLogTable {...defaultProps} pagination={pag} />);
      const nextBtn = screen.getByLabelText('admin.auditLog.nextPage');
      expect(nextBtn).toBeDisabled();
    });

    it('ruft onPageChange mit page-1 bei Prev-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminAuditLogTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />,
      );

      const prevBtn = screen.getByLabelText('admin.auditLog.prevPage');
      fireEvent.click(prevBtn);
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('ruft onPageChange mit page+1 bei Next-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminAuditLogTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />,
      );

      const nextBtn = screen.getByLabelText('admin.auditLog.nextPage');
      fireEvent.click(nextBtn);
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });
});
