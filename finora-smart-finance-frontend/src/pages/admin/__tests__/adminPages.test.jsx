/**
 * @fileoverview Tests für Admin-Seiten
 * @description Tests für AdminDashboardPage, AdminUsersPage, AdminTransactionsPage
 *              und die Platzhalter-Seiten (Subscribers, AuditLog).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../AdminDashboardPage';
import AdminUsersPage from '../AdminUsersPage';
import AdminTransactionsPage from '../AdminTransactionsPage';
import AdminSubscribersPage from '../AdminSubscribersPage';
import AdminAuditLogPage from '../AdminAuditLogPage';
import AdminLifecyclePage from '../AdminLifecyclePage';

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

vi.mock('@/hooks/useViewerGuard', () => ({
  useViewerGuard: () => ({ isViewer: false, guard: fn => fn() }),
}));

// ── Mock useAdminDashboard + useAdminUsers + useToast ──
const mockRefresh = vi.fn();
const mockDashboardHook = {
  stats: null,
  transactionStats: null,
  subscriberStats: null,
  loading: true,
  error: null,
  refresh: mockRefresh,
};

const mockUsersActions = {
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  changeRole: vi.fn(),
  deleteUser: vi.fn(),
  resetPassword: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  refresh: vi.fn(),
};

const mockUsersFilters = {
  search: '',
  setSearch: vi.fn(),
  roleFilter: '',
  setRoleFilter: vi.fn(),
  statusFilter: '',
  setStatusFilter: vi.fn(),
  verifiedFilter: '',
  setVerifiedFilter: vi.fn(),
  sort: '-createdAt',
  setSort: vi.fn(),
  page: 1,
  setPage: vi.fn(),
};

const mockUsersHook = {
  users: [],
  pagination: { total: 0, page: 1, pages: 1, limit: 10 },
  loading: true,
  error: null,
  actionLoading: null,
  filters: mockUsersFilters,
  actions: mockUsersActions,
};

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

// ── Mock useAdminTransactions ─────────────────────
const mockTxActions = {
  deleteTransaction: vi.fn(),
  refresh: vi.fn(),
};

const mockTxFilters = {
  search: '',
  setSearch: vi.fn(),
  typeFilter: '',
  setTypeFilter: vi.fn(),
  categoryFilter: '',
  setCategoryFilter: vi.fn(),
  startDate: '',
  setStartDate: vi.fn(),
  endDate: '',
  setEndDate: vi.fn(),
  sort: '-date',
  setSort: vi.fn(),
  page: 1,
  setPage: vi.fn(),
  userId: '',
  setUserId: vi.fn(),
};

const mockTxHook = {
  transactions: [],
  pagination: { total: 0, page: 1, pages: 1, limit: 15 },
  loading: true,
  error: null,
  actionLoading: null,
  filters: mockTxFilters,
  actions: mockTxActions,
};

// ── Mock useAdminTransactionUsers ─────────────────
const mockTxUsersFilters = {
  search: '',
  setSearch: vi.fn(),
  sort: '-transactionCount',
  setSort: vi.fn(),
  page: 1,
  setPage: vi.fn(),
};

const mockTxUsersHook = {
  users: [
    {
      _id: 'u1',
      name: 'Alice',
      email: 'alice@test.com',
      transactionCount: 5,
      totalIncome: 1000,
      totalExpense: 500,
    },
  ],
  pagination: { total: 1, page: 1, pages: 1, limit: 12 },
  loading: false,
  error: null,
  filters: mockTxUsersFilters,
  refresh: vi.fn(),
};

// ── Mock useAdminSubscribers ──────────────────────
const mockSubActions = {
  deleteSubscriber: vi.fn(),
  refresh: vi.fn(),
};

const mockSubFilters = {
  search: '',
  setSearch: vi.fn(),
  confirmedFilter: '',
  setConfirmedFilter: vi.fn(),
  languageFilter: '',
  setLanguageFilter: vi.fn(),
  sort: '-createdAt',
  setSort: vi.fn(),
  page: 1,
  setPage: vi.fn(),
};

const mockSubHook = {
  subscribers: [],
  pagination: { total: 0, page: 1, pages: 1, limit: 15 },
  loading: true,
  error: null,
  actionLoading: null,
  filters: mockSubFilters,
  actions: mockSubActions,
};

// ── Mock useAdminAuditLog ─────────────────────────
const mockAuditActions = {
  refresh: vi.fn(),
};

const mockAuditFilters = {
  actionFilter: '',
  setActionFilter: vi.fn(),
  startDate: '',
  setStartDate: vi.fn(),
  endDate: '',
  setEndDate: vi.fn(),
  sort: '-createdAt',
  setSort: vi.fn(),
  page: 1,
  setPage: vi.fn(),
};

const mockAuditHook = {
  logs: [],
  stats: null,
  pagination: { total: 0, page: 1, pages: 1, limit: 20 },
  loading: true,
  error: null,
  filters: mockAuditFilters,
  actions: mockAuditActions,
  selection: {
    selectedIds: new Set(),
    handleSelectId: vi.fn(),
    handleSelectAll: vi.fn(),
    handleClearSelection: vi.fn(),
  },
};

// ── Mock useAdminLifecycle ────────────────────────
const mockLifecycleActions = {
  refresh: vi.fn(),
  fetchUserDetail: vi.fn(),
  resetRetention: vi.fn(),
  triggerProcessing: vi.fn(),
  dismissTriggerResult: vi.fn(),
  closeDetail: vi.fn(),
};

const mockLifecycleHook = {
  stats: null,
  userDetail: null,
  triggerResult: null,
  loading: true,
  actionLoading: null,
  error: null,
  actions: mockLifecycleActions,
};

vi.mock('@/hooks', () => ({
  useAdminDashboard: () => mockDashboardHook,
  useAdminUsers: () => mockUsersHook,
  useAdminTransactions: () => mockTxHook,
  useAdminTransactionUsers: () => mockTxUsersHook,
  useAdminSubscribers: () => mockSubHook,
  useAdminAuditLog: () => mockAuditHook,
  useAdminLifecycle: () => mockLifecycleHook,
  useToast: () => mockToast,
  useAuth: () => ({ user: { name: 'Test Admin', email: 'admin@test.de' }, isAuthenticated: true }),
}));

// ── Mock Kategorie-Übersetzungen ──────────────────
vi.mock('@/utils/categoryTranslations', () => ({
  translateCategory: cat => `translated_${cat}`,
}));

vi.mock('@/config/categoryConstants', () => ({
  ALL_CATEGORIES: ['Gehalt', 'Miete', 'Lebensmittel'],
}));

// ── Mock Admin-Komponenten ────────────────────────
vi.mock('@/components/admin', () => ({
  AdminStatCard: ({ label, value, isLoading }) => (
    <div
      data-testid="stat-card"
      data-label={label}
      data-value={value}
      data-loading={isLoading}
      role="listitem"
    >
      {label}: {value}
    </div>
  ),
  AdminCharts: ({ loading }) => (
    <div data-testid="admin-charts" data-loading={loading}>
      Charts
    </div>
  ),
  AdminRecentUsers: ({ users, loading }) => (
    <div
      data-testid="admin-recent-users"
      data-loading={loading}
      data-user-count={users?.length || 0}
    >
      Recent Users
    </div>
  ),
  AdminUserTable: ({ users, pagination, loading, onViewUser }) => (
    <div data-testid="admin-user-table" data-loading={loading} data-user-count={users?.length || 0}>
      {users?.map(u => (
        <div key={u._id} data-testid={`user-row-${u._id}`}>
          {u.name}
          <button data-testid={`view-${u._id}`} onClick={() => onViewUser?.(u)}>
            View
          </button>
        </div>
      ))}
      {pagination && <span data-testid="pagination-total">{pagination.total}</span>}
    </div>
  ),
  AdminUserDetail: ({ user, isOpen, onClose }) =>
    isOpen && user ? (
      <div data-testid="admin-user-detail" data-user-id={user._id}>
        {user.name}
        <button data-testid="close-detail" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  AdminTransactionTable: ({ transactions, pagination, loading, onViewTransaction }) => (
    <div
      data-testid="admin-tx-table"
      data-loading={loading}
      data-tx-count={transactions?.length || 0}
    >
      {transactions?.map(tx => (
        <div key={tx._id} data-testid={`tx-row-${tx._id}`}>
          {tx.description}
          <button data-testid={`view-tx-${tx._id}`} onClick={() => onViewTransaction?.(tx)}>
            View
          </button>
        </div>
      ))}
      {pagination && <span data-testid="tx-pagination-total">{pagination.total}</span>}
    </div>
  ),
  AdminTransactionDetail: ({ transaction, isOpen, onClose }) =>
    isOpen && transaction ? (
      <div data-testid="admin-tx-detail" data-tx-id={transaction._id}>
        {transaction.description}
        <button data-testid="close-tx-detail" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  AdminTransactionUserList: ({ users, loading, onSelectUser }) => (
    <div
      data-testid="admin-tx-user-list"
      data-loading={loading}
      data-user-count={users?.length || 0}
    >
      {users?.map(u => (
        <div key={u._id} data-testid={`tx-user-${u._id}`}>
          {u.name}
          <button data-testid={`select-user-${u._id}`} onClick={() => onSelectUser?.(u)}>
            Select
          </button>
        </div>
      ))}
    </div>
  ),
  AdminSubscriberTable: ({ subscribers, pagination, loading, onDelete, onViewSubscriber }) => (
    <div
      data-testid="admin-sub-table"
      data-loading={loading}
      data-sub-count={subscribers?.length || 0}
    >
      {subscribers?.map(s => (
        <div key={s._id} data-testid={`sub-row-${s._id}`}>
          {s.email}
          <button data-testid={`view-sub-${s._id}`} onClick={() => onViewSubscriber?.(s)}>
            View
          </button>
          <button data-testid={`delete-sub-${s._id}`} onClick={() => onDelete?.(s._id)}>
            Delete
          </button>
        </div>
      ))}
      {pagination && <span data-testid="sub-pagination-total">{pagination.total}</span>}
    </div>
  ),
  AdminCreateUser: ({ isOpen, onClose, onSubmit, loading }) =>
    isOpen ? (
      <div data-testid="admin-create-user" data-loading={loading}>
        <button
          data-testid="submit-create-user"
          onClick={() =>
            onSubmit?.({ name: 'New', email: 'new@test.com', password: 'Abc123!x', role: 'user' })
          }
        >
          Submit
        </button>
        <button data-testid="close-create-user" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  AdminSubscriberDetail: ({ subscriber, isOpen, onClose }) =>
    isOpen && subscriber ? (
      <div data-testid="admin-sub-detail" data-sub-id={subscriber._id}>
        {subscriber.email}
        <button data-testid="close-sub-detail" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  AdminAuditLogTable: ({ logs, pagination, loading }) => (
    <div data-testid="admin-audit-table" data-loading={loading} data-log-count={logs?.length || 0}>
      {logs?.map(log => (
        <div key={log._id} data-testid={`log-row-${log._id}`}>
          {log.action}
        </div>
      ))}
      {pagination && <span data-testid="audit-pagination-total">{pagination.total}</span>}
    </div>
  ),
}));

// FilterDropdown – renders native <select> in tests for easy interaction
vi.mock('@/components/common/FilterDropdown/FilterDropdown', () => ({
  default: ({ options, value, onChange, ariaLabel, disabled, placeholder }) => (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

// DateInput – renders native <input type="date"> in tests for easy interaction
vi.mock('@/components/common/DateInput/DateInput', () => ({
  default: ({ value, onChange, label, ariaLabel, disabled }) => (
    <label>
      {label}
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        aria-label={ariaLabel || label}
        disabled={disabled}
      />
    </label>
  ),
}));

const renderPage = Component => {
  return render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  );
};

// ── Hilfsfunktion um Hook-Daten zu setzen ─────────
function setDashboardState(overrides) {
  Object.assign(mockDashboardHook, {
    stats: null,
    transactionStats: null,
    subscriberStats: null,
    loading: false,
    error: null,
    refresh: mockRefresh,
    ...overrides,
  });
}

function setUsersState(overrides) {
  Object.assign(mockUsersHook, {
    users: [],
    pagination: { total: 0, page: 1, pages: 1, limit: 10 },
    loading: false,
    error: null,
    actionLoading: null,
    filters: mockUsersFilters,
    actions: mockUsersActions,
    ...overrides,
  });
}

function setTransactionsState(overrides) {
  Object.assign(mockTxHook, {
    transactions: [],
    pagination: { total: 0, page: 1, pages: 1, limit: 15 },
    loading: false,
    error: null,
    actionLoading: null,
    filters: mockTxFilters,
    actions: mockTxActions,
    ...overrides,
  });
}

function setSubscribersState(overrides) {
  Object.assign(mockSubHook, {
    subscribers: [],
    pagination: { total: 0, page: 1, pages: 1, limit: 15 },
    loading: false,
    error: null,
    actionLoading: null,
    filters: mockSubFilters,
    actions: mockSubActions,
    ...overrides,
  });
}

function setAuditLogState(overrides) {
  Object.assign(mockAuditHook, {
    logs: [],
    stats: null,
    pagination: { total: 0, page: 1, pages: 1, limit: 20 },
    loading: false,
    error: null,
    filters: mockAuditFilters,
    actions: mockAuditActions,
    selection: {
      selectedIds: new Set(),
      handleSelectId: vi.fn(),
      handleSelectAll: vi.fn(),
      handleClearSelection: vi.fn(),
    },
    ...overrides,
  });
}

function setLifecycleState(overrides) {
  Object.assign(mockLifecycleHook, {
    stats: null,
    userDetail: null,
    triggerResult: null,
    loading: false,
    actionLoading: null,
    error: null,
    actions: mockLifecycleActions,
    ...overrides,
  });
}

describe('Admin Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to loading state
    setDashboardState({ loading: true });
    setUsersState({ loading: true });
    setTransactionsState({ loading: true });
    setSubscribersState({ loading: true });
    setAuditLogState({ loading: true });
    setLifecycleState({ loading: true });
  });

  // ══════════════════════════════════════════════════
  // AdminDashboardPage (vollständig implementiert)
  // ══════════════════════════════════════════════════

  describe('AdminDashboardPage', () => {
    describe('Loading State', () => {
      it('rendert Titel und Subtitle', () => {
        setDashboardState({ loading: true });
        renderPage(AdminDashboardPage);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'admin.dashboard.title'
        );
        expect(screen.getByText('admin.dashboard.subtitle')).toBeInTheDocument();
      });

      it('rendert 8 Stat-Cards im Loading-Zustand', () => {
        setDashboardState({ loading: true });
        renderPage(AdminDashboardPage);

        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(8);
        statCards.forEach(card => {
          expect(card).toHaveAttribute('data-loading', 'true');
        });
      });

      it('rendert Charts-Sektion im Loading-Zustand', () => {
        setDashboardState({ loading: true });
        renderPage(AdminDashboardPage);

        const charts = screen.getByTestId('admin-charts');
        expect(charts).toHaveAttribute('data-loading', 'true');
      });

      it('rendert Recent-Users im Loading-Zustand', () => {
        setDashboardState({ loading: true });
        renderPage(AdminDashboardPage);

        const recentUsers = screen.getByTestId('admin-recent-users');
        expect(recentUsers).toHaveAttribute('data-loading', 'true');
      });

      it('deaktiviert Refresh-Button bei Loading', () => {
        setDashboardState({ loading: true });
        renderPage(AdminDashboardPage);

        const refreshBtn = screen.getByRole('button', { name: 'admin.dashboard.refresh' });
        expect(refreshBtn).toBeDisabled();
      });
    });

    describe('Loaded State', () => {
      const fullStats = {
        overview: {
          totalUsers: 120,
          verifiedUsers: 100,
          bannedUsers: 3,
          adminUsers: 2,
          usersLast7Days: 8,
          totalTransactions: 450,
        },
        recentUsers: [{ _id: 'u1', name: 'Alice', isVerified: true, role: 'user' }],
      };
      const fullTxStats = {
        totalCount: 450,
        last7DaysCount: 32,
        totalIncome: 15000,
        totalExpense: 9500,
      };
      const fullSubStats = {
        totalCount: 55,
        confirmedCount: 40,
      };

      beforeEach(() => {
        setDashboardState({
          loading: false,
          stats: fullStats,
          transactionStats: fullTxStats,
          subscriberStats: fullSubStats,
        });
      });

      it('zeigt 8 Stat-Cards mit Daten', () => {
        renderPage(AdminDashboardPage);

        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(8);
        statCards.forEach(card => {
          expect(card).toHaveAttribute('data-loading', 'false');
        });
      });

      it('zeigt korrekte Stat-Labels', () => {
        renderPage(AdminDashboardPage);

        expect(screen.getByText(/admin\.dashboard\.totalUsers/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.dashboard\.verifiedUsers/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.dashboard\.bannedUsers/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.dashboard\.adminUsers/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.dashboard\.totalTransactions/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.dashboard\.totalIncome/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.dashboard\.totalExpenses/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.dashboard\.subscribers/)).toBeInTheDocument();
      });

      it('aktiviert Refresh-Button', () => {
        renderPage(AdminDashboardPage);

        const refreshBtn = screen.getByRole('button', { name: 'admin.dashboard.refresh' });
        expect(refreshBtn).not.toBeDisabled();
      });

      it('ruft refresh() bei Klick auf Refresh-Button auf', async () => {
        renderPage(AdminDashboardPage);

        const refreshBtn = screen.getByRole('button', { name: 'admin.dashboard.refresh' });
        await userEvent.click(refreshBtn);

        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });

      it('übergibt recentUsers an AdminRecentUsers', () => {
        renderPage(AdminDashboardPage);

        const recentUsersEl = screen.getByTestId('admin-recent-users');
        expect(recentUsersEl).toHaveAttribute('data-user-count', '1');
      });

      it('rendert Charts mit Daten', () => {
        renderPage(AdminDashboardPage);

        const charts = screen.getByTestId('admin-charts');
        expect(charts).toHaveAttribute('data-loading', 'false');
      });

      it('hat aria-labels für Sektionen', () => {
        renderPage(AdminDashboardPage);

        expect(
          screen.getByRole('region', { name: 'admin.dashboard.statsLabel' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('region', { name: 'admin.dashboard.chartsLabel' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('region', { name: 'admin.dashboard.recentUsers' })
        ).toBeInTheDocument();
      });
    });

    describe('Error State', () => {
      it('zeigt Fehlermeldung', () => {
        setDashboardState({ loading: false, error: 'Server Error' });
        renderPage(AdminDashboardPage);

        expect(screen.getByText('Server Error')).toBeInTheDocument();
      });

      it('zeigt Retry-Button im Fehlerzustand', () => {
        setDashboardState({ loading: false, error: 'Unauthorized' });
        renderPage(AdminDashboardPage);

        expect(screen.getByText('admin.dashboard.retry')).toBeInTheDocument();
      });

      it('ruft refresh() bei Klick auf Retry-Button auf', async () => {
        setDashboardState({ loading: false, error: 'Connection failed' });
        renderPage(AdminDashboardPage);

        const retryBtn = screen.getByText('admin.dashboard.retry');
        await userEvent.click(retryBtn);

        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });

      it('zeigt keine Stat-Cards im Fehlerzustand', () => {
        setDashboardState({ loading: false, error: 'Error' });
        renderPage(AdminDashboardPage);

        expect(screen.queryAllByTestId('stat-card')).toHaveLength(0);
      });
    });

    describe('Edge Cases', () => {
      it('zeigt "—" wenn Overview-Daten fehlen', () => {
        setDashboardState({
          loading: false,
          stats: { overview: {}, recentUsers: [] },
          transactionStats: {},
          subscriberStats: {},
        });
        renderPage(AdminDashboardPage);

        const statCards = screen.getAllByTestId('stat-card');
        // Prüfe dass Cards mit Fallback-Werten ("—") gerendert werden
        const dashValues = statCards.filter(c => c.getAttribute('data-value') === '—');
        expect(dashValues.length).toBeGreaterThan(0);
      });
    });
  });

  // ══════════════════════════════════════════════════
  // Platzhalter-Seiten (unverändert)
  // ══════════════════════════════════════════════════

  // ══════════════════════════════════════════════════
  // AdminUsersPage (vollständig implementiert)
  // ══════════════════════════════════════════════════

  describe('AdminUsersPage', () => {
    const mockUsersList = [
      {
        _id: 'u1',
        name: 'Alice',
        email: 'a@b.com',
        role: 'user',
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        _id: 'u2',
        name: 'Bob',
        email: 'b@b.com',
        role: 'admin',
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-14T10:00:00Z',
      },
    ];

    describe('Loading State', () => {
      it('rendert Titel', () => {
        setUsersState({ loading: true });
        renderPage(AdminUsersPage);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('admin.users.title');
      });

      it('rendert Subtitle', () => {
        setUsersState({ loading: true });
        renderPage(AdminUsersPage);
        expect(screen.getByText(/admin\.users\.subtitle/)).toBeInTheDocument();
      });

      it('deaktiviert Refresh-Button bei Loading', () => {
        setUsersState({ loading: true });
        renderPage(AdminUsersPage);
        const refreshBtn = screen.getByRole('button', { name: 'admin.users.refresh' });
        expect(refreshBtn).toBeDisabled();
      });

      it('rendert die Tabellen-Komponente im Loading-Zustand', () => {
        setUsersState({ loading: true });
        renderPage(AdminUsersPage);
        const table = screen.getByTestId('admin-user-table');
        expect(table).toHaveAttribute('data-loading', 'true');
      });
    });

    describe('Loaded State', () => {
      it('zeigt Users in der Tabelle', () => {
        setUsersState({
          loading: false,
          users: mockUsersList,
          pagination: { total: 2, page: 1, pages: 1, limit: 10 },
        });
        renderPage(AdminUsersPage);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });

      it('zeigt Total Count Badge', () => {
        setUsersState({
          loading: false,
          users: mockUsersList,
          pagination: { total: 2, page: 1, pages: 1, limit: 10 },
        });
        renderPage(AdminUsersPage);
        expect(screen.getByText(/admin\.users\.totalUsers/)).toBeInTheDocument();
      });

      it('aktiviert Refresh-Button', () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);
        const refreshBtn = screen.getByRole('button', { name: 'admin.users.refresh' });
        expect(refreshBtn).not.toBeDisabled();
      });
    });

    describe('Search & Filters', () => {
      it('rendert Suchfeld', () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);
        expect(screen.getByPlaceholderText('admin.users.searchPlaceholder')).toBeInTheDocument();
      });

      it('rendert Role-Filter', () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);
        expect(screen.getByLabelText('admin.users.filterRole')).toBeInTheDocument();
      });

      it('rendert Status-Filter', () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);
        expect(screen.getByLabelText('admin.users.filterStatus')).toBeInTheDocument();
      });

      it('rendert Verified-Filter', () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);
        expect(screen.getByLabelText('admin.users.filterVerified')).toBeInTheDocument();
      });
    });

    describe('Detail Modal', () => {
      it('öffnet Detail-Modal beim Klick auf View', async () => {
        setUsersState({
          loading: false,
          users: mockUsersList,
          pagination: { total: 2, page: 1, pages: 1, limit: 10 },
        });
        renderPage(AdminUsersPage);

        const viewBtn = screen.getByTestId('view-u1');
        await userEvent.click(viewBtn);

        expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument();
        expect(screen.getByTestId('admin-user-detail')).toHaveAttribute('data-user-id', 'u1');
      });

      it('schließt Detail-Modal beim Close', async () => {
        setUsersState({
          loading: false,
          users: mockUsersList,
          pagination: { total: 2, page: 1, pages: 1, limit: 10 },
        });
        renderPage(AdminUsersPage);

        const viewBtn = screen.getByTestId('view-u1');
        await userEvent.click(viewBtn);
        expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument();

        const closeBtn = screen.getByTestId('close-detail');
        await userEvent.click(closeBtn);
        expect(screen.queryByTestId('admin-user-detail')).not.toBeInTheDocument();
      });
    });

    describe('Error State', () => {
      it('zeigt Fehler-Nachricht bei Error', () => {
        setUsersState({ loading: false, error: 'Server Error', users: [] });
        renderPage(AdminUsersPage);
        expect(screen.getByText('Server Error')).toBeInTheDocument();
      });

      it('zeigt Retry-Button bei Error', () => {
        setUsersState({ loading: false, error: 'Server Error', users: [] });
        renderPage(AdminUsersPage);
        expect(screen.getByText('admin.dashboard.retry')).toBeInTheDocument();
      });
    });

    describe('Refresh', () => {
      it('ruft refresh beim Klick auf Refresh-Button auf', async () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);

        const refreshBtn = screen.getByRole('button', { name: 'admin.users.refresh' });
        await userEvent.click(refreshBtn);

        expect(mockUsersActions.refresh).toHaveBeenCalled();
      });
    });

    describe('Create User Modal', () => {
      it('rendert Create-Button', () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);
        expect(screen.getByText('admin.users.create.button')).toBeInTheDocument();
      });

      it('öffnet Create-Modal beim Klick auf Create-Button', async () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);

        const createBtn = screen.getByText('admin.users.create.button');
        await userEvent.click(createBtn);

        expect(screen.getByTestId('admin-create-user')).toBeInTheDocument();
      });

      it('schließt Create-Modal beim Close', async () => {
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);

        const createBtn = screen.getByText('admin.users.create.button');
        await userEvent.click(createBtn);
        expect(screen.getByTestId('admin-create-user')).toBeInTheDocument();

        const closeBtn = screen.getByTestId('close-create-user');
        await userEvent.click(closeBtn);
        expect(screen.queryByTestId('admin-create-user')).not.toBeInTheDocument();
      });

      it('ruft createUser bei Submit auf und zeigt Erfolg-Toast', async () => {
        mockUsersActions.createUser.mockResolvedValue({ success: true });
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);

        const createBtn = screen.getByText('admin.users.create.button');
        await userEvent.click(createBtn);

        const submitBtn = screen.getByTestId('submit-create-user');
        await userEvent.click(submitBtn);

        expect(mockUsersActions.createUser).toHaveBeenCalledWith({
          name: 'New',
          email: 'new@test.com',
          password: 'Abc123!x',
          role: 'user',
        });
        expect(mockToast.success).toHaveBeenCalledWith('admin.users.create.success');
      });

      it('zeigt Fehler-Toast bei fehlgeschlagenem Create', async () => {
        mockUsersActions.createUser.mockResolvedValue({ success: false, error: 'Email exists' });
        setUsersState({ loading: false });
        renderPage(AdminUsersPage);

        const createBtn = screen.getByText('admin.users.create.button');
        await userEvent.click(createBtn);

        const submitBtn = screen.getByTestId('submit-create-user');
        await userEvent.click(submitBtn);

        expect(mockToast.error).toHaveBeenCalledWith('Email exists');
      });

      it('übergibt actionLoading an Create-Modal', () => {
        setUsersState({ loading: false, actionLoading: 'create' });
        renderPage(AdminUsersPage);

        const createBtn = screen.getByText('admin.users.create.button');
        userEvent.click(createBtn);
      });
    });
  });

  // ══════════════════════════════════════════════════
  // AdminTransactionsPage (vollständig implementiert)
  // ══════════════════════════════════════════════════

  describe('AdminTransactionsPage', () => {
    const mockTxList = [
      {
        _id: 'tx1',
        description: 'Gehalt',
        amount: 3000,
        category: 'Gehalt',
        type: 'income',
        date: '2024-01-31',
        userId: { _id: 'u1', name: 'Alice' },
      },
      {
        _id: 'tx2',
        description: 'Miete',
        amount: 800,
        category: 'Miete',
        type: 'expense',
        date: '2024-02-01',
        userId: { _id: 'u2', name: 'Bob' },
      },
    ];

    // Helper: Klick auf User um zur Transaktions-Ansicht zu gelangen
    async function enterTransactionsView() {
      const selectBtn = screen.getByTestId('select-user-u1');
      await userEvent.click(selectBtn);
    }

    describe('User List View (default)', () => {
      it('rendert Titel', () => {
        renderPage(AdminTransactionsPage);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'admin.transactions.title'
        );
      });

      it('rendert Subtitle mit User-Anzahl', () => {
        renderPage(AdminTransactionsPage);
        expect(screen.getByText(/admin\.transactions\.usersSubtitle/)).toBeInTheDocument();
      });

      it('rendert User-Liste', () => {
        renderPage(AdminTransactionsPage);
        expect(screen.getByTestId('admin-tx-user-list')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      it('rendert Suchfeld für User', () => {
        renderPage(AdminTransactionsPage);
        expect(
          screen.getByPlaceholderText('admin.transactions.searchUserPlaceholder')
        ).toBeInTheDocument();
      });
    });

    describe('Transactions View (nach User-Klick)', () => {
      beforeEach(() => {
        setTransactionsState({ loading: false });
      });

      it('navigiert zur Transaktions-Ansicht bei User-Klick', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alice');
      });

      it('zeigt Zurück-Button', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(
          screen.getByRole('button', { name: 'admin.transactions.backToUsers' })
        ).toBeInTheDocument();
      });

      it('rendert Suchfeld', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(
          screen.getByPlaceholderText('admin.transactions.searchPlaceholder')
        ).toBeInTheDocument();
      });

      it('rendert Type-Filter', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByLabelText('admin.transactions.filterType')).toBeInTheDocument();
      });

      it('rendert Category-Filter', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByLabelText('admin.transactions.filterCategory')).toBeInTheDocument();
      });

      it('rendert Kategorie-Optionen im Select', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByText('translated_Gehalt')).toBeInTheDocument();
        expect(screen.getByText('translated_Miete')).toBeInTheDocument();
        expect(screen.getByText('translated_Lebensmittel')).toBeInTheDocument();
      });

      it('rendert Date-Range-Inputs', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByText('admin.transactions.startDate')).toBeInTheDocument();
        expect(screen.getByText('admin.transactions.endDate')).toBeInTheDocument();
      });

      it('zeigt Transaktionen in der Tabelle', async () => {
        setTransactionsState({
          loading: false,
          transactions: mockTxList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByText('Gehalt')).toBeInTheDocument();
        expect(screen.getByText('Miete')).toBeInTheDocument();
      });

      it('zeigt Total Count Badge', async () => {
        setTransactionsState({
          loading: false,
          transactions: mockTxList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByText(/admin\.transactions\.totalTransactions/)).toBeInTheDocument();
      });

      it('aktiviert Refresh-Button', async () => {
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        const refreshBtn = screen.getByRole('button', { name: 'admin.transactions.refresh' });
        expect(refreshBtn).not.toBeDisabled();
      });
    });

    describe('Detail Modal', () => {
      it('öffnet Detail-Modal beim Klick auf View', async () => {
        setTransactionsState({
          loading: false,
          transactions: mockTxList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();

        const viewBtn = screen.getByTestId('view-tx-tx1');
        await userEvent.click(viewBtn);

        expect(screen.getByTestId('admin-tx-detail')).toBeInTheDocument();
        expect(screen.getByTestId('admin-tx-detail')).toHaveAttribute('data-tx-id', 'tx1');
      });

      it('schließt Detail-Modal beim Close', async () => {
        setTransactionsState({
          loading: false,
          transactions: mockTxList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();

        const viewBtn = screen.getByTestId('view-tx-tx1');
        await userEvent.click(viewBtn);
        expect(screen.getByTestId('admin-tx-detail')).toBeInTheDocument();

        const closeBtn = screen.getByTestId('close-tx-detail');
        await userEvent.click(closeBtn);
        expect(screen.queryByTestId('admin-tx-detail')).not.toBeInTheDocument();
      });
    });

    describe('Error State', () => {
      it('zeigt Fehler-Nachricht bei Error', async () => {
        setTransactionsState({ loading: false, error: 'Server Error', transactions: [] });
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByText('Server Error')).toBeInTheDocument();
      });

      it('zeigt Retry-Button bei Error', async () => {
        setTransactionsState({ loading: false, error: 'Server Error', transactions: [] });
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();
        expect(screen.getByText('admin.dashboard.retry')).toBeInTheDocument();
      });
    });

    describe('Refresh', () => {
      it('ruft refresh beim Klick auf Refresh-Button auf', async () => {
        setTransactionsState({ loading: false });
        renderPage(AdminTransactionsPage);
        await enterTransactionsView();

        const refreshBtn = screen.getByRole('button', { name: 'admin.transactions.refresh' });
        await userEvent.click(refreshBtn);

        expect(mockTxActions.refresh).toHaveBeenCalled();
      });
    });
  });

  // ══════════════════════════════════════════════════
  // AdminSubscribersPage (vollständig implementiert)
  // ══════════════════════════════════════════════════

  describe('AdminSubscribersPage', () => {
    const mockSubList = [
      {
        _id: 'sub1',
        email: 'alice@example.com',
        isConfirmed: true,
        language: 'de',
        subscribedAt: '2024-01-15T10:00:00Z',
      },
      {
        _id: 'sub2',
        email: 'bob@example.com',
        isConfirmed: false,
        language: 'en',
        subscribedAt: '2024-02-20T14:30:00Z',
      },
    ];

    describe('Loading State', () => {
      it('rendert Titel', () => {
        setSubscribersState({ loading: true });
        renderPage(AdminSubscribersPage);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'admin.subscribers.title'
        );
      });

      it('rendert Subtitle', () => {
        setSubscribersState({ loading: true });
        renderPage(AdminSubscribersPage);
        expect(screen.getByText(/admin\.subscribers\.subtitle/)).toBeInTheDocument();
      });

      it('deaktiviert Refresh-Button bei Loading', () => {
        setSubscribersState({ loading: true });
        renderPage(AdminSubscribersPage);
        const refreshBtn = screen.getByRole('button', { name: 'admin.subscribers.refresh' });
        expect(refreshBtn).toBeDisabled();
      });

      it('rendert die Tabellen-Komponente im Loading-Zustand', () => {
        setSubscribersState({ loading: true });
        renderPage(AdminSubscribersPage);
        const table = screen.getByTestId('admin-sub-table');
        expect(table).toHaveAttribute('data-loading', 'true');
      });
    });

    describe('Loaded State', () => {
      it('zeigt Subscribers in der Tabelle', () => {
        setSubscribersState({
          loading: false,
          subscribers: mockSubList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminSubscribersPage);
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });

      it('zeigt Total Count Badge', () => {
        setSubscribersState({
          loading: false,
          subscribers: mockSubList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminSubscribersPage);
        expect(screen.getByText(/admin\.subscribers\.totalSubscribers/)).toBeInTheDocument();
      });

      it('aktiviert Refresh-Button', () => {
        setSubscribersState({ loading: false });
        renderPage(AdminSubscribersPage);
        const refreshBtn = screen.getByRole('button', { name: 'admin.subscribers.refresh' });
        expect(refreshBtn).not.toBeDisabled();
      });
    });

    describe('Search & Filters', () => {
      it('rendert Suchfeld', () => {
        setSubscribersState({ loading: false });
        renderPage(AdminSubscribersPage);
        expect(
          screen.getByPlaceholderText('admin.subscribers.searchPlaceholder')
        ).toBeInTheDocument();
      });

      it('rendert Status-Filter', () => {
        setSubscribersState({ loading: false });
        renderPage(AdminSubscribersPage);
        expect(screen.getByLabelText('admin.subscribers.filterStatus')).toBeInTheDocument();
      });

      it('rendert Sprach-Filter', () => {
        setSubscribersState({ loading: false });
        renderPage(AdminSubscribersPage);
        expect(screen.getByLabelText('admin.subscribers.filterLanguage')).toBeInTheDocument();
      });
    });

    describe('Delete Action', () => {
      it('ruft onDelete beim Klick auf Delete-Button auf', async () => {
        setSubscribersState({
          loading: false,
          subscribers: mockSubList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminSubscribersPage);

        const deleteBtn = screen.getByTestId('delete-sub-sub1');
        await userEvent.click(deleteBtn);

        expect(mockSubActions.deleteSubscriber).toHaveBeenCalledWith('sub1');
      });
    });

    describe('Error State', () => {
      it('zeigt Fehler-Nachricht bei Error', () => {
        setSubscribersState({ loading: false, error: 'Server Error', subscribers: [] });
        renderPage(AdminSubscribersPage);
        expect(screen.getByText('Server Error')).toBeInTheDocument();
      });

      it('zeigt Retry-Button bei Error', () => {
        setSubscribersState({ loading: false, error: 'Server Error', subscribers: [] });
        renderPage(AdminSubscribersPage);
        expect(screen.getByText('admin.dashboard.retry')).toBeInTheDocument();
      });
    });

    describe('Refresh', () => {
      it('ruft refresh beim Klick auf Refresh-Button auf', async () => {
        setSubscribersState({ loading: false });
        renderPage(AdminSubscribersPage);

        const refreshBtn = screen.getByRole('button', { name: 'admin.subscribers.refresh' });
        await userEvent.click(refreshBtn);

        expect(mockSubActions.refresh).toHaveBeenCalled();
      });
    });

    describe('Detail Modal', () => {
      const mockSubList = [
        {
          _id: 'sub1',
          email: 'alice@example.com',
          isConfirmed: true,
          language: 'de',
          subscribedAt: '2024-01-15T10:00:00Z',
        },
        {
          _id: 'sub2',
          email: 'bob@example.com',
          isConfirmed: false,
          language: 'en',
          subscribedAt: '2024-02-20T14:30:00Z',
        },
      ];

      it('öffnet Detail-Modal beim Klick auf View', async () => {
        setSubscribersState({
          loading: false,
          subscribers: mockSubList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminSubscribersPage);

        const viewBtn = screen.getByTestId('view-sub-sub1');
        await userEvent.click(viewBtn);

        expect(screen.getByTestId('admin-sub-detail')).toBeInTheDocument();
        expect(screen.getByTestId('admin-sub-detail')).toHaveAttribute('data-sub-id', 'sub1');
      });

      it('schließt Detail-Modal beim Close', async () => {
        setSubscribersState({
          loading: false,
          subscribers: mockSubList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminSubscribersPage);

        const viewBtn = screen.getByTestId('view-sub-sub1');
        await userEvent.click(viewBtn);
        expect(screen.getByTestId('admin-sub-detail')).toBeInTheDocument();

        const closeBtn = screen.getByTestId('close-sub-detail');
        await userEvent.click(closeBtn);
        expect(screen.queryByTestId('admin-sub-detail')).not.toBeInTheDocument();
      });

      it('zeigt Subscriber-Email im Detail-Modal', async () => {
        setSubscribersState({
          loading: false,
          subscribers: mockSubList,
          pagination: { total: 2, page: 1, pages: 1, limit: 15 },
        });
        renderPage(AdminSubscribersPage);

        const viewBtn = screen.getByTestId('view-sub-sub1');
        await userEvent.click(viewBtn);

        // Detail-Modal enthält die Email des Subscribers
        const detail = screen.getByTestId('admin-sub-detail');
        expect(detail).toHaveTextContent('alice@example.com');
      });
    });
  });

  // ══════════════════════════════════════════════════
  // AdminAuditLogPage (vollständig implementiert)
  // ══════════════════════════════════════════════════

  describe('AdminAuditLogPage', () => {
    const mockLogList = [
      {
        _id: 'log1',
        adminName: 'Super Admin',
        action: 'USER_BANNED',
        targetUserName: 'Alice',
        details: {},
        ipAddress: '192.168.1.1',
        createdAt: '2024-03-15T10:00:00Z',
      },
      {
        _id: 'log2',
        adminName: 'System',
        action: 'USER_CREATED',
        targetUserName: 'Bob',
        details: {},
        ipAddress: '10.0.0.1',
        createdAt: '2024-03-16T08:00:00Z',
      },
    ];

    describe('Loading State', () => {
      it('rendert Titel', () => {
        setAuditLogState({ loading: true });
        renderPage(AdminAuditLogPage);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('admin.auditLog.title');
      });

      it('rendert Subtitle', () => {
        setAuditLogState({ loading: true });
        renderPage(AdminAuditLogPage);
        expect(screen.getByText(/admin\.auditLog\.subtitle/)).toBeInTheDocument();
      });

      it('deaktiviert Refresh-Button bei Loading', () => {
        setAuditLogState({ loading: true });
        renderPage(AdminAuditLogPage);
        const refreshBtn = screen.getByRole('button', { name: 'admin.auditLog.refresh' });
        expect(refreshBtn).toBeDisabled();
      });

      it('rendert die Tabellen-Komponente im Loading-Zustand', () => {
        setAuditLogState({ loading: true });
        renderPage(AdminAuditLogPage);
        const table = screen.getByTestId('admin-audit-table');
        expect(table).toHaveAttribute('data-loading', 'true');
      });
    });

    describe('Loaded State', () => {
      it('zeigt Logs in der Tabelle', () => {
        setAuditLogState({
          loading: false,
          logs: mockLogList,
          pagination: { total: 2, page: 1, pages: 1, limit: 20 },
        });
        renderPage(AdminAuditLogPage);
        expect(screen.getByText('USER_BANNED')).toBeInTheDocument();
        expect(screen.getByText('USER_CREATED')).toBeInTheDocument();
      });

      it('zeigt Einträge-Subtitle', () => {
        setAuditLogState({
          loading: false,
          logs: mockLogList,
          pagination: { total: 2, page: 1, pages: 1, limit: 20 },
        });
        renderPage(AdminAuditLogPage);
        expect(screen.getByText(/admin\.auditLog\.subtitle/)).toBeInTheDocument();
      });

      it('aktiviert Refresh-Button', () => {
        setAuditLogState({ loading: false });
        renderPage(AdminAuditLogPage);
        const refreshBtn = screen.getByRole('button', { name: 'admin.auditLog.refresh' });
        expect(refreshBtn).not.toBeDisabled();
      });
    });

    describe('Filters', () => {
      it('rendert Action-Filter', () => {
        setAuditLogState({ loading: false });
        renderPage(AdminAuditLogPage);
        expect(screen.getByLabelText('admin.auditLog.filterAction')).toBeInTheDocument();
      });

      it('rendert Monats-Filter', () => {
        setAuditLogState({ loading: false });
        renderPage(AdminAuditLogPage);
        // Die Seite nutzt eine Monatsauswahl (input[type=month]) statt separater Datums-Inputs
        expect(screen.getByLabelText('admin.auditLog.selectMonth')).toBeInTheDocument();
      });

      it('rendert alle Action-Optionen im Select', () => {
        setAuditLogState({ loading: false });
        renderPage(AdminAuditLogPage);
        const select = screen.getByLabelText('admin.auditLog.filterAction');
        expect(select.querySelectorAll('option').length).toBeGreaterThan(1);
      });
    });

    describe('Error State', () => {
      it('zeigt Fehler-Nachricht bei Error', () => {
        setAuditLogState({ loading: false, error: 'Forbidden', logs: [] });
        renderPage(AdminAuditLogPage);
        expect(screen.getByText('Forbidden')).toBeInTheDocument();
      });

      it('zeigt Retry-Button bei Error', () => {
        setAuditLogState({ loading: false, error: 'Forbidden', logs: [] });
        renderPage(AdminAuditLogPage);
        expect(screen.getByText('admin.dashboard.retry')).toBeInTheDocument();
      });
    });

    describe('Refresh', () => {
      it('ruft refresh beim Klick auf Refresh-Button auf', async () => {
        setAuditLogState({ loading: false });
        renderPage(AdminAuditLogPage);

        const refreshBtn = screen.getByRole('button', { name: 'admin.auditLog.refresh' });
        await userEvent.click(refreshBtn);

        expect(mockAuditActions.refresh).toHaveBeenCalled();
      });
    });

    describe('Stats Cards', () => {
      it('rendert 3 Stat-Cards wenn Stats vorhanden', () => {
        setAuditLogState({
          loading: false,
          stats: { totalEntries: 250, mostCommonAction: 'USER_BANNED', activeAdmins: 3 },
        });
        renderPage(AdminAuditLogPage);

        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(3);
      });

      it('zeigt Stats-Werte korrekt an', () => {
        setAuditLogState({
          loading: false,
          stats: { totalEntries: 250, mostCommonAction: 'USER_BANNED', activeAdmins: 3 },
        });
        renderPage(AdminAuditLogPage);

        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards[0]).toHaveAttribute('data-value', '250');
        expect(statCards[1]).toHaveAttribute(
          'data-value',
          'admin.auditLog.actions_enum.USER_BANNED'
        );
        expect(statCards[2]).toHaveAttribute('data-value', '3');
      });

      it('zeigt Fallback-Werte ohne Stats', () => {
        setAuditLogState({ loading: false, stats: null });
        renderPage(AdminAuditLogPage);

        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(3);
        statCards.forEach(card => {
          expect(card).toHaveAttribute('data-value', '—');
        });
      });

      it('zeigt Stats-Loading-Zustand', () => {
        setAuditLogState({ loading: true, stats: null });
        renderPage(AdminAuditLogPage);

        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(3);
        statCards.forEach(card => {
          expect(card).toHaveAttribute('data-loading', 'true');
        });
      });

      it('hat Stats-Sektion mit aria-label', () => {
        setAuditLogState({
          loading: false,
          stats: { totalEntries: 100, mostCommonAction: 'USER_CREATED', activeAdmins: 1 },
        });
        renderPage(AdminAuditLogPage);

        expect(
          screen.getByRole('region', { name: 'admin.auditLog.statsLabel' })
        ).toBeInTheDocument();
      });

      it('zeigt Stats-Labels korrekt', () => {
        setAuditLogState({
          loading: false,
          stats: { totalEntries: 100, mostCommonAction: 'USER_CREATED', activeAdmins: 1 },
        });
        renderPage(AdminAuditLogPage);

        expect(screen.getByText(/admin\.auditLog\.statTotal/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.auditLog\.statMostCommon/)).toBeInTheDocument();
        expect(screen.getByText(/admin\.auditLog\.statActiveAdmins/)).toBeInTheDocument();
      });
    });
  });

  // ══════════════════════════════════════════════════
  // AdminLifecyclePage (vollständig implementiert)
  // ══════════════════════════════════════════════════

  describe('AdminLifecyclePage', () => {
    const mockLifecycleStats = {
      usersWithOldTransactions: 12,
      usersInReminding: 3,
      usersInFinalWarning: 1,
      usersExported: 5,
      deletionsThisMonth: 2,
      usersApproachingLimit: 4,
      usersAtLimit: 1,
      config: {
        retentionMonths: 12,
        gracePeriodMonths: 3,
        finalWarningDays: 7,
        reminderCooldownDays: 7,
        quotaLimit: 150,
      },
      usersInFinalWarningPhase: [
        { _id: 'u1', name: 'Alice', email: 'a@b.com', finalWarningSentAt: '2025-01-10' },
      ],
      usersInRemindingPhase: [
        {
          _id: 'u3',
          name: 'Charlie',
          email: 'c@b.com',
          reminderStartedAt: '2025-01-01',
          reminderCount: 3,
        },
      ],
      usersWithExport: [
        { _id: 'u4', name: 'Diana', email: 'd@b.com', exportConfirmedAt: '2025-02-10' },
      ],
      usersApproachingQuota: [
        { _id: 'u2', name: 'Bob', email: 'b@b.com', monthlyTransactionCount: 130 },
      ],
    };

    const mockDetail = {
      user: { _id: 'u1', name: 'Alice', email: 'a@b.com' },
      lifecycle: {
        retention: {
          phase: 'finalWarning',
          reminderStartedAt: '2025-01-01',
          reminderCount: 2,
          finalWarningSentAt: '2025-02-20',
          exportConfirmedAt: null,
          daysUntilDeletion: 3,
        },
      },
      quota: { used: 42, limit: 150, resetDate: '2025-04-01' },
      transactionBreakdown: { total: 100, olderThan12Months: 15, within12Months: 85 },
    };

    describe('Loading State', () => {
      it('rendert Titel und Subtitle', () => {
        setLifecycleState({ loading: true });
        renderPage(AdminLifecyclePage);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'lifecycle.admin.title'
        );
        expect(screen.getByText('lifecycle.admin.subtitle')).toBeInTheDocument();
      });

      it('rendert 7 Stat-Cards im Loading-Zustand', () => {
        setLifecycleState({ loading: true });
        renderPage(AdminLifecyclePage);
        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(7);
        statCards.forEach(card => {
          expect(card).toHaveAttribute('data-loading', 'true');
        });
      });

      it('deaktiviert Refresh-Button bei Loading', () => {
        setLifecycleState({ loading: true });
        renderPage(AdminLifecyclePage);
        const refreshBtn = screen.getByRole('button', { name: 'lifecycle.admin.refresh' });
        expect(refreshBtn).toBeDisabled();
      });

      it('zeigt User-Listen Sektion mit Tabs', () => {
        setLifecycleState({ loading: true });
        renderPage(AdminLifecyclePage);
        expect(
          screen.getByRole('region', { name: 'lifecycle.admin.criticalLabel' })
        ).toBeInTheDocument();
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });

    describe('Loaded State', () => {
      beforeEach(() => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
      });

      it('zeigt 7 Stat-Cards mit Daten', () => {
        renderPage(AdminLifecyclePage);
        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(7);
        statCards.forEach(card => {
          expect(card).toHaveAttribute('data-loading', 'false');
        });
      });

      it('zeigt Lifecycle-Labels und Sektion', () => {
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.title')).toBeInTheDocument();
        expect(screen.getByText(/lifecycle\.admin\.usersInReminding/)).toBeInTheDocument();
        expect(screen.getByText(/lifecycle\.admin\.usersInFinalWarning/)).toBeInTheDocument();
        expect(screen.getByText(/lifecycle\.admin\.usersExported/)).toBeInTheDocument();
        expect(screen.getByText(/lifecycle\.admin\.deletionsThisMonth/)).toBeInTheDocument();
        expect(screen.getByText(/lifecycle\.admin\.totalOldTransactions/)).toBeInTheDocument();
        expect(screen.getByText(/lifecycle\.admin\.usersApproachingLimit/)).toBeInTheDocument();
        expect(screen.getByText(/lifecycle\.admin\.usersAtLimit/)).toBeInTheDocument();
      });

      it('aktiviert Refresh-Button', () => {
        renderPage(AdminLifecyclePage);
        const refreshBtn = screen.getByRole('button', { name: 'lifecycle.admin.refresh' });
        expect(refreshBtn).not.toBeDisabled();
      });

      it('ruft refresh() bei Klick auf Refresh-Button auf', async () => {
        renderPage(AdminLifecyclePage);
        const refreshBtn = screen.getByRole('button', { name: 'lifecycle.admin.refresh' });
        await userEvent.click(refreshBtn);
        expect(mockLifecycleActions.refresh).toHaveBeenCalledTimes(1);
      });

      it('zeigt kritische User im Standard-Tab', () => {
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('a@b.com')).toBeInTheDocument();
      });

      it('hat aria-labels für Sektionen', () => {
        renderPage(AdminLifecyclePage);
        expect(
          screen.getByRole('region', { name: 'lifecycle.admin.statsLabel' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('region', { name: 'lifecycle.admin.criticalLabel' })
        ).toBeInTheDocument();
      });

      it('zeigt "keine kritischen User"-Nachricht wenn Liste leer', () => {
        setLifecycleState({
          loading: false,
          stats: { ...mockLifecycleStats, usersInFinalWarningPhase: [] },
        });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.noCriticalUsers')).toBeInTheDocument();
      });
    });

    describe('Config Bar', () => {
      it('zeigt Config-Bar mit System-Werten', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.configTitle')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.configRetention')).toBeInTheDocument();
      });

      it('zeigt keine Config-Bar ohne config Daten', () => {
        setLifecycleState({ loading: false, stats: { ...mockLifecycleStats, config: undefined } });
        renderPage(AdminLifecyclePage);
        expect(screen.queryByText('lifecycle.admin.configTitle')).not.toBeInTheDocument();
      });
    });

    describe('Timeline', () => {
      it('zeigt Lifecycle-Timeline mit Phasen', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.timelineTitle')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.phaseActive')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.phaseReminding')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.phaseFinalWarning')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.phaseDeletion')).toBeInTheDocument();
      });
    });

    describe('Tabs', () => {
      beforeEach(() => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
      });

      it('rendert 4 Tabs', () => {
        renderPage(AdminLifecyclePage);
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(4);
      });

      it('Critical-Tab ist standardmäßig aktiv', () => {
        renderPage(AdminLifecyclePage);
        const criticalTab = screen.getByRole('tab', { name: /lifecycle\.admin\.tabCritical/ });
        expect(criticalTab).toHaveAttribute('aria-selected', 'true');
      });

      it('wechselt zu Reminding-Tab per Klick', async () => {
        renderPage(AdminLifecyclePage);
        const remindingTab = screen.getByRole('tab', { name: /lifecycle\.admin\.tabReminding/ });
        await userEvent.click(remindingTab);
        expect(remindingTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Charlie')).toBeInTheDocument();
      });

      it('wechselt zu Exported-Tab per Klick', async () => {
        renderPage(AdminLifecyclePage);
        const exportedTab = screen.getByRole('tab', { name: /lifecycle\.admin\.tabExported/ });
        await userEvent.click(exportedTab);
        expect(screen.getByText('Diana')).toBeInTheDocument();
      });

      it('wechselt zu Quota-Tab per Klick', async () => {
        renderPage(AdminLifecyclePage);
        const quotaTab = screen.getByRole('tab', { name: /lifecycle\.admin\.tabQuota/ });
        await userEvent.click(quotaTab);
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });

      it('zeigt leere Nachricht bei leerem Tab', async () => {
        setLifecycleState({
          loading: false,
          stats: { ...mockLifecycleStats, usersInRemindingPhase: [] },
        });
        renderPage(AdminLifecyclePage);
        const remindingTab = screen.getByRole('tab', { name: /lifecycle\.admin\.tabReminding/ });
        await userEvent.click(remindingTab);
        expect(screen.getByText('lifecycle.admin.noRemindingUsers')).toBeInTheDocument();
      });
    });

    describe('Search', () => {
      beforeEach(() => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
      });

      it('rendert Such-Input', () => {
        renderPage(AdminLifecyclePage);
        expect(
          screen.getByPlaceholderText('lifecycle.admin.searchPlaceholder')
        ).toBeInTheDocument();
      });

      it('filtert User nach Name', async () => {
        renderPage(AdminLifecyclePage);
        const searchInput = screen.getByPlaceholderText('lifecycle.admin.searchPlaceholder');
        await userEvent.type(searchInput, 'Alice');
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      it('zeigt No-Results bei ungültiger Suche', async () => {
        renderPage(AdminLifecyclePage);
        const searchInput = screen.getByPlaceholderText('lifecycle.admin.searchPlaceholder');
        await userEvent.type(searchInput, 'xyz123nonexistent');
        expect(screen.getByText('lifecycle.admin.noSearchResults')).toBeInTheDocument();
      });
    });

    describe('Trigger', () => {
      it('zeigt Trigger-Button', () => {
        setLifecycleState({ loading: false });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.triggerProcessing')).toBeInTheDocument();
      });

      it('zeigt Bestätigungstext bei erstem Klick', async () => {
        setLifecycleState({ loading: false });
        renderPage(AdminLifecyclePage);
        const triggerBtn = screen.getByText('lifecycle.admin.triggerProcessing');
        await userEvent.click(triggerBtn);
        expect(screen.getByText('lifecycle.admin.triggerConfirm')).toBeInTheDocument();
      });

      it('ruft triggerProcessing bei Bestätigung auf', async () => {
        mockLifecycleActions.triggerProcessing.mockResolvedValue();
        setLifecycleState({ loading: false });
        renderPage(AdminLifecyclePage);
        const triggerBtn = screen.getByText('lifecycle.admin.triggerProcessing');
        await userEvent.click(triggerBtn);
        const confirmBtn = screen.getByText('lifecycle.admin.triggerConfirm');
        await userEvent.click(confirmBtn);
        expect(mockLifecycleActions.triggerProcessing).toHaveBeenCalledTimes(1);
      });
    });

    describe('Trigger Result', () => {
      it('zeigt Trigger-Ergebnis wenn vorhanden', () => {
        setLifecycleState({
          loading: false,
          stats: mockLifecycleStats,
          triggerResult: {
            processed: 10,
            reminders: 3,
            finalWarnings: 1,
            deletions: 0,
            errors: 0,
            skipped: 6,
          },
        });
        renderPage(AdminLifecyclePage);
        expect(
          screen.getByRole('region', { name: 'lifecycle.admin.triggerResult' })
        ).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.triggerResult')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
      });

      it('zeigt kein Trigger-Ergebnis wenn nicht vorhanden', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
        renderPage(AdminLifecyclePage);
        expect(screen.queryByText('lifecycle.admin.triggerResult')).not.toBeInTheDocument();
      });

      it('ruft dismissTriggerResult bei Schließen auf', async () => {
        setLifecycleState({
          loading: false,
          stats: mockLifecycleStats,
          triggerResult: {
            processed: 5,
            reminders: 0,
            finalWarnings: 0,
            deletions: 0,
            errors: 0,
            skipped: 5,
          },
        });
        renderPage(AdminLifecyclePage);
        // Dismiss button inside trigger result is the one with aria-label close
        const region = screen.getByRole('region', { name: 'lifecycle.admin.triggerResult' });
        const dismissBtn = region.querySelector('button');
        await userEvent.click(dismissBtn);
        expect(mockLifecycleActions.dismissTriggerResult).toHaveBeenCalledTimes(1);
      });
    });

    describe('User Detail Panel', () => {
      it('zeigt kein Detail-Panel ohne userDetail', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
        renderPage(AdminLifecyclePage);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('zeigt Detail-Panel wenn userDetail gesetzt', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.userDetail')).toBeInTheDocument();
      });

      it('zeigt Transaction-Breakdown im Detail', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.transactionBreakdown')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
      });

      it('zeigt Quota im Detail', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.quotaStatus')).toBeInTheDocument();
        expect(screen.getByText('42 / 150')).toBeInTheDocument();
      });

      it('zeigt Quota-Reset-Datum im Detail', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText(/lifecycle\.admin\.quotaResetDate/)).toBeInTheDocument();
      });

      it('zeigt Retention Timestamps im Detail', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.retentionTimestamps')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.reminderStartedAt')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.finalWarningSentAt')).toBeInTheDocument();
        expect(screen.getByText('lifecycle.admin.daysUntilDeletion')).toBeInTheDocument();
      });

      it('zeigt noTimestamps bei User ohne Retention-Daten', () => {
        const detailNoTimestamps = {
          ...mockDetail,
          lifecycle: { retention: { phase: 'active' } },
        };
        setLifecycleState({
          loading: false,
          stats: mockLifecycleStats,
          userDetail: detailNoTimestamps,
        });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.noTimestamps')).toBeInTheDocument();
      });

      it('zeigt Reset-Button im Detail', () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('lifecycle.admin.resetRetention')).toBeInTheDocument();
      });

      it('schließt Panel bei Close-Klick', async () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        const closeBtn = screen.getByRole('button', { name: 'lifecycle.admin.close' });
        await userEvent.click(closeBtn);
        expect(mockLifecycleActions.closeDetail).toHaveBeenCalledTimes(1);
      });

      it('ruft fetchUserDetail bei View-Klick auf', async () => {
        setLifecycleState({ loading: false, stats: mockLifecycleStats });
        renderPage(AdminLifecyclePage);
        const viewBtns = screen.getAllByText('lifecycle.admin.viewDetail');
        await userEvent.click(viewBtns[0]);
        expect(mockLifecycleActions.fetchUserDetail).toHaveBeenCalledWith('u1');
      });

      it('zeigt Bestätigungstext bei Reset-Klick', async () => {
        mockLifecycleActions.resetRetention.mockResolvedValue();
        setLifecycleState({ loading: false, stats: mockLifecycleStats, userDetail: mockDetail });
        renderPage(AdminLifecyclePage);
        const resetBtn = screen.getByText('lifecycle.admin.resetRetention');
        await userEvent.click(resetBtn);
        expect(screen.getByText('lifecycle.admin.resetConfirm')).toBeInTheDocument();
      });
    });

    describe('Error State', () => {
      it('zeigt Fehlermeldung', () => {
        setLifecycleState({ loading: false, error: 'Server Error' });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('Server Error')).toBeInTheDocument();
      });

      it('zeigt Retry-Button im Fehlerzustand', () => {
        setLifecycleState({ loading: false, error: 'Unauthorized' });
        renderPage(AdminLifecyclePage);
        expect(screen.getByText('admin.dashboard.retry')).toBeInTheDocument();
      });

      it('ruft refresh() bei Klick auf Retry-Button auf', async () => {
        setLifecycleState({ loading: false, error: 'Connection failed' });
        renderPage(AdminLifecyclePage);
        const retryBtn = screen.getByText('admin.dashboard.retry');
        await userEvent.click(retryBtn);
        expect(mockLifecycleActions.refresh).toHaveBeenCalledTimes(1);
      });

      it('zeigt keine Stat-Cards im Fehlerzustand', () => {
        setLifecycleState({ loading: false, error: 'Error' });
        renderPage(AdminLifecyclePage);
        expect(screen.queryAllByTestId('stat-card')).toHaveLength(0);
      });
    });
  });

  // ══════════════════════════════════════════════════
  // Barrel Export
  // ══════════════════════════════════════════════════

  describe('Barrel Export', () => {
    it('exportiert alle Seiten korrekt', async () => {
      const barrel = await import('../index');
      expect(barrel.AdminDashboardPage).toBeDefined();
      expect(barrel.AdminUsersPage).toBeDefined();
      expect(barrel.AdminTransactionsPage).toBeDefined();
      expect(barrel.AdminSubscribersPage).toBeDefined();
      expect(barrel.AdminAuditLogPage).toBeDefined();
      expect(barrel.AdminLifecyclePage).toBeDefined();
    });
  });
});
