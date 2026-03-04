/**
 * @fileoverview Skeleton Variant Components Tests
 * @description Coverage: SkeletonCard, SkeletonChart, SkeletonTableRow, AuthPageSkeleton, PageFallback
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonCard } from '../index';
import SkeletonChart from '../SkeletonChart';
import SkeletonTableRow from '../SkeletonTableRow';
import AuthPageSkeleton from '../AuthPageSkeleton';
import PageFallback, {
  ContentPageFallback,
  DashboardFallback,
  TransactionsFallback,
  SettingsFallback,
} from '../PageFallback';

// ─── SkeletonCard ───────────────────────────────────────────────────
describe('SkeletonCard', () => {
  it('renders with default props', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it.each(['small', 'medium', 'large'])('applies size class "%s"', (size) => {
    const { container } = render(<SkeletonCard size={size} />);
    expect(container.firstChild.className).toContain(size);
  });

  it('hides icon when hasIcon=false', () => {
    const { container: withIcon } = render(<SkeletonCard hasIcon={true} />);
    const { container: noIcon } = render(<SkeletonCard hasIcon={false} />);
    // With icon should have a circle skeleton, without should not
    const circlesWithIcon = withIcon.querySelectorAll('[aria-hidden="true"]');
    const circlesNoIcon = noIcon.querySelectorAll('[aria-hidden="true"]');
    expect(circlesWithIcon.length).toBeGreaterThan(circlesNoIcon.length);
  });

  it('merges custom className', () => {
    const { container } = render(<SkeletonCard className="extra" />);
    expect(container.firstChild.className).toContain('extra');
  });

  it('has displayName', () => {
    expect(SkeletonCard.displayName).toBe('SkeletonCard');
  });
});

// ─── SkeletonChart ──────────────────────────────────────────────────
describe('SkeletonChart', () => {
  it('renders with default variant (bar)', () => {
    const { container } = render(<SkeletonChart />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders pie/donut variant with a circle', () => {
    const { container } = render(<SkeletonChart variant="pie" />);
    const circles = container.querySelectorAll('[style*="border-radius: 50%"]');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('hides title when hasTitle=false', () => {
    const { container: withTitle } = render(<SkeletonChart hasTitle={true} />);
    const { container: noTitle } = render(<SkeletonChart hasTitle={false} />);
    const skelWithTitle = withTitle.querySelectorAll('[aria-hidden="true"]');
    const skelNoTitle = noTitle.querySelectorAll('[aria-hidden="true"]');
    expect(skelWithTitle.length).toBeGreaterThan(skelNoTitle.length);
  });

  it('merges custom className', () => {
    const { container } = render(<SkeletonChart className="chart-custom" />);
    expect(container.firstChild.className).toContain('chart-custom');
  });

  it('has displayName', () => {
    expect(SkeletonChart.displayName).toBe('SkeletonChart');
  });
});

// ─── SkeletonTableRow ───────────────────────────────────────────────
describe('SkeletonTableRow', () => {
  it('renders one row by default', () => {
    const { container } = render(<SkeletonTableRow />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders multiple rows', () => {
    const { container } = render(<SkeletonTableRow count={3} />);
    const rows = container.firstChild.children;
    expect(rows).toHaveLength(3);
  });

  it.each(['compact', 'normal', 'spacious'])('applies density class "%s"', (density) => {
    const { container } = render(<SkeletonTableRow density={density} />);
    const row = container.firstChild.firstChild;
    expect(row.className).toContain(density);
  });

  it('has displayName', () => {
    expect(SkeletonTableRow.displayName).toBe('SkeletonTableRow');
  });
});

// ─── AuthPageSkeleton ───────────────────────────────────────────────
describe('AuthPageSkeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<AuthPageSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders branding panel by default', () => {
    const { container } = render(<AuthPageSkeleton />);
    expect(container.firstChild.children.length).toBeGreaterThan(1);
  });

  it('hides branding panel when showBranding=false', () => {
    const { container } = render(<AuthPageSkeleton showBranding={false} />);
    expect(container.firstChild.children.length).toBe(1);
  });

  it('has displayName', () => {
    expect(AuthPageSkeleton.displayName).toBe('AuthPageSkeleton');
  });
});

// ─── PageFallback ───────────────────────────────────────────────────
describe('PageFallback', () => {
  it('renders content variant by default', () => {
    const { container } = render(<PageFallback />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it.each(['content', 'dashboard', 'transactions', 'settings'])(
    'renders variant "%s" without crashing',
    (variant) => {
      const { container } = render(<PageFallback variant={variant} />);
      expect(container.firstChild).toBeInTheDocument();
    }
  );

  it('has displayName', () => {
    expect(PageFallback.displayName).toBe('PageFallback');
  });
});

// ─── Named Exports ──────────────────────────────────────────────────
describe('PageFallback named exports', () => {
  it.each([
    ['ContentPageFallback', ContentPageFallback],
    ['DashboardFallback', DashboardFallback],
    ['TransactionsFallback', TransactionsFallback],
    ['SettingsFallback', SettingsFallback],
  ])('%s renders without crashing', (name, Component) => {
    const { container } = render(<Component />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it.each([
    ['ContentPageFallback', ContentPageFallback],
    ['DashboardFallback', DashboardFallback],
    ['TransactionsFallback', TransactionsFallback],
    ['SettingsFallback', SettingsFallback],
  ])('%s has displayName', (name, Component) => {
    expect(Component.displayName).toBe(name);
  });
});
