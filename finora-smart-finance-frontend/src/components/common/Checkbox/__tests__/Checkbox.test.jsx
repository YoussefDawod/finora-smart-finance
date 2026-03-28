/**
 * @fileoverview Tests für die wiederverwendbare Checkbox-Komponente
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  // ── Rendering ─────────────────────────────────
  it('renders with text label', () => {
    render(<Checkbox label="Remember me" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Remember me')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders with children instead of label', () => {
    render(
      <Checkbox checked={false} onChange={() => {}}>
        <span>
          Rich label with <a href="/privacy">link</a>
        </span>
      </Checkbox>
    );
    expect(screen.getByText('link')).toBeInTheDocument();
  });

  it('renders nothing when no label/children given', () => {
    const { container } = render(<Checkbox checked={false} onChange={() => {}} />);
    // Only the hidden input + checkmark span, no text span
    expect(container.querySelector('span[class*="text"]')).toBeNull();
  });

  // ── Checked State ─────────────────────────────
  it('reflects checked state', () => {
    render(<Checkbox label="Test" checked={true} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('reflects unchecked state', () => {
    render(<Checkbox label="Test" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  // ── onChange ──────────────────────────────────
  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Test" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('calls onChange when label text is clicked', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Click me" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // ── Disabled ──────────────────────────────────
  it('disables the input when disabled=true', () => {
    render(<Checkbox label="Test" checked={false} onChange={() => {}} disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('prevents interaction when disabled (input has disabled attribute)', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Test" checked={false} onChange={onChange} disabled />);
    const input = screen.getByRole('checkbox');
    expect(input).toBeDisabled();
    expect(input.closest('label').className).toContain('disabled');
  });

  // ── Required ──────────────────────────────────
  it('marks the input as required', () => {
    render(<Checkbox label="Consent" checked={false} onChange={() => {}} required />);
    expect(screen.getByRole('checkbox')).toBeRequired();
  });

  // ── Name ──────────────────────────────────────
  it('sets the name attribute', () => {
    render(<Checkbox label="Test" name="rememberMe" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('name', 'rememberMe');
  });

  // ── Custom id ─────────────────────────────────
  it('uses custom id when provided', () => {
    render(<Checkbox label="Test" id="custom-cb" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'custom-cb');
  });

  it('auto-generates id when not provided', () => {
    render(<Checkbox label="Test" checked={false} onChange={() => {}} />);
    const input = screen.getByRole('checkbox');
    expect(input.id).toBeTruthy();
    expect(input.id).toMatch(/^cb-/);
  });

  // ── Variant classes ───────────────────────────
  it('applies warning class for variant="warning"', () => {
    const { container } = render(
      <Checkbox label="Warn" variant="warning" checked={false} onChange={() => {}} />
    );
    const label = container.querySelector('label');
    expect(label.className).toContain('warning');
  });

  it('applies error class for variant="error"', () => {
    const { container } = render(
      <Checkbox label="Err" variant="error" checked={false} onChange={() => {}} />
    );
    const label = container.querySelector('label');
    expect(label.className).toContain('error');
  });

  // ── Size classes ──────────────────────────────
  it('applies sm class for size="sm"', () => {
    const { container } = render(
      <Checkbox label="Small" size="sm" checked={false} onChange={() => {}} />
    );
    const label = container.querySelector('label');
    expect(label.className).toContain('sm');
  });

  // ── className forwarding ──────────────────────
  it('forwards custom className', () => {
    const { container } = render(
      <Checkbox label="Extra" className="my-extra" checked={false} onChange={() => {}} />
    );
    const label = container.querySelector('label');
    expect(label.className).toContain('my-extra');
  });

  // ── Accessibility ─────────────────────────────
  it('associates label with input via htmlFor/id', () => {
    render(<Checkbox label="Accessible" id="a11y-cb" checked={false} onChange={() => {}} />);
    const label = screen.getByText('Accessible').closest('label');
    expect(label).toHaveAttribute('for', 'a11y-cb');
  });

  it('has aria-hidden checkmark span', () => {
    const { container } = render(<Checkbox label="Test" checked={false} onChange={() => {}} />);
    const checkmark = container.querySelector('[aria-hidden="true"]');
    expect(checkmark).toBeInTheDocument();
  });
});
