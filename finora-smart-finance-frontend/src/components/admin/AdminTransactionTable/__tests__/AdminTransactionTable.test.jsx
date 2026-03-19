/**
 * @fileoverview AdminTransactionTable Tests
 * @description Tests für die AdminTransactionTable-Komponente –
 *              Loading, Empty State, Zeilen, Sort, Pagination, View-Button, Formatierung.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTransactionTable from '../AdminTransactionTable';

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

vi.mock('@/utils/categoryTranslations', () => ({
  translateCategory: cat => `translated_${cat}`,
}));

// ── Test-Daten ────────────────────────────────────

const mockTransactions = [
  {
    _id: 'tx1',
    description: 'Gehalt Januar',
    amount: 3000,
    category: 'Gehalt',
    type: 'income',
    date: '2024-01-31',
    userId: { _id: 'u1', name: 'Alice Müller', email: 'alice@example.com' },
  },
  {
    _id: 'tx2',
    description: 'Miete Februar',
    amount: 800,
    category: 'Miete',
    type: 'expense',
    date: '2024-02-01',
    userId: { _id: 'u2', name: 'Bob Admin', email: 'bob@example.com' },
  },
  {
    _id: 'tx3',
    description: 'Lebensmittel',
    amount: 45.5,
    category: 'Lebensmittel',
    type: 'expense',
    date: '2024-02-05',
    userId: null,
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
  transactions: mockTransactions,
  pagination: defaultPagination,
  loading: false,
  sort: '-date',
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
  onViewTransaction: vi.fn(),
  actionLoading: null,
};

describe('AdminTransactionTable', () => {
  // ── Loading State ───────────────────────────────

  describe('Loading State', () => {
    it('zeigt Skeleton-Platzhalter beim Laden', () => {
      const { container } = render(
        <AdminTransactionTable {...defaultProps} loading={true} transactions={[]} />
      );
      expect(
        container.querySelector('[class*="SkeletonTableRow"], [class*="container"]')
      ).toBeInTheDocument();
    });

    it('zeigt keine Tabelle im Loading-State', () => {
      render(<AdminTransactionTable {...defaultProps} loading={true} transactions={[]} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // ── Empty State ─────────────────────────────────

  describe('Empty State', () => {
    it('zeigt noResults-Nachricht bei leerer Liste', () => {
      render(<AdminTransactionTable {...defaultProps} loading={false} transactions={[]} />);
      expect(screen.getByText('admin.transactions.noResults')).toBeInTheDocument();
    });
  });

  // ── Transaction Rows ────────────────────────────

  describe('Transaction Rows', () => {
    it('rendert alle Beschreibungen', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      expect(screen.getByText('Gehalt Januar')).toBeInTheDocument();
      expect(screen.getByText('Miete Februar')).toBeInTheDocument();
      expect(screen.getByText('Lebensmittel')).toBeInTheDocument();
    });

    it('rendert übersetzte Kategorien', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      expect(screen.getByText('translated_Gehalt')).toBeInTheDocument();
      expect(screen.getByText('translated_Miete')).toBeInTheDocument();
      expect(screen.getByText('translated_Lebensmittel')).toBeInTheDocument();
    });

    it('zeigt Income-Badge für Einnahmen', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      const incomeBadges = screen.getAllByText('admin.transactions.income');
      expect(incomeBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt Expense-Badge für Ausgaben', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      const expenseBadges = screen.getAllByText('admin.transactions.expense');
      expect(expenseBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt Benutzernamen', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    });

    it('zeigt — für fehlenden Benutzer', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('zeigt korrektes Datumsformat', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      expect(screen.getByText('31.01.2024')).toBeInTheDocument();
      expect(screen.getByText('01.02.2024')).toBeInTheDocument();
    });

    it('formatiert Beträge korrekt', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      // income: +3.000,00 € / expense: -800,00 €
      expect(screen.getByText(/\+3\.000,00\s€/)).toBeInTheDocument();
      expect(screen.getByText(/-800,00\s€/)).toBeInTheDocument();
    });

    it('rendert 3 View-Buttons für 3 Transaktionen', () => {
      render(<AdminTransactionTable {...defaultProps} />);
      const buttons = screen.getAllByRole('button', { name: /admin\.transactions\.viewDetails/ });
      expect(buttons).toHaveLength(3);
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('ruft onSortChange beim Klick auf Date-Header auf', () => {
      const onSortChange = vi.fn();
      render(<AdminTransactionTable {...defaultProps} onSortChange={onSortChange} />);

      // Date header has sort icon since sort='-date'
      const dateHeaders = screen.getAllByText(/admin\.transactions\.date/);
      fireEvent.click(dateHeaders[0]);

      // Current sort is '-date' (desc), clicking toggles to 'date' (asc)
      expect(onSortChange).toHaveBeenCalledWith('date');
    });

    it('setzt desc-Sort bei Klick auf inaktive Spalte', () => {
      const onSortChange = vi.fn();
      render(<AdminTransactionTable {...defaultProps} sort="-date" onSortChange={onSortChange} />);

      const amountHeaders = screen.getAllByText(/admin\.transactions\.amount/);
      fireEvent.click(amountHeaders[0]);

      expect(onSortChange).toHaveBeenCalledWith('-amount');
    });

    it('setzt aria-sort descending auf aktive Spalte', () => {
      const { container } = render(<AdminTransactionTable {...defaultProps} sort="-date" />);
      const sortedTh = container.querySelector('th[aria-sort="descending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort ascending auf aktive Spalte', () => {
      const { container } = render(<AdminTransactionTable {...defaultProps} sort="amount" />);
      const sortedTh = container.querySelector('th[aria-sort="ascending"]');
      expect(sortedTh).toBeInTheDocument();
    });

    it('setzt aria-sort none auf inaktive Spalten', () => {
      const { container } = render(<AdminTransactionTable {...defaultProps} sort="-date" />);
      const noneSorted = container.querySelectorAll('th[aria-sort="none"]');
      expect(noneSorted.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('zeigt keine Pagination bei einer Seite', () => {
      render(<AdminTransactionTable {...defaultProps} pagination={defaultPagination} />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('zeigt Pagination bei mehreren Seiten', () => {
      render(<AdminTransactionTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('rendert Seiten-Buttons', () => {
      render(<AdminTransactionTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('markiert aktuelle Seite mit aria-current', () => {
      render(<AdminTransactionTable {...defaultProps} pagination={multiPagePagination} />);
      const activePage = screen.getByText('2');
      expect(activePage).toHaveAttribute('aria-current', 'page');
    });

    it('ruft onPageChange beim Klick auf Seite auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminTransactionTable
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
      render(<AdminTransactionTable {...defaultProps} pagination={pag} />);
      const prevBtn = screen.getByLabelText('admin.transactions.prevPage');
      expect(prevBtn).toBeDisabled();
    });

    it('deaktiviert Next-Button auf letzter Seite', () => {
      const pag = { ...multiPagePagination, page: 3 };
      render(<AdminTransactionTable {...defaultProps} pagination={pag} />);
      const nextBtn = screen.getByLabelText('admin.transactions.nextPage');
      expect(nextBtn).toBeDisabled();
    });

    it('ruft onPageChange mit page-1 bei Prev-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminTransactionTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByLabelText('admin.transactions.prevPage'));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('ruft onPageChange mit page+1 bei Next-Klick auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminTransactionTable
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByLabelText('admin.transactions.nextPage'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('zeigt Showing-Info', () => {
      render(<AdminTransactionTable {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByText(/admin\.transactions\.showing/)).toBeInTheDocument();
    });
  });

  // ── View Button ─────────────────────────────────

  describe('View Button', () => {
    it('ruft onViewTransaction mit Transaction-Objekt beim Klick auf', () => {
      const onViewTransaction = vi.fn();
      render(<AdminTransactionTable {...defaultProps} onViewTransaction={onViewTransaction} />);

      const viewButtons = screen.getAllByRole('button', {
        name: /admin\.transactions\.viewDetails/,
      });
      fireEvent.click(viewButtons[0]);

      expect(onViewTransaction).toHaveBeenCalledWith(mockTransactions[0]);
    });

    it('deaktiviert View-Button bei laufender Aktion', () => {
      render(<AdminTransactionTable {...defaultProps} actionLoading="tx1" />);

      const buttons = screen.getAllByRole('button', { name: /admin\.transactions\.viewDetails/ });
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).not.toBeDisabled();
    });
  });
});
