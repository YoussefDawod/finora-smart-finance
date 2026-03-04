/**
 * @fileoverview Button Component Tests
 * @description Full coverage: variants, sizes, states, icons, a11y, ref forwarding
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, transition, ...props }) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, animate, transition, ...props }) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));
/* eslint-enable no-unused-vars */

describe('Button', () => {
  // ─── Rendering ────────────────────────────────────────────────────
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies default variant (primary) and size (medium)', () => {
    const { container } = render(<Button>Default</Button>);
    const cls = container.querySelector('button').className;
    expect(cls).toContain('primary');
    expect(cls).toContain('medium');
  });

  // ─── All Variants ─────────────────────────────────────────────────
  it.each(['primary', 'secondary', 'danger', 'ghost', 'outline'])(
    'applies "%s" variant class',
    (variant) => {
      const { container } = render(<Button variant={variant}>V</Button>);
      expect(container.querySelector('button').className).toContain(variant);
    },
  );

  // ─── All Sizes ────────────────────────────────────────────────────
  it.each(['small', 'medium', 'large'])('applies "%s" size class', (size) => {
    const { container } = render(<Button size={size}>S</Button>);
    expect(container.querySelector('button').className).toContain(size);
  });

  // ─── fullWidth ────────────────────────────────────────────────────
  it('applies fullWidth class when prop is true', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    expect(container.querySelector('button').className).toContain('fullWidth');
  });

  it('does not apply fullWidth when prop is false', () => {
    const { container } = render(<Button>Normal</Button>);
    expect(container.querySelector('button').className).not.toContain('fullWidth');
  });

  // ─── className merge ──────────────────────────────────────────────
  it('merges custom className', () => {
    const { container } = render(<Button className="extra">Cls</Button>);
    expect(container.querySelector('button').className).toContain('extra');
  });

  // ─── Disabled state ───────────────────────────────────────────────
  it('is disabled and has aria-disabled when disabled=true', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies disabled CSS class', () => {
    const { container } = render(<Button disabled>D</Button>);
    expect(container.querySelector('button').className).toContain('disabled');
  });

  // ─── Loading state ────────────────────────────────────────────────
  it('is disabled and has aria-busy when loading=true', () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('shows spinner element when loading', () => {
    const { container } = render(<Button loading>Saving</Button>);
    expect(container.querySelector('[class*="spinner"]')).toBeInTheDocument();
  });

  it('hides spinner when not loading', () => {
    const { container } = render(<Button>Normal</Button>);
    expect(container.querySelector('[class*="spinner"]')).not.toBeInTheDocument();
  });

  // ─── Click events ─────────────────────────────────────────────────
  it('calls onClick handler', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>No Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ─── Icons ────────────────────────────────────────────────────────
  it('renders left icon', () => {
    render(<Button icon={<span data-testid="left">★</span>}>Text</Button>);
    expect(screen.getByTestId('left')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button iconRight={<span data-testid="right">→</span>}>Text</Button>);
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('hides left icon during loading (shows spinner instead)', () => {
    render(<Button loading icon={<span data-testid="ico">★</span>}>L</Button>);
    expect(screen.queryByTestId('ico')).not.toBeInTheDocument();
  });

  it('renders icon-only button (icon + no children)', () => {
    const { container } = render(
      <Button icon={<span>+</span>} aria-label="Add" />,
    );
    expect(container.querySelector('[class*="text"]')).not.toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────
  it('sets aria-label for icon-only buttons', () => {
    render(<Button icon={<span>★</span>} aria-label="Fav" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Fav');
  });

  it('omits aria-label when children are present (text is label)', () => {
    render(<Button icon={<span>★</span>} aria-label="Fav">Favorite</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
  });

  // ─── Ref forwarding ──────────────────────────────────────────────
  it('forwards ref to the button element', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName).toBe('BUTTON');
  });

  // ─── Prop pass-through ────────────────────────────────────────────
  it('passes additional HTML attributes', () => {
    render(<Button data-testid="custom" type="submit">Go</Button>);
    expect(screen.getByTestId('custom')).toHaveAttribute('type', 'submit');
  });
});
