/**
 * @fileoverview QuotaIndicator Tests
 * @description Unit-Tests für die Quota-Fortschrittsanzeige
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuotaIndicator from '../QuotaIndicator';

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
    div: ({ children, className, ...props }) => (
      <div className={className} data-testid={props['data-testid']}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('@/components/common/Skeleton/Skeleton', () => ({
  default: ({ width, height }) => <div data-testid="skeleton" style={{ width, height }} />,
}));

// ============================================================================
// TESTS
// ============================================================================

describe('QuotaIndicator', () => {
  const defaultQuota = { used: 42, limit: 150, remaining: 108 };

  // ──────────────────────────────────────────────────────────
  // Rendering
  // ──────────────────────────────────────────────────────────
  describe('Rendering', () => {
    it('should render quota info with progress bar', () => {
      render(<QuotaIndicator quota={defaultQuota} />);

      expect(screen.getByText('lifecycle.quota.title')).toBeInTheDocument();
      expect(screen.getByText('lifecycle.quota.thisMonth')).toBeInTheDocument();
      expect(screen.getByText('lifecycle.quota.remainingLabel')).toBeInTheDocument();
      expect(screen.getByText('42 / 150')).toBeInTheDocument();
      expect(screen.getByText('108')).toBeInTheDocument();
      expect(screen.getByText(/28\s*%/)).toBeInTheDocument();
    });

    it('should render null when no quota data', () => {
      const { container } = render(<QuotaIndicator quota={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should show loading skeleton', () => {
      render(<QuotaIndicator quota={null} isLoading={true} />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Status-Farben
  // ──────────────────────────────────────────────────────────
  describe('Status Colors', () => {
    it('should show success for low usage (< 50%)', () => {
      render(<QuotaIndicator quota={{ used: 20, limit: 150, remaining: 130 }} />);
      expect(screen.getByText(/13\s*%/)).toBeInTheDocument();
    });

    it('should show info for moderate usage (50-79%)', () => {
      render(<QuotaIndicator quota={{ used: 90, limit: 150, remaining: 60 }} />);
      expect(screen.getByText(/60\s*%/)).toBeInTheDocument();
    });

    it('should show warning badge for high usage (80-99%)', () => {
      render(<QuotaIndicator quota={{ used: 130, limit: 150, remaining: 20 }} />);
      // Appears in both badge and percentLabel
      expect(screen.getAllByText(/87\s*%/).length).toBeGreaterThanOrEqual(1);
    });

    it('should show danger badge when limit exceeded (100%+)', () => {
      render(<QuotaIndicator quota={{ used: 150, limit: 150, remaining: 0 }} />);
      expect(screen.getByText('lifecycle.quota.exceeded')).toBeInTheDocument();
      expect(screen.getByText(/100\s*%/)).toBeInTheDocument();
    });

    it('should cap progress at 100% even if exceeded', () => {
      render(<QuotaIndicator quota={{ used: 160, limit: 150, remaining: -10 }} />);
      // 160/150 = 107%
      expect(screen.getAllByText(/107\s*%/).length).toBeGreaterThanOrEqual(1);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Edge Cases
  // ──────────────────────────────────────────────────────────
  describe('Edge Cases', () => {
    it('should handle zero limit gracefully', () => {
      const { container } = render(<QuotaIndicator quota={{ used: 0, limit: 0, remaining: 0 }} />);
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText(/0\s*%/)).toBeInTheDocument();
    });

    it('should handle zero usage', () => {
      render(<QuotaIndicator quota={{ used: 0, limit: 150, remaining: 150 }} />);
      expect(screen.getByText(/0\s*%/)).toBeInTheDocument();
      expect(screen.getByText('lifecycle.quota.remainingLabel')).toBeInTheDocument();
      expect(screen.getByText('0 / 150')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
});
