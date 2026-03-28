/**
 * @fileoverview RetentionBanner Tests
 * @description Unit-Tests für phasenabhängige Retention-Warnungen
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RetentionBanner from '../RetentionBanner';

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (params) {
        let result = key;
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{{${k}}}`, v);
        }
        return result;
      }
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, role }) => (
      <div className={className} role={role}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));

// ============================================================================
// HELPERS
// ============================================================================

const createLifecycleStatus = (overrides = {}) => ({
  phase: 'reminding',
  oldTransactionCount: 25,
  daysRemaining: 45,
  hasExported: false,
  exportDate: null,
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe('RetentionBanner', () => {
  // ──────────────────────────────────────────────────────────
  // Sichtbarkeit
  // ──────────────────────────────────────────────────────────
  describe('Visibility', () => {
    it('should render nothing when lifecycleStatus is null', () => {
      const { container } = render(<RetentionBanner lifecycleStatus={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing for active phase', () => {
      const { container } = render(
        <RetentionBanner lifecycleStatus={createLifecycleStatus({ phase: 'active' })} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render banner for reminding phase', () => {
      render(<RetentionBanner lifecycleStatus={createLifecycleStatus({ phase: 'reminding' })} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('lifecycle.retention.title')).toBeInTheDocument();
    });

    it('should render banner for finalWarning phase', () => {
      render(
        <RetentionBanner lifecycleStatus={createLifecycleStatus({ phase: 'finalWarning' })} />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render banner for gracePeriod phase', () => {
      render(<RetentionBanner lifecycleStatus={createLifecycleStatus({ phase: 'gracePeriod' })} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render banner for deleted phase', () => {
      render(<RetentionBanner lifecycleStatus={createLifecycleStatus({ phase: 'deleted' })} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Content
  // ──────────────────────────────────────────────────────────
  describe('Content', () => {
    it('should display old transaction count', () => {
      render(
        <RetentionBanner lifecycleStatus={createLifecycleStatus({ oldTransactionCount: 42 })} />
      );
      expect(screen.getByText('lifecycle.retention.oldTransactions')).toBeInTheDocument();
    });

    it('should display no-old-transactions message when count is 0', () => {
      render(
        <RetentionBanner lifecycleStatus={createLifecycleStatus({ oldTransactionCount: 0 })} />
      );
      expect(screen.getByText('lifecycle.retention.noOldTransactions')).toBeInTheDocument();
    });

    it('should display days remaining countdown', () => {
      render(<RetentionBanner lifecycleStatus={createLifecycleStatus({ daysRemaining: 7 })} />);
      expect(screen.getByText('lifecycle.retention.daysRemaining')).toBeInTheDocument();
    });

    it('should NOT display countdown when daysRemaining is 0', () => {
      render(<RetentionBanner lifecycleStatus={createLifecycleStatus({ daysRemaining: 0 })} />);
      expect(screen.queryByText(/daysRemaining/)).not.toBeInTheDocument();
    });

    it('should display phase badge', () => {
      render(
        <RetentionBanner lifecycleStatus={createLifecycleStatus({ phase: 'finalWarning' })} />
      );
      expect(screen.getByText('lifecycle.retention.phase.finalWarning')).toBeInTheDocument();
    });

    it('should show export confirmed status', () => {
      render(
        <RetentionBanner
          lifecycleStatus={createLifecycleStatus({
            hasExported: true,
            exportDate: '2025-12-01',
          })}
        />
      );
      expect(screen.getByText(/lifecycle.retention.exportConfirmed/)).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────
  describe('Actions', () => {
    it('should show export button when onExport is provided', () => {
      const onExport = vi.fn();
      render(<RetentionBanner lifecycleStatus={createLifecycleStatus()} onExport={onExport} />);
      const btn = screen.getByText('lifecycle.retention.exportButton');
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it('should show confirm button when onConfirmExport is provided', () => {
      const onConfirm = vi.fn();
      render(
        <RetentionBanner lifecycleStatus={createLifecycleStatus()} onConfirmExport={onConfirm} />
      );
      const btn = screen.getByText('lifecycle.retention.confirmExport');
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should NOT show action buttons when already exported', () => {
      render(
        <RetentionBanner
          lifecycleStatus={createLifecycleStatus({ hasExported: true })}
          onExport={vi.fn()}
          onConfirmExport={vi.fn()}
        />
      );
      expect(screen.queryByText('lifecycle.retention.exportButton')).not.toBeInTheDocument();
      expect(screen.queryByText('lifecycle.retention.confirmExport')).not.toBeInTheDocument();
    });

    it('should NOT show action buttons for deleted phase', () => {
      render(
        <RetentionBanner
          lifecycleStatus={createLifecycleStatus({ phase: 'deleted' })}
          onExport={vi.fn()}
          onConfirmExport={vi.fn()}
        />
      );
      expect(screen.queryByText('lifecycle.retention.exportButton')).not.toBeInTheDocument();
      expect(screen.queryByText('lifecycle.retention.confirmExport')).not.toBeInTheDocument();
    });

    it('should disable confirm button when isLoading', () => {
      render(
        <RetentionBanner
          lifecycleStatus={createLifecycleStatus()}
          onConfirmExport={vi.fn()}
          isLoading={true}
        />
      );
      const btn = screen.getByText('lifecycle.retention.confirmExport');
      expect(btn).toBeDisabled();
    });
  });
});
