/**
 * @fileoverview Search Component Tests
 * @description Coverage: form submission, placeholder, aria, isSearching, onChange
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Search from '../Search';

// i18n is mocked globally — t() returns the key

describe('Search', () => {
  it('renders a search form', () => {
    render(<Search />);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('renders a text input', () => {
    render(<Search />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('uses i18n placeholder by default', () => {
    render(<Search />);
    expect(screen.getByPlaceholderText('transactions.searchPlaceholder')).toBeInTheDocument();
  });

  it('uses custom placeholder when provided', () => {
    render(<Search placeholder="Search here..." />);
    expect(screen.getByPlaceholderText('Search here...')).toBeInTheDocument();
  });

  it('uses i18n aria-label by default', () => {
    render(<Search />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'transactions.searchAria');
  });

  it('uses custom aria-label when provided', () => {
    render(<Search ariaLabel="Custom search" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Custom search');
  });

  it('displays the value prop', () => {
    render(<Search value="test query" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('test query');
  });

  it('calls onChange with input value', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Search value="" onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('calls onSubmit with trimmed value on form submit', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<Search value="  hello  " onSubmit={handleSubmit} />);
    // Submit via Enter key on the input
    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(handleSubmit).toHaveBeenCalledWith('hello');
  });

  it('calls onSubmit with empty string when value is only spaces', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<Search value="   " onSubmit={handleSubmit} />);
    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(handleSubmit).toHaveBeenCalledWith('');
  });

  it('sets aria-busy when isSearching=true', () => {
    render(<Search isSearching={true} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-busy=false when not searching', () => {
    render(<Search isSearching={false} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-busy', 'false');
  });

  it('renders search icon (aria-hidden)', () => {
    const { container } = render(<Search />);
    // FiSearch renders an SVG; mocked as svg or icon
    const hiddenIcon = container.querySelector('[aria-hidden="true"]');
    expect(hiddenIcon).toBeInTheDocument();
  });

  it('renders spinner indicator when isSearching=true', () => {
    const { container } = render(<Search isSearching={true} />);
    // Spinner span has aria-hidden="true", so we find it by class
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('does not render spinner when isSearching=false', () => {
    render(<Search isSearching={false} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not call onSubmit when handler is not provided', async () => {
    const user = userEvent.setup();
    // Should not throw
    render(<Search value="test" />);
    await user.type(screen.getByRole('textbox'), '{Enter}');
  });
});
