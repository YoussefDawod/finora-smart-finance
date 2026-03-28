/**
 * @fileoverview Skeleton Base Component Tests
 * @description Coverage: variants, count, inline, animated, aria, sizes, className
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Skeleton from '../Skeleton';

describe('Skeleton', () => {
  // ─── Basic Rendering ──────────────────────────────────────────────
  it('renders with role="status"', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('sets aria-busy="true"', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('has default aria-label', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Inhalt wird geladen');
  });

  it('accepts custom ariaLabel', () => {
    render(<Skeleton ariaLabel="Loading data..." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data...');
  });

  it('renders one skeleton element by default', () => {
    const { container } = render(<Skeleton />);
    const items = container.querySelectorAll('[aria-hidden="true"]');
    expect(items).toHaveLength(1);
  });

  // ─── Count ────────────────────────────────────────────────────────
  it('renders multiple skeleton elements', () => {
    const { container } = render(<Skeleton count={3} />);
    const items = container.querySelectorAll('[aria-hidden="true"]');
    expect(items).toHaveLength(3);
  });

  // ─── Variants ─────────────────────────────────────────────────────
  it.each(['line', 'circle', 'rect', 'text'])('applies variant class "%s"', variant => {
    const { container } = render(<Skeleton variant={variant} />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el.className).toContain(variant);
  });

  it('applies "circle" border-radius for circle variant', () => {
    const { container } = render(<Skeleton variant="circle" width="48px" height="48px" />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el.style.borderRadius).toBe('50%');
  });

  // ─── Dimensions ───────────────────────────────────────────────────
  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="40px" />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('40px');
  });

  it('defaults to width=100% and height=20px', () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('20px');
  });

  // ─── Custom borderRadius ─────────────────────────────────────────
  it('allows custom borderRadius override', () => {
    const { container } = render(<Skeleton borderRadius="8px" />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el.style.borderRadius).toBe('8px');
  });

  // ─── Animation ────────────────────────────────────────────────────
  it('applies noAnimation class when animated=false', () => {
    const { container } = render(<Skeleton animated={false} />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el.className).toContain('noAnimation');
  });

  // ─── Inline ───────────────────────────────────────────────────────
  it('uses inline wrapper class when inline=true', () => {
    const { container } = render(<Skeleton inline />);
    expect(container.firstChild.className).toContain('Inline');
  });

  // ─── className ────────────────────────────────────────────────────
  it('merges custom className', () => {
    const { container } = render(<Skeleton className="custom" />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el.className).toContain('custom');
  });

  // ─── displayName ──────────────────────────────────────────────────
  it('has displayName "Skeleton"', () => {
    expect(Skeleton.displayName).toBe('Skeleton');
  });
});
