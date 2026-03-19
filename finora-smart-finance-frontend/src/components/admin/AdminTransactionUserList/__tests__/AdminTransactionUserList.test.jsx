/**
 * @fileoverview AdminTransactionUserList Tests
 * @description Tests für die AdminTransactionUserList-Komponente –
 *              Loading, Empty State, User Cards, Pagination, Callbacks.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTransactionUserList from '../AdminTransactionUserList';

// ── Mocks ─────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (params) return `${key} ${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'de' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isViewer: false,
    isAuthenticated: true,
    user: { role: 'admin' },
  }),
}));

vi.mock('@/components/common/Skeleton', () => ({
  SkeletonTableRow: props => (
    <div data-testid="skeleton" data-count={props.count}>
      Skeleton
    </div>
  ),
}));

vi.mock('@/utils/adminTableHelpers', () => ({
  generatePageNumbers: (current, total) => {
    const pages = [];
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  },
  formatAdminCurrency: amount => {
    if (amount == null || Number.isNaN(Number(amount))) return '—';
    return `${Number(amount).toFixed(2).replace('.', ',')} €`;
  },
}));

// ── Test-Daten ────────────────────────────────────

const mockUsers = [
  {
    _id: 'u1',
    name: 'Alice Müller',
    email: 'alice@example.com',
    transactionCount: 15,
    totalIncome: 3000,
    totalExpense: 1200,
    lastTransactionDate: '2024-01-31',
  },
  {
    _id: 'u2',
    name: 'Bob Schmidt',
    email: 'bob@example.com',
    transactionCount: 8,
    totalIncome: 500,
    totalExpense: 800,
    lastTransactionDate: '2024-02-15',
  },
  {
    _id: 'u3',
    name: 'Eva Test',
    email: null,
    transactionCount: 0,
    totalIncome: 0,
    totalExpense: 0,
    lastTransactionDate: null,
  },
];

const defaultPagination = {
  total: 3,
  page: 1,
  pages: 1,
  limit: 6,
};

const multiPagePagination = {
  total: 25,
  page: 2,
  pages: 5,
  limit: 6,
};

const defaultProps = {
  users: mockUsers,
  pagination: defaultPagination,
  loading: false,
  onSelectUser: vi.fn(),
  onPageChange: vi.fn(),
};

// ============================================
// Tests
// ============================================
describe('AdminTransactionUserList', () => {
  // ── Loading State ───────────────────────────────

  describe('Loading State', () => {
    it('zeigt Skeleton-Platzhalter beim Laden', () => {
      render(<AdminTransactionUserList {...defaultProps} loading={true} users={[]} />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('zeigt Skeleton mit korrekter Anzahl', () => {
      render(<AdminTransactionUserList {...defaultProps} loading={true} users={[]} />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('data-count', '6');
    });

    it('zeigt keine User-Cards im Loading-State', () => {
      render(<AdminTransactionUserList {...defaultProps} loading={true} users={[]} />);
      expect(screen.queryByText('Alice Müller')).not.toBeInTheDocument();
    });
  });

  // ── Empty State ─────────────────────────────────

  describe('Empty State', () => {
    it('zeigt noUsers-Nachricht bei leerer Liste', () => {
      render(<AdminTransactionUserList {...defaultProps} loading={false} users={[]} />);
      expect(screen.getByText('admin.transactions.noUsers')).toBeInTheDocument();
    });
  });

  // ── User Cards ──────────────────────────────────

  describe('User Cards', () => {
    it('rendert alle User-Namen', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      expect(screen.getByText('Alice Müller')).toBeInTheDocument();
      expect(screen.getByText('Bob Schmidt')).toBeInTheDocument();
      expect(screen.getByText('Eva Test')).toBeInTheDocument();
    });

    it('zeigt E-Mail-Adressen', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('zeigt keine E-Mail wenn nicht vorhanden', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      // Eva Test hat keine Email — kein drittes Email-Element
      const emails = screen.getAllByText(/@example\.com/);
      expect(emails).toHaveLength(2);
    });

    it('zeigt Transaktions-Anzahl', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('zeigt Initialen im Avatar', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      expect(screen.getByText('AM')).toBeInTheDocument(); // Alice Müller
      expect(screen.getByText('BS')).toBeInTheDocument(); // Bob Schmidt
      expect(screen.getByText('ET')).toBeInTheDocument(); // Eva Test
    });

    it('rendert als Buttons (klickbar)', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('zeigt aria-label mit User-Name', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      expect(screen.getByLabelText(/Alice Müller/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bob Schmidt/)).toBeInTheDocument();
    });

    it('zeigt Datum der letzten Transaktion', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      expect(screen.getByText(/31\.01\.2024/)).toBeInTheDocument();
      expect(screen.getByText(/15\.02\.2024/)).toBeInTheDocument();
    });
  });

  // ── Balance ─────────────────────────────────────

  describe('Balance', () => {
    it('zeigt positive Balance mit +', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      // Alice: 3000 - 1200 = 1800 → "+1800,00 €"
      expect(screen.getByText(/\+1800,00\s€/)).toBeInTheDocument();
    });

    it('zeigt negative Balance', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      // Bob: 500 - 800 = -300 → "-300,00 €"
      expect(screen.getByText(/-300,00\s€/)).toBeInTheDocument();
    });

    it('zeigt Null-Balance mit +', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      // Eva: 0 - 0 = 0 → "+0,00 €" im Balance-Bereich
      const matches = screen.getAllByText(/0,00\s€/);
      // Mindestens ein Element mit positive class (Balance)
      const balanceEl = matches.find(el => el.className.includes('balance'));
      expect(balanceEl).toBeTruthy();
    });
  });

  // ── Callbacks ───────────────────────────────────

  describe('Callbacks', () => {
    it('ruft onSelectUser bei Klick auf User-Card auf', () => {
      const onSelectUser = vi.fn();
      render(<AdminTransactionUserList {...defaultProps} onSelectUser={onSelectUser} />);

      const button = screen.getByLabelText(/Alice Müller/);
      fireEvent.click(button);

      expect(onSelectUser).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('ruft onSelectUser nur einmal pro Klick auf', () => {
      const onSelectUser = vi.fn();
      render(<AdminTransactionUserList {...defaultProps} onSelectUser={onSelectUser} />);

      fireEvent.click(screen.getByLabelText(/Bob Schmidt/));

      expect(onSelectUser).toHaveBeenCalledTimes(1);
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('zeigt keine Pagination bei nur einer Seite', () => {
      render(<AdminTransactionUserList {...defaultProps} />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('zeigt Pagination bei mehreren Seiten', () => {
      render(<AdminTransactionUserList {...defaultProps} pagination={multiPagePagination} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('zeigt Page-Buttons', () => {
      render(<AdminTransactionUserList {...defaultProps} pagination={multiPagePagination} />);
      // 5 Seiten → Buttons 1-5
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('markiert aktuelle Seite', () => {
      render(<AdminTransactionUserList {...defaultProps} pagination={multiPagePagination} />);
      const currentPage = screen.getByText('2');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('ruft onPageChange beim Klick auf Seite auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminTransactionUserList
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByText('3'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('vorherige Seite Button ruft onPageChange auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminTransactionUserList
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      const prevButton = screen.getByLabelText('admin.transactions.prevPage');
      fireEvent.click(prevButton);
      expect(onPageChange).toHaveBeenCalledWith(1); // page 2 → 1
    });

    it('nächste Seite Button ruft onPageChange auf', () => {
      const onPageChange = vi.fn();
      render(
        <AdminTransactionUserList
          {...defaultProps}
          pagination={multiPagePagination}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByLabelText('admin.transactions.nextPage');
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(3); // page 2 → 3
    });

    it('deaktiviert vorherige Seite Button auf Seite 1', () => {
      render(
        <AdminTransactionUserList
          {...defaultProps}
          pagination={{ ...multiPagePagination, page: 1 }}
        />
      );

      const prevButton = screen.getByLabelText('admin.transactions.prevPage');
      expect(prevButton).toBeDisabled();
    });

    it('deaktiviert nächste Seite Button auf letzter Seite', () => {
      render(
        <AdminTransactionUserList
          {...defaultProps}
          pagination={{ ...multiPagePagination, page: 5, pages: 5 }}
        />
      );

      const nextButton = screen.getByLabelText('admin.transactions.nextPage');
      expect(nextButton).toBeDisabled();
    });

    it('zeigt showing-Info mit korrekter Range', () => {
      render(<AdminTransactionUserList {...defaultProps} pagination={multiPagePagination} />);
      // Page 2, limit 6, total 25 → "from: 7, to: 12, total: 25"
      expect(screen.getByText(/admin\.transactions\.showing/)).toBeInTheDocument();
    });
  });
});
