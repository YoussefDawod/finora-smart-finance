/**
 * @fileoverview Input Component Tests
 * @description Full coverage: label, types, error/hint, size, icons, char count, ref, focus
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../Input';

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }) => <div {...props}>{children}</div>,
    label: ({ children, initial, animate, ...props }) => <label {...props}>{children}</label>,
    input: ({ children, initial, animate, transition, ...props }) => <input {...props} />,
    span: ({ children, initial, animate, transition, ...props }) => (
      <span {...props}>{children}</span>
    ),
    p: ({ children, initial, animate, transition, ...props }) => <p {...props}>{children}</p>,
  },
}));
/* eslint-enable no-unused-vars */

describe('Input', () => {
  // ─── Basic rendering ──────────────────────────────────────────────
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(<Input label="Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with correct type', () => {
    render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('renders placeholder', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  // ─── Error & Hint ─────────────────────────────────────────────────
  it('shows error message with role="alert"', () => {
    render(<Input error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('shows hint when no error', () => {
    render(<Input hint="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('hides hint when error is present', () => {
    render(<Input hint="Help text" error="Error!" />);
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies hasError CSS class', () => {
    const { container } = render(<Input error="err" />);
    expect(container.firstChild.className).toContain('hasError');
  });

  // ─── Sizes ────────────────────────────────────────────────────────
  it.each(['small', 'medium', 'large'])('applies "%s" size class', size => {
    const { container } = render(<Input size={size} />);
    expect(container.firstChild.className).toContain(size);
  });

  // ─── Disabled ─────────────────────────────────────────────────────
  it('disables the input', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // ─── Icons ────────────────────────────────────────────────────────
  it('renders left icon', () => {
    render(<Input icon={<span data-testid="left-ico">€</span>} />);
    expect(screen.getByTestId('left-ico')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Input iconRight={<span data-testid="right-ico">🔍</span>} />);
    expect(screen.getByTestId('right-ico')).toBeInTheDocument();
  });

  // ─── Character count ──────────────────────────────────────────────
  it('shows char counter when showCharCount + maxLength', () => {
    render(<Input showCharCount maxLength={100} value="Hello" />);
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('hides char counter without maxLength', () => {
    render(<Input showCharCount value="Hello" />);
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
  });

  // ─── Events ───────────────────────────────────────────────────────
  it('calls onChange on input', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('applies focused class on focus and removes on blur', () => {
    const { container } = render(<Input />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(container.firstChild.className).toContain('focused');
    fireEvent.blur(input);
    expect(container.firstChild.className).not.toContain('focused');
  });

  // ─── Ref forwarding ──────────────────────────────────────────────
  it('forwards ref to the input element', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName).toBe('INPUT');
  });

  // ─── className merge ──────────────────────────────────────────────
  it('merges custom className', () => {
    const { container } = render(<Input className="extra" />);
    expect(container.firstChild.className).toContain('extra');
  });
});
