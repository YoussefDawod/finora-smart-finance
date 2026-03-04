/**
 * @fileoverview PasswordInput Component Tests
 * @description Tests for the shared auth password input with toggle
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PasswordInput from '../PasswordInput';

// Minimal formStyles mock — CSS modules return class name strings
const formStyles = {
  inputWrapper: 'inputWrapper',
  inputIcon: 'inputIcon',
  input: 'input',
};

const baseProps = {
  formStyles,
  id: 'password',
  name: 'password',
  placeholder: 'Enter password',
  value: '',
  onChange: vi.fn(),
  showPasswordLabel: 'Show password',
  hidePasswordLabel: 'Hide password',
};

describe('PasswordInput', () => {
  // ─── Rendering ────────────────────────────────────────────────────

  it('renders a password input by default', () => {
    render(<PasswordInput {...baseProps} />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('applies formStyles to the wrapper', () => {
    const { container } = render(<PasswordInput {...baseProps} />);
    expect(container.firstChild).toHaveClass('inputWrapper');
  });

  it('applies formStyles to the input', () => {
    render(<PasswordInput {...baseProps} />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveClass('input');
  });

  it('renders the lock icon', () => {
    const { container } = render(<PasswordInput {...baseProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('forwards id and name to the input', () => {
    render(<PasswordInput {...baseProps} />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('id', 'password');
    expect(input).toHaveAttribute('name', 'password');
  });

  // ─── Error State ─────────────────────────────────────────────────

  it('appends wrapperErrorClass to wrapper', () => {
    const { container } = render(
      <PasswordInput {...baseProps} wrapperErrorClass="error" />
    );
    expect(container.firstChild).toHaveClass('inputWrapper');
    expect(container.firstChild).toHaveClass('error');
  });

  it('does not add extra class when wrapperErrorClass is empty', () => {
    const { container } = render(
      <PasswordInput {...baseProps} wrapperErrorClass="" />
    );
    expect(container.firstChild.className.trim()).toBe('inputWrapper');
  });

  // ─── Toggle Visibility ───────────────────────────────────────────

  it('shows "show password" aria-label initially', () => {
    render(<PasswordInput {...baseProps} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show password');
  });

  it('toggles input type on toggle click', async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...baseProps} />);

    const toggle = screen.getByRole('button');
    const input = screen.getByPlaceholderText('Enter password');

    // Initial: password
    expect(input).toHaveAttribute('type', 'password');

    // Click → text
    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-label', 'Hide password');

    // Click again → password
    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-label', 'Show password');
  });

  it('toggle button has tabIndex -1', () => {
    render(<PasswordInput {...baseProps} />);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1');
  });

  it('toggle button is type="button"', () => {
    render(<PasswordInput {...baseProps} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  // ─── Prop Forwarding ─────────────────────────────────────────────

  it('forwards disabled to the input', () => {
    render(<PasswordInput {...baseProps} disabled />);
    expect(screen.getByPlaceholderText('Enter password')).toBeDisabled();
  });

  it('forwards autoComplete to the input', () => {
    render(<PasswordInput {...baseProps} autoComplete="new-password" />);
    expect(screen.getByPlaceholderText('Enter password')).toHaveAttribute('autoComplete', 'new-password');
  });

  it('forwards autoFocus to the input', () => {
    render(<PasswordInput {...baseProps} autoFocus />);
    expect(screen.getByPlaceholderText('Enter password')).toHaveFocus();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordInput {...baseProps} onChange={handleChange} />);

    await user.type(screen.getByPlaceholderText('Enter password'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });
});
