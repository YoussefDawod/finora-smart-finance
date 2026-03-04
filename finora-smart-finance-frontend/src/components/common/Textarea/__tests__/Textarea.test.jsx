/**
 * @fileoverview Textarea Component Tests
 * @description Full coverage: label, error/hint, size, char count, disabled, focus, ref
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Textarea } from '../Textarea';

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }) => (
      <div {...props}>{children}</div>
    ),
    label: ({ children, initial, animate, ...props }) => (
      <label {...props}>{children}</label>
    ),
    textarea: ({ children, initial, animate, transition, ...props }) => (
      <textarea {...props} />
    ),
    span: ({ children, initial, animate, transition, ...props }) => (
      <span {...props}>{children}</span>
    ),
    p: ({ children, initial, animate, transition, ...props }) => (
      <p {...props}>{children}</p>
    ),
  },
}));
/* eslint-enable no-unused-vars */

describe('Textarea', () => {
  // ─── Basic rendering ──────────────────────────────────────────────
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with correct rows', () => {
    render(<Textarea rows={6} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
  });

  it('defaults to 4 rows', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });

  it('renders placeholder', () => {
    render(<Textarea placeholder="Beschreibung..." />);
    expect(screen.getByPlaceholderText('Beschreibung...')).toBeInTheDocument();
  });

  // ─── Label ────────────────────────────────────────────────────────
  it('renders label when provided', () => {
    render(<Textarea label="Notiz" id="note" />);
    expect(screen.getByText('Notiz')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(<Textarea label="Pflicht" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  // ─── Error & Hint ─────────────────────────────────────────────────
  it('shows error with role="alert"', () => {
    render(<Textarea error="Zu kurz" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Zu kurz');
  });

  it('shows hint when no error', () => {
    render(<Textarea hint="Max. 500 Zeichen" />);
    expect(screen.getByText('Max. 500 Zeichen')).toBeInTheDocument();
  });

  it('hides hint when error present', () => {
    render(<Textarea hint="Help" error="Error" />);
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });

  // ─── Char count ───────────────────────────────────────────────────
  it('shows char counter when showCharCount + maxLength', () => {
    render(<Textarea showCharCount maxLength={200} value="Hallo" />);
    expect(screen.getByText('5/200')).toBeInTheDocument();
  });

  it('hides counter without maxLength', () => {
    render(<Textarea showCharCount value="Hi" />);
    expect(screen.queryByText(/\/\d+/)).not.toBeInTheDocument();
  });

  // ─── Sizes ────────────────────────────────────────────────────────
  it.each(['small', 'medium', 'large'])('applies "%s" size class', (size) => {
    const { container } = render(<Textarea size={size} />);
    expect(container.firstChild.className).toContain(size);
  });

  // ─── Disabled ─────────────────────────────────────────────────────
  it('disables the textarea', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // ─── Events ───────────────────────────────────────────────────────
  it('calls onChange', () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('toggles focused class', () => {
    const { container } = render(<Textarea />);
    const ta = screen.getByRole('textbox');
    fireEvent.focus(ta);
    expect(container.firstChild.className).toContain('focused');
    fireEvent.blur(ta);
    expect(container.firstChild.className).not.toContain('focused');
  });

  // ─── Ref forwarding ──────────────────────────────────────────────
  it('forwards ref', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} />);
    expect(ref.current?.tagName).toBe('TEXTAREA');
  });

  // ─── className merge ──────────────────────────────────────────────
  it('merges custom className', () => {
    const { container } = render(<Textarea className="extra" />);
    expect(container.firstChild.className).toContain('extra');
  });
});
