/**
 * @fileoverview AdminSubscriberTable Tests
 * @description Tests für die AdminSubscriberTable-Komponente –
 *              Loading, Empty State, Zeilen, Sort, Pagination, Status-Badge, Delete-Confirm.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSubscriberTable from '../AdminSubscriberTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (params) return `${key} ${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

// ── Test-Daten ────────────────────────────────────

const mockSubscribers = [
  {
    _id: 'sub1',
    email: 'alice@example.com',
    isConfirmed: true,
    language: 'de',
    subscribedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    _id: 'sub2',
    email: 'bob@example.com',
    isConfirmed: false,
    language: 'en',
    subscribedAt: null,
    createdAt: '2024-02-20T14:30:00Z',
  },
  {
    _id: 'sub3',
    email: 'charlie@example.com',
    isConfirmed: true,
    language: 'ar',
    subscribedAt: '2024-03-01T09:00:00Z',
    createdAt: '2024-03-01T09:00:00Z',
  },
];

const defaultPagination = {
  total: 3,
  page: 1,
  pages: 1,
  limit: 15,
};

const multiPagePagination = {
  total: 45,
  page: 2,
  pages: 3,
  limit: 15,
};

const defaultProps = {
  subscribers: mockSubscribers,
  pagination: defaultPagination,
  loading: false,
  sort: '-createdAt',
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
  onDelete: vi.fn(),
  actionLoading: null,
};

describe('AdminSubscriberTable', () => {
  // ── Loading State ───────────────────────────────

  describe('Loading State', () => {
    it('zeigt Skeleton-Platzhalter beim Laden', () => {
      const { container } = render(<AdminSubscriberTable {...defaultProps} loading={true} subscribers={[]} />);
      expect(container.querySelector('[class*="SkeletonTableRow"], [class*="container"]')).toBeInTheDocument();
    });

    it('zeigt keine Tabelle im Loading-State', () => {
      render(<AdminSubscriberTable {...defaultProps} loading={true} subscribers={[]} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // ── Empty State ─────────────────────────────────

  describe('Empty State', () => {
    it('zeigt noResults-Nachricht bei leerer Liste', () => {
      render(<AdminSubscriberTable {...defaultProps} loading={false} subscribers={[]} />);
      expect(screen.getByText('admin.subscribers.noResults')).toBeInTheDocument();
    });
  });

  // ── Subscriber Rows ─────────────────────────────

  describe('Subscriber Rows', () => {
    it('rendert alle E-Mails', () => {
      render(<AdminSubscriberTable {...defaultProps} />);
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
    });

    it('zeigt Confirmed-Badge für bestätigte Subscriber', () => {
      render(<AdminSubscriberTable {...defaultProps} />);
      const confirmedBadges = screen.getAllByText('admin.subscribers.confirmed');
      expect(confirmedBadges.length).toBe(2); // alice + charlie
    });

    it('zeigt Pending-Badge für unbestätigte Subscriber', () => {
      render(<AdminSubscriberTable {...defaultProps} />);
      const pendingBadges = screen.getAllByText('admin.subscribers.pending');
      expect(pendingBadges.length).toBe(1); // bob
    });

    it('zeigt Sprachbezeichnung', () => {
      render(<AdminSubscriberTable {...defaultProps} />);
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('العربية')).toBeInTheDocument();
    });

    it('rendert 3 Lösch-Buttons für 3 Subscriber', () => {
      render(<AdminSubscriberTable {...defaultProps} />);
      const buttons = screen.getAllByRole('button', { name: /admin\.subscribers\.delete/ });
      expect(buttons).toHaveLength(3);
    });

    it('zeigt korrektes Datumsformat', () => {
      render(<AdminSubscriberTable {...defaultProps} />);
      expect(screen.getByText('15.01.2024')).toBeInTheDocument();
    });
  });

  // ── Delete Confirmation ─────────────────────────

  describe('Delete Confirmation', () => {
    it('zeigt Bestätigungs-Banner beim Klick auf Löschen', async () => {
      render(<AdminSubscriberTable {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /admin\.subscribers\.delete/ });
      await userEvent.click(deleteButtons[0]);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('ruft onDelete bei Bestätigung auf', async () => {
      const onDelete = vi.fn();
      render(<AdminSubscriberTable {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /admin\.subscribers\.delete/ });
      await userEvent.click(deleteButtons[0]);

      // Click the confirm-delete button
      const confirmBtn = screen.getAllByText('admin.subscribers.delete');
      // The confirm button is in the banner, find it
      const dangerBtn = confirmBtn.find((el) => el.closest('button')?.closest('[role="alert"]'));
      if (dangerBtn) {
        await userEvent.click(dangerBtn.closest('button'));
      }

      expect(onDelete).toHaveBeenCalledWith('sub1');
    });

    it('schließt Bestätigungs-Banner bei Abbrechen', async () => {
      render(<AdminSubscriberTable {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /admin\.subscribers\.delete/ });
      await userEvent.click(deleteButtons[0]);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      const cancelBtn = screen.getByText('common.cancel');
      await userEvent.click(cancelBtn);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('ruft onSortChange beim Klick auf Email-Header auf', () => {
      const onSortChange = vi.fn();
      render(<AdminSubscriberTable {...defaultProps} sort="-email" onSortChange={onSortChange} />);

      const emailHeaders = screen.getAllByText(/admin\.subscribers\.email/);
      fireEvent.click(emailHeaders[0]);

      // Current sort is '-email' (desc), clicking toggles to 'email' (asc)
      expect(onSortChange).toHaveBeenCalledWith('email');
    });

    it('setzt desc-Sort bei Klick auf inaktive Spalte', () => {
      const onSortChange = vi.fn();
      render(<AdminSubscriberTable {...defaultProps} sort="-createdAt" onSortChange={onSortChange} />);

      const emailHeaders = screen.getAllByText(/admin\.subscribers\.email/);
      fireEvent.click(emailHeaders[0]);

      expect(onSortChange).toHaveBeenCalledWith('-email');
    });

    it('setzt aria-sort descending auf aktive Spalte', () => {
      const { container } = render(<AdminSubscriberTable {...defaultProps} sort="-createdAt" />);
      const sortedTh = container.querySelector('th[aria-sort="descending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort ascending auf aktive Spalte', () => {
      const { container } = render(<AdminSubscriberTable {...defaultProps} sort="email" />);
      const sortedTh = container.querySelector('th[aria-sort="ascending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort none auf inaktive Spalten', () => {
      const { container } = render(<AdminSubscriberTable {...defaultProps} sort="-createdAt" />);
      const noneSorted = container.querySelectorAll('th[aria-sort="none"]');
      expect(noneSorted.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('zeigt keine Pagination bei einer Seite', () => {
      render(<AdminSubscriberTable {...defaultProps} pagination={defaultPagination} />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('zeigt Pagination bei mehreren Seiten', () => {
      render(<AdminSubscriberTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('rendert Seiten-Buttons', () => {
      render(<AdminSubscriberTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('markiert aktuelle Seite mit aria-current', () => {
      render(<AdminSubscriberTable {...defaultProps} pagination={multiPagePagination} />);
      const activePage = screen.getByText('2');
      expect(activePage).toHaveAttribute('aria-current', 'page');
    });

    it('ruft onPageChange beim Klick auf Seite auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminSubscriberTable
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
      render(<AdminSubscriberTable {...defaultProps} pagination={pag} />);
      const prevBtn = screen.getByLabelText('admin.subscribers.prevPage');
      expect(prevBtn).toBeDisabled();
    });

    it('deaktiviert Next-Button auf letzter Seite', () => {
      const pag = { ...multiPagePagination, page: 3 };
      render(<AdminSubscriberTable {...defaultProps} pagination={pag} />);
      const nextBtn = screen.getByLabelText('admin.subscribers.nextPage');
      expect(nextBtn).toBeDisabled();
    });

    it('ruft onPageChange mit page-1 bei Prev-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminSubscriberTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />,
      );

      const prevBtn = screen.getByLabelText('admin.subscribers.prevPage');
      fireEvent.click(prevBtn);
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('ruft onPageChange mit page+1 bei Next-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminSubscriberTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />,
      );

      const nextBtn = screen.getByLabelText('admin.subscribers.nextPage');
      fireEvent.click(nextBtn);
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });
});
