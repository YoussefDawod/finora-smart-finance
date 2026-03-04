/**
 * @fileoverview TransactionQuota Tests
 * @description Unit-Tests für den kompakten Transaktions-Zähler
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionQuota from '../TransactionQuota';

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
    div: ({ children, className, role, ...props }) => (
      <div className={className} role={role} aria-label={props['aria-label']} data-testid={props['data-testid']}>
        {children}
      </div>
    ),
  },
}));

// ============================================================================
// TESTS
// ============================================================================

describe('TransactionQuota', () => {
  const defaultQuota = { used: 42, limit: 150, remaining: 108 };

  // ──────────────────────────────────────────────────────────
  // Rendering (eingeloggt mit Quota)
  // ──────────────────────────────────────────────────────────
  describe('Authenticated User — mit Quota', () => {
    it('should render used/limit counter', () => {
      render(<TransactionQuota quota={defaultQuota} totalItems={42} />);

      expect(screen.getByTestId('quota-count')).toHaveTextContent('42');
      expect(screen.getByText('/')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      const { container } = render(<TransactionQuota quota={defaultQuota} totalItems={42} />);

      const progressTrack = container.querySelector('[class*="progressTrack"]');
      expect(progressTrack).toBeInTheDocument();
    });

    it('should have status role with aria-label', () => {
      render(<TransactionQuota quota={defaultQuota} totalItems={42} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'transactions.quota.aria');
    });
  });

  // ──────────────────────────────────────────────────────────
  // Gastmodus
  // ──────────────────────────────────────────────────────────
  describe('Guest Mode — ohne Limit', () => {
    it('should show count without limit and progress bar', () => {
      const { container } = render(
        <TransactionQuota quota={null} totalItems={7} isGuest={true} />
      );

      expect(screen.getByTestId('quota-count')).toHaveTextContent('7');
      // Kein Separator und kein Limit sichtbar
      expect(screen.queryByText('/')).not.toBeInTheDocument();
      // Kein Progress-Bar
      expect(container.querySelector('[class*="progressTrack"]')).not.toBeInTheDocument();
    });

    it('should have guest aria-label', () => {
      render(<TransactionQuota quota={null} totalItems={3} isGuest={true} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'transactions.quota.ariaGuest');
    });
  });

  // ──────────────────────────────────────────────────────────
  // Dynamische Farbstufen
  // ──────────────────────────────────────────────────────────
  describe('Dynamic Color Levels', () => {
    it('should apply success level for < 50%', () => {
      const { container } = render(
        <TransactionQuota quota={{ used: 20, limit: 150, remaining: 130 }} totalItems={20} />
      );
      // 20/150 = 13% → success
      const counter = container.querySelector('[class*="counter"]');
      expect(counter.className).toMatch(/success/);
    });

    it('should apply info level for 50–79%', () => {
      const { container } = render(
        <TransactionQuota quota={{ used: 90, limit: 150, remaining: 60 }} totalItems={90} />
      );
      // 90/150 = 60% → info
      const counter = container.querySelector('[class*="counter"]');
      expect(counter.className).toMatch(/info/);
    });

    it('should apply warning level for 80–99%', () => {
      const { container } = render(
        <TransactionQuota quota={{ used: 130, limit: 150, remaining: 20 }} totalItems={130} />
      );
      // 130/150 = 87% → warning
      const counter = container.querySelector('[class*="counter"]');
      expect(counter.className).toMatch(/warning/);
    });

    it('should apply danger level for ≥ 100%', () => {
      const { container } = render(
        <TransactionQuota quota={{ used: 150, limit: 150, remaining: 0 }} totalItems={150} />
      );
      const counter = container.querySelector('[class*="counter"]');
      expect(counter.className).toMatch(/danger/);
    });

    it('should apply neutral level for guest mode', () => {
      const { container } = render(
        <TransactionQuota quota={null} totalItems={5} isGuest={true} />
      );
      const counter = container.querySelector('[class*="counter"]');
      expect(counter.className).toMatch(/neutral/);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Warnhinweise
  // ──────────────────────────────────────────────────────────
  describe('Warning Indicators', () => {
    it('should show "near limit" warning at 80%', () => {
      render(
        <TransactionQuota quota={{ used: 130, limit: 150, remaining: 20 }} totalItems={130} />
      );
      expect(screen.getByText('transactions.quota.nearLimit')).toBeInTheDocument();
    });

    it('should show "exceeded" warning at 100%', () => {
      render(
        <TransactionQuota quota={{ used: 150, limit: 150, remaining: 0 }} totalItems={150} />
      );
      expect(screen.getByText('lifecycle.quota.exceeded')).toBeInTheDocument();
    });

    it('should not show warning below 80%', () => {
      render(
        <TransactionQuota quota={{ used: 60, limit: 150, remaining: 90 }} totalItems={60} />
      );
      expect(screen.queryByText('transactions.quota.nearLimit')).not.toBeInTheDocument();
      expect(screen.queryByText('lifecycle.quota.exceeded')).not.toBeInTheDocument();
    });

    it('should not show warning in guest mode', () => {
      render(
        <TransactionQuota quota={null} totalItems={999} isGuest={true} />
      );
      expect(screen.queryByText('transactions.quota.nearLimit')).not.toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Edge Cases
  // ──────────────────────────────────────────────────────────
  describe('Edge Cases', () => {
    it('should handle quota with zero limit', () => {
      const { container } = render(
        <TransactionQuota quota={{ used: 0, limit: 0, remaining: 0 }} totalItems={0} />
      );
      expect(screen.getByTestId('quota-count')).toHaveTextContent('0');
      expect(container.querySelector('[class*="counter"]').className).toMatch(/success/);
    });

    it('should handle exceeded quota (> 100%)', () => {
      render(
        <TransactionQuota quota={{ used: 200, limit: 150, remaining: -50 }} totalItems={200} />
      );
      expect(screen.getByTestId('quota-count')).toHaveTextContent('200');
      expect(screen.getByText('lifecycle.quota.exceeded')).toBeInTheDocument();
    });

    it('should handle null quota with totalItems 0', () => {
      render(<TransactionQuota quota={null} totalItems={0} isGuest={true} />);
      expect(screen.getByTestId('quota-count')).toHaveTextContent('0');
    });

    it('should default totalItems to 0', () => {
      render(<TransactionQuota quota={null} isGuest={true} />);
      expect(screen.getByTestId('quota-count')).toHaveTextContent('0');
    });
  });
});
