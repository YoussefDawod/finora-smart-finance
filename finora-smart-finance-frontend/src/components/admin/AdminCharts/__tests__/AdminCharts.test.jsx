/**
 * @fileoverview AdminCharts Tests
 * @description Tests für die AdminCharts-Komponente –
 *              Loading, Daten-Rendering, Empty State, einzelne Chart-Typen.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminCharts from '../AdminCharts';

// ── Mocks ─────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks', () => ({
  useCssVariables: () => ({
    primary: '#5b6cff',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    border: '#e5e7eb',
    txMuted: '#9ca3af',
  }),
  useIsMobile: () => false,
}));

vi.mock('@/components/common/Skeleton', () => ({
  SkeletonChart: ({ variant, hasTitle }) => (
    <div data-testid={`skeleton-chart-${variant}`} data-has-title={hasTitle}>
      Loading chart...
    </div>
  ),
}));

vi.mock('../chartConstants', () => ({
  tooltipContentStyle: {},
}));

// recharts-Mocks: Render einfach children + data-Attribute
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data, children }) => (
    <div data-testid="pie" data-count={data?.length}>
      {children}
    </div>
  ),
  Cell: ({ fill }) => <div data-testid="cell" style={{ backgroundColor: fill }} />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children, data }) => (
    <div data-testid="bar-chart" data-count={data?.length}>
      {children}
    </div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

// ── Test-Daten ────────────────────────────────────

const fullTransactionStats = {
  totalCount: 450,
  last7DaysCount: 32,
  totalIncome: 15000,
  totalExpense: 9500,
  typeBreakdown: [
    { _id: 'income', count: 200, totalAmount: 15000 },
    { _id: 'expense', count: 250, totalAmount: 9500 },
  ],
  topCategories: [
    { _id: 'Salary', count: 50, totalAmount: 10000 },
    { _id: 'Food', count: 80, totalAmount: 3000 },
    { _id: 'Transport', count: 40, totalAmount: 1500 },
  ],
};

const fullSubscriberStats = {
  totalCount: 55,
  confirmedCount: 40,
  languageBreakdown: [
    { _id: 'de', count: 20 },
    { _id: 'en', count: 15 },
    { _id: 'ar', count: 5 },
  ],
};

const fullStats = {
  overview: { totalUsers: 120 },
  recentUsers: [],
  userLanguageBreakdown: [
    { _id: 'de', count: 1 },
    { _id: 'ar', count: 1 },
  ],
};

describe('AdminCharts', () => {
  // ── Loading State ───────────────────────────────

  describe('Loading State', () => {
    it('zeigt 3 Skeleton-Charts im Ladezustand', () => {
      render(
        <AdminCharts stats={null} transactionStats={null} subscriberStats={null} loading={true} />
      );

      const skeletonsBar = screen.getAllByTestId('skeleton-chart-bar');
      const skeletonsPie = screen.getAllByTestId('skeleton-chart-pie');
      expect(skeletonsPie).toHaveLength(2);
      expect(skeletonsBar).toHaveLength(1);
    });
  });

  // ── Empty State ─────────────────────────────────

  describe('Empty State', () => {
    it('zeigt Empty-Nachricht wenn keine Daten vorhanden', () => {
      render(
        <AdminCharts stats={null} transactionStats={null} subscriberStats={null} loading={false} />
      );
      expect(screen.getByText('admin.dashboard.noChartData')).toBeInTheDocument();
    });

    it('zeigt Empty-Nachricht bei leeren Stats', () => {
      render(
        <AdminCharts
          stats={{ userLanguageBreakdown: [] }}
          transactionStats={{ totalIncome: 0, totalExpense: 0, topCategories: [] }}
          subscriberStats={{ languageBreakdown: [] }}
          loading={false}
        />
      );
      expect(screen.getByText('admin.dashboard.noChartData')).toBeInTheDocument();
    });
  });

  // ── Chart Rendering ─────────────────────────────

  describe('Chart Rendering', () => {
    it('rendert Income/Expense Pie-Chart mit Daten', () => {
      render(
        <AdminCharts
          stats={null}
          transactionStats={fullTransactionStats}
          subscriberStats={null}
          loading={false}
        />
      );

      expect(screen.getByText('admin.dashboard.incomeVsExpense')).toBeInTheDocument();
      expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThanOrEqual(1);
    });

    it('rendert Top-Kategorien Bar-Chart', () => {
      render(
        <AdminCharts
          stats={null}
          transactionStats={fullTransactionStats}
          subscriberStats={null}
          loading={false}
        />
      );

      expect(screen.getByText('admin.dashboard.topCategories')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('rendert User-Sprachen Pie-Chart', () => {
      render(
        <AdminCharts
          stats={fullStats}
          transactionStats={null}
          subscriberStats={null}
          loading={false}
        />
      );

      expect(screen.getByText('admin.dashboard.userLanguages')).toBeInTheDocument();
    });

    it('rendert alle 3 Charts bei vollständigen Daten', () => {
      render(
        <AdminCharts
          stats={fullStats}
          transactionStats={fullTransactionStats}
          subscriberStats={fullSubscriberStats}
          loading={false}
        />
      );

      expect(screen.getByText('admin.dashboard.incomeVsExpense')).toBeInTheDocument();
      expect(screen.getByText('admin.dashboard.topCategories')).toBeInTheDocument();
      expect(screen.getByText('admin.dashboard.userLanguages')).toBeInTheDocument();
    });
  });

  // ── Edge Cases ──────────────────────────────────

  describe('Edge Cases', () => {
    it('rendert nur Income Pie (kein Expense)', () => {
      render(
        <AdminCharts
          stats={null}
          transactionStats={{ totalIncome: 5000, totalExpense: 0, topCategories: [] }}
          subscriberStats={null}
          loading={false}
        />
      );

      expect(screen.getByText('admin.dashboard.incomeVsExpense')).toBeInTheDocument();
    });

    it('rendert nicht wenn Income UND Expense 0 sind', () => {
      render(
        <AdminCharts
          stats={null}
          transactionStats={{
            totalIncome: 0,
            totalExpense: 0,
            topCategories: [{ _id: 'Food', count: 5, totalAmount: 100 }],
          }}
          subscriberStats={null}
          loading={false}
        />
      );

      // topCategories vorhanden → Bar-Chart sollte da sein
      expect(screen.getByText('admin.dashboard.topCategories')).toBeInTheDocument();
      // Kein Income/Expense Pie
      expect(screen.queryByText('admin.dashboard.incomeVsExpense')).not.toBeInTheDocument();
    });

    it('begrenzt Top-Kategorien auf maximal 6', () => {
      const manyCategories = Array.from({ length: 10 }, (_, i) => ({
        _id: `Cat${i}`,
        count: 10 - i,
        totalAmount: (10 - i) * 100,
      }));

      render(
        <AdminCharts
          stats={null}
          transactionStats={{ ...fullTransactionStats, topCategories: manyCategories }}
          subscriberStats={null}
          loading={false}
        />
      );

      const barChart = screen.getByTestId('bar-chart');
      expect(Number(barChart.dataset.count)).toBe(6);
    });

    it('mapped unbekannte Sprache auf _id', () => {
      render(
        <AdminCharts
          stats={{
            userLanguageBreakdown: [{ _id: 'fr', count: 10 }],
          }}
          transactionStats={null}
          subscriberStats={null}
          loading={false}
        />
      );

      expect(screen.getByText('admin.dashboard.userLanguages')).toBeInTheDocument();
    });
  });
});
