/**
 * @fileoverview ThemeSelector Component Tests
 * @description Coverage: isInitialized gate, theme selection, click-outside, Escape, isCollapsed
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import ThemeSelector from '../ThemeSelector';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

// Mock useTheme
const mockSetTheme = vi.fn();
const mockResetToSystemPreference = vi.fn();
let mockThemeState = {
  theme: 'light',
  systemPreference: 'light',
  isInitialized: true,
  setTheme: mockSetTheme,
  resetToSystemPreference: mockResetToSystemPreference,
};

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockThemeState,
}));

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, transition, ...props }) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, initial, animate, exit, transition, ...props }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, animate, transition, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children, initial, ...props }) => children,
}));
/* eslint-enable no-unused-vars */

describe('ThemeSelector', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockResetToSystemPreference.mockClear();
    mockThemeState = {
      theme: 'light',
      systemPreference: 'light',
      isInitialized: true,
      setTheme: mockSetTheme,
      resetToSystemPreference: mockResetToSystemPreference,
    };
  });

  // ─── Initialization Gate ──────────────────────────────────────────
  it('returns null when not initialized', () => {
    mockThemeState.isInitialized = false;
    const { container } = render(<ThemeSelector />);
    expect(container.innerHTML).toBe('');
  });

  it('renders when initialized', () => {
    render(<ThemeSelector />);
    expect(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i })).toBeInTheDocument();
  });

  // ─── Trigger Button ──────────────────────────────────────────────
  it('starts with dropdown closed', () => {
    render(<ThemeSelector />);
    expect(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    expect(screen.getByText('themeSelector.colorScheme')).toBeInTheDocument();
  });

  it('shows title label when not collapsed', () => {
    render(<ThemeSelector />);
    expect(screen.getByText('themeSelector.title')).toBeInTheDocument();
  });

  it('hides title label when isCollapsed=true', () => {
    render(<ThemeSelector isCollapsed={true} />);
    expect(screen.queryByText('themeSelector.title')).toBeNull();
  });

  // ─── Theme Options ───────────────────────────────────────────────
  it('shows all 3 theme options when open', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    expect(screen.getByText('settings.appearance.themeLight')).toBeInTheDocument();
    expect(screen.getByText('settings.appearance.themeDark')).toBeInTheDocument();
    expect(screen.getByText('settings.appearance.themeSystem')).toBeInTheDocument();
  });

  it('calls setTheme("dark") when dark option is selected', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    await user.click(screen.getByText('settings.appearance.themeDark'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("light") when light option is selected', async () => {
    const user = userEvent.setup();
    mockThemeState.theme = 'dark';
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    await user.click(screen.getByText('settings.appearance.themeLight'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls resetToSystemPreference when system option is selected', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    await user.click(screen.getByText('settings.appearance.themeSystem'));
    expect(mockResetToSystemPreference).toHaveBeenCalledOnce();
  });

  it('closes dropdown after theme selection', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    await user.click(screen.getByText('settings.appearance.themeDark'));
    expect(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  // ─── Close on Escape ──────────────────────────────────────────────
  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    expect(screen.getByText('themeSelector.colorScheme')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('themeSelector.colorScheme')).toBeNull();
    });
  });

  // ─── Close on Click Outside ───────────────────────────────────────
  it('closes dropdown on click outside', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText('themeSelector.colorScheme')).toBeNull();
    });
  });

  // ─── onClose callback ────────────────────────────────────────────
  it('calls onClose when closing via theme selection', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ThemeSelector onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    await user.click(screen.getByText('settings.appearance.themeDark'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when closing via Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ThemeSelector onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /themeSelector\.ariaLabel/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
