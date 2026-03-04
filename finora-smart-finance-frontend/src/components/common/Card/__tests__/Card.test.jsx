/**
 * @fileoverview Card Component Tests
 * @description Full coverage: children, className, prop forwarding
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Card from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Content</p></Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies "card" className by default', () => {
    const { container } = render(<Card>C</Card>);
    expect(container.firstChild).toHaveClass('card');
  });

  it('renders as a div element', () => {
    const { container } = render(<Card>C</Card>);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  it('renders without children (empty card)', () => {
    const { container } = render(<Card />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('card');
  });

  it('forwards data-testid', () => {
    render(<Card data-testid="my-card">X</Card>);
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
  });

  it('forwards onClick handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Click me</Card>);
    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('overrides className via spread props (className comes after card)', () => {
    // Card: <div className="card" {...props}> — spread props override className
    const { container } = render(<Card className="custom">X</Card>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards aria attributes', () => {
    const { container } = render(<Card role="region" aria-label="Test">X</Card>);
    expect(container.firstChild).toHaveAttribute('role', 'region');
    expect(container.firstChild).toHaveAttribute('aria-label', 'Test');
  });
});
