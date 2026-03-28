/**
 * @fileoverview Filter Component Tests
 * @description Coverage: period, type, category, date filters, clear, onChange
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import Filter from '../Filter';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de' },
  }),
}));

// Mock category utilities
vi.mock('@/config/categoryConstants', () => ({
  getCategoriesForType: type => {
    if (type === 'income') return ['salary', 'freelance'];
    if (type === 'expense') return ['food', 'rent', 'transport'];
    return [];
  },
}));

vi.mock('@/utils/categoryTranslations', () => ({
  translateCategory: cat => `translated_${cat}`,
}));

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));
/* eslint-enable no-unused-vars */

// Mock useMotion (required by Filter)
vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ prefersReducedMotion: false, shouldAnimate: false }),
}));

// Mock DateInput – renders native <input type="date"> in tests
vi.mock('@/components/common/DateInput/DateInput', () => ({
  default: ({ value, onChange, label, ariaLabel, disabled }) => (
    <label>
      {label}
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        aria-label={ariaLabel || label}
        disabled={disabled}
      />
    </label>
  ),
}));

const defaultCategories = ['salary', 'freelance', 'food', 'rent', 'transport'];

describe('Filter', () => {
  let handleChange;
  let handleClear;

  beforeEach(() => {
    handleChange = vi.fn();
    handleClear = vi.fn();
  });

  const renderFilter = (props = {}) =>
    render(
      <Filter
        value={{}}
        onChange={handleChange}
        onClear={handleClear}
        categories={defaultCategories}
        {...props}
      />
    );

  // ─── Basic Rendering ──────────────────────────────────────────────
  it('renders filter button', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: /filters\.open/i })).toBeInTheDocument();
  });

  it('starts with dropdown closed', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: /filters\.open/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByText('filters.period')).toBeInTheDocument();
    expect(screen.getByText('filters.type')).toBeInTheDocument();
    expect(screen.getByText('filters.category')).toBeInTheDocument();
    expect(screen.getByText('filters.date')).toBeInTheDocument();
  });

  // ─── Period Filters ───────────────────────────────────────────────
  it('shows period options', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByText('filters.today')).toBeInTheDocument();
    expect(screen.getByText('filters.thisWeek')).toBeInTheDocument();
    expect(screen.getByText('filters.thisMonth')).toBeInTheDocument();
    expect(screen.getByText('filters.thisYear')).toBeInTheDocument();
  });

  it('calls onChange with date range when period is selected', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    await user.click(screen.getByText('filters.today'));
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    );
  });

  // ─── Type Filters ────────────────────────────────────────────────
  it('shows type options (income, expense)', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByText('transactions.income')).toBeInTheDocument();
    expect(screen.getByText('transactions.expense')).toBeInTheDocument();
  });

  it('calls onChange with type when type option is clicked', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    await user.click(screen.getByText('transactions.income'));
    expect(handleChange).toHaveBeenCalledWith({ type: 'income' });
  });

  it('toggles type off when same type is clicked again', async () => {
    const user = userEvent.setup();
    renderFilter({ value: { type: 'income' } });
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    await user.click(screen.getByText('transactions.income'));
    expect(handleChange).toHaveBeenCalledWith({ type: null });
  });

  // ─── Category (depends on type) ──────────────────────────────────
  it('shows category select', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows all-categories option', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByText('filters.allCategories')).toBeInTheDocument();
  });

  it('shows categories translated', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByText('translated_salary')).toBeInTheDocument();
    expect(screen.getByText('translated_food')).toBeInTheDocument();
  });

  it('filters categories by selected type', async () => {
    const user = userEvent.setup();
    renderFilter({ value: { type: 'income' } });
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    // Only income categories should show
    expect(screen.getByText('translated_salary')).toBeInTheDocument();
    expect(screen.getByText('translated_freelance')).toBeInTheDocument();
    expect(screen.queryByText('translated_food')).toBeNull();
  });

  it('calls onChange for category selection', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'salary' } });
    expect(handleChange).toHaveBeenCalledWith({ category: 'salary' });
  });

  it('calls onChange with null for "all categories"', async () => {
    const user = userEvent.setup();
    renderFilter({ value: { category: 'food' } });
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(handleChange).toHaveBeenCalledWith({ category: null });
  });

  // ─── Date Filters ────────────────────────────────────────────────
  it('shows date inputs', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByText('filters.from')).toBeInTheDocument();
    expect(screen.getByText('filters.to')).toBeInTheDocument();
  });

  // ─── Clear / Reset ───────────────────────────────────────────────
  it('shows reset button', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    expect(screen.getByText('filters.reset')).toBeInTheDocument();
  });

  it('calls onClear when reset is clicked', async () => {
    const user = userEvent.setup();
    renderFilter();
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    await user.click(screen.getByText('filters.reset'));
    expect(handleClear).toHaveBeenCalledOnce();
  });

  // ─── Active State ────────────────────────────────────────────────
  it('applies active class when filters are present', () => {
    const { container } = renderFilter({ value: { type: 'income' } });
    const btn = container.querySelector('button');
    expect(btn.className).toContain('active');
  });

  it('invalidates category when type changes and category is not valid', async () => {
    const user = userEvent.setup();
    // User has expense type with food category
    renderFilter({ value: { type: 'expense', category: 'food' } });
    await user.click(screen.getByRole('button', { name: /filters\.open/i }));
    // Switch to income — food is not a valid income category
    await user.click(screen.getByText('transactions.income'));
    expect(handleChange).toHaveBeenCalledWith({ type: 'income', category: null });
  });
});
