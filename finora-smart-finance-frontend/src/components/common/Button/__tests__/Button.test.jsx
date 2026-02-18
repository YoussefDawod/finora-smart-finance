/**
 * @fileoverview Button Component Tests
 * @description Tests for Button variants, states, and interactions
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

// Mock framer-motion to render plain elements
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
  // ==========================================
  // Rendering
  // ==========================================
  it('renders with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with default variant and size classes', () => {
    const { container } = render(<Button>Default</Button>);
    const btn = container.querySelector('button');
    expect(btn.className).toContain('button');
    expect(btn.className).toContain('primary');
    expect(btn.className).toContain('medium');
  });

  // ==========================================
  // Variants
  // ==========================================
  it('applies variant class correctly', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.querySelector('button').className).toContain('danger');
  });

  it('applies size class correctly', () => {
    const { container } = render(<Button size="large">Large</Button>);
    expect(container.querySelector('button').className).toContain('large');
  });

  it('applies fullWidth class', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    expect(container.querySelector('button').className).toContain('fullWidth');
  });

  // ==========================================
  // Disabled & Loading States
  // ==========================================
  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables button when loading is true', () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('shows spinner when loading', () => {
    const { container } = render(<Button loading>Saving</Button>);
    expect(container.querySelector('[class*="spinner"]')).toBeInTheDocument();
  });

  it('does not show spinner when not loading', () => {
    const { container } = render(<Button>Normal</Button>);
    expect(container.querySelector('[class*="spinner"]')).not.toBeInTheDocument();
  });

  // ==========================================
  // Click Events
  // ==========================================
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ==========================================
  // Icons
  // ==========================================
  it('renders left icon', () => {
    render(<Button icon={<span data-testid="left-icon">★</span>}>With Icon</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button iconRight={<span data-testid="right-icon">→</span>}>Next</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('hides icons when loading', () => {
    render(
      <Button loading icon={<span data-testid="icon">★</span>}>Loading</Button>
    );
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  // ==========================================
  // Accessibility
  // ==========================================
  it('sets aria-label for icon-only buttons', () => {
    render(
      <Button icon={<span>★</span>} aria-label="Favorite" />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Favorite');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref Test</Button>);
    // eslint-disable-next-line no-undef
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes additional props through', () => {
    render(<Button data-testid="custom" type="submit">Submit</Button>);
    expect(screen.getByTestId('custom')).toHaveAttribute('type', 'submit');
  });
});
