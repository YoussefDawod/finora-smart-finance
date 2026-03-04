/**
 * @fileoverview Select Component Tests
 * @description Full coverage: options, placeholder, label, error/hint, size, disabled, focus, ref
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../Select';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'de' } }),
}));

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: true, prefersReducedMotion: false }),
}));

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }) => (
      <div {...props}>{children}</div>
    ),
    label: ({ children, initial, animate, ...props }) => (
      <label {...props}>{children}</label>
    ),
    select: ({ children, initial, animate, transition, ...props }) => (
      <select {...props}>{children}</select>
    ),
    p: ({ children, initial, animate, transition, ...props }) => (
      <p {...props}>{children}</p>
    ),
  },
}));
/* eslint-enable no-unused-vars */

const options = [
  { value: 'food', label: 'Lebensmittel' },
  { value: 'transport', label: 'Transport' },
  { value: 'rent', label: 'Miete' },
];

describe('Select', () => {
  // ─── Basic rendering ──────────────────────────────────────────────
  it('renders a select element with options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Lebensmittel')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Miete')).toBeInTheDocument();
  });

  it('renders placeholder option (i18n fallback)', () => {
    render(<Select options={options} />);
    expect(screen.getByText('common.selectPlaceholder')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<Select options={options} placeholder="Wähle..." />);
    expect(screen.getByText('Wähle...')).toBeInTheDocument();
  });

  it('renders empty options list with only placeholder', () => {
    render(<Select options={[]} />);
    const select = screen.getByRole('combobox');
    // Only placeholder option
    expect(select.querySelectorAll('option')).toHaveLength(1);
  });

  // ─── Label ────────────────────────────────────────────────────────
  it('renders label', () => {
    render(<Select label="Kategorie" options={options} id="cat" />);
    expect(screen.getByText('Kategorie')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(<Select label="Typ" required options={options} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  // ─── Error & Hint ─────────────────────────────────────────────────
  it('shows error message with role="alert"', () => {
    render(<Select options={options} error="Pflichtfeld" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Pflichtfeld');
  });

  it('shows hint when no error', () => {
    render(<Select options={options} hint="Wähle eine Kategorie" />);
    expect(screen.getByText('Wähle eine Kategorie')).toBeInTheDocument();
  });

  it('hides hint when error is present', () => {
    render(<Select options={options} hint="Help" error="Error!" />);
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });

  // ─── Sizes ────────────────────────────────────────────────────────
  it.each(['small', 'medium', 'large'])('applies "%s" size class', (size) => {
    const { container } = render(<Select options={options} size={size} />);
    expect(container.firstChild.className).toContain(size);
  });

  // ─── Disabled ─────────────────────────────────────────────────────
  it('disables the select', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies disabled CSS class', () => {
    const { container } = render(<Select options={options} disabled />);
    expect(container.firstChild.className).toContain('disabled');
  });

  // ─── Events ───────────────────────────────────────────────────────
  it('calls onChange on selection change', () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'food' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('applies focused class on focus', () => {
    const { container } = render(<Select options={options} />);
    fireEvent.focus(screen.getByRole('combobox'));
    expect(container.firstChild.className).toContain('focused');
  });

  // ─── Chevron icon ─────────────────────────────────────────────────
  it('renders dropdown arrow icon', () => {
    const { container } = render(<Select options={options} />);
    expect(container.querySelector('[class*="arrow"]')).toBeInTheDocument();
  });

  // ─── Ref forwarding ──────────────────────────────────────────────
  it('forwards ref', () => {
    const ref = { current: null };
    render(<Select ref={ref} options={options} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName).toBe('SELECT');
  });

  // ─── className merge ──────────────────────────────────────────────
  it('merges custom className', () => {
    const { container } = render(<Select options={options} className="extra" />);
    expect(container.firstChild.className).toContain('extra');
  });
});
