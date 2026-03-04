/**
 * @fileoverview AdminStatCard Tests
 * @description Tests für die AdminStatCard-Komponente –
 *              Rendering, Farb-Varianten, Trends, Loading-State.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FiUsers, FiCheckCircle, FiShield } from 'react-icons/fi';
import AdminStatCard from '../AdminStatCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

describe('AdminStatCard', () => {
  const defaultProps = {
    label: 'Total Users',
    value: '120',
    icon: FiUsers,
    color: 'primary',
  };

  // ── Grundlegendes Rendering ─────────────────────

  describe('Rendering', () => {
    it('zeigt Label und Wert an', () => {
      render(<AdminStatCard {...defaultProps} />);
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('rendert das Icon', () => {
      const { container } = render(<AdminStatCard {...defaultProps} />);
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('rendert ohne Icon wenn keins angegeben', () => {
      const { container } = render(
        <AdminStatCard label="Test" value="5" color="primary" />,
      );
      // Kein iconBox → kein SVG erwartet
      expect(container.querySelector('svg')).toBeNull();
    });

    it('rendert mit numerischem Wert', () => {
      render(<AdminStatCard {...defaultProps} value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  // ── Farb-Varianten ──────────────────────────────

  describe('Farb-Varianten', () => {
    const colors = ['primary', 'success', 'warning', 'error', 'info'];

    colors.forEach((color) => {
      it(`rendert mit Farbe "${color}"`, () => {
        const { container } = render(
          <AdminStatCard {...defaultProps} color={color} />,
        );
        const card = container.firstChild;
        expect(card).toBeInTheDocument();
        // CSS-Module generieren mangled Klassen, prüfe nur dass kein Fehler auftritt
      });
    });
  });

  // ── Trend-Anzeige ──────────────────────────────

  describe('Trend-Anzeige', () => {
    it('zeigt aufsteigenden Trend bei positivem Wert', () => {
      render(
        <AdminStatCard
          {...defaultProps}
          trendLabel="+8 this week"
          trendValue={8}
        />,
      );
      expect(screen.getByText('+8 this week')).toBeInTheDocument();
    });

    it('zeigt absteigenden Trend bei negativem Wert', () => {
      render(
        <AdminStatCard
          {...defaultProps}
          trendLabel="-3 this week"
          trendValue={-3}
        />,
      );
      expect(screen.getByText('-3 this week')).toBeInTheDocument();
    });

    it('zeigt neutralen Trend bei Wert 0', () => {
      render(
        <AdminStatCard
          {...defaultProps}
          trendLabel="0 change"
          trendValue={0}
        />,
      );
      expect(screen.getByText('0 change')).toBeInTheDocument();
    });

    it('zeigt keinen Trend wenn trendLabel null ist', () => {
      render(
        <AdminStatCard
          {...defaultProps}
          trendLabel={null}
          trendValue={5}
        />,
      );
      // Kein Trend-Text auf dem Screen
      expect(screen.queryByText(/this week/)).not.toBeInTheDocument();
    });
  });

  // ── Loading State ──────────────────────────────

  describe('Loading State', () => {
    it('zeigt Skeleton-Platzhalter im Loading-Zustand', () => {
      const { container } = render(
        <AdminStatCard {...defaultProps} isLoading={true} />,
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('aria-busy', 'true');
    });

    it('zeigt keinen Wert im Loading-Zustand', () => {
      render(<AdminStatCard {...defaultProps} isLoading={true} />);
      expect(screen.queryByText('120')).not.toBeInTheDocument();
    });

    it('hat aria-label für Barrierefreiheit im Loading-Zustand', () => {
      const { container } = render(
        <AdminStatCard {...defaultProps} isLoading={true} />,
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('aria-label', 'common.loading');
    });
  });

  // ── Edge Cases ──────────────────────────────────

  describe('Edge Cases', () => {
    it('rendert mit Wert "—" (Dash)', () => {
      render(<AdminStatCard {...defaultProps} value="—" />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('rendert mit leerem String als Wert', () => {
      render(<AdminStatCard {...defaultProps} value="" />);
      // Sollte nicht abstürzen
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('rendert mit verschiedenen Icon-Typen', () => {
      const { rerender, container } = render(
        <AdminStatCard {...defaultProps} icon={FiCheckCircle} />,
      );
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<AdminStatCard {...defaultProps} icon={FiShield} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});
