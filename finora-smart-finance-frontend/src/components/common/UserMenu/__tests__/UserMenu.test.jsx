/**
 * @fileoverview UserMenu Component Tests — Aurora Flow Glass
 * @description Coverage: initials, dropdown toggle, click-outside, Escape, profile link, logout,
 *              shouldAnimate guard, glass classes, useMemo
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import UserMenu from '../UserMenu';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de' },
  }),
}));

let mockShouldAnimate = true;

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: mockShouldAnimate, prefersReducedMotion: !mockShouldAnimate }),
}));

/* eslint-disable no-unused-vars */
let capturedMotionProps = {};

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, transition, ...props }) => {
      capturedMotionProps = { whileHover, whileTap };
      return <button {...props}>{children}</button>;
    },
    div: ({ children, initial, animate, exit, transition, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));
/* eslint-enable no-unused-vars */

const defaultUser = { name: 'Max Mustermann', email: 'max@test.de' };

const renderMenu = (props = {}) =>
  render(
    <MemoryRouter>
      <UserMenu user={defaultUser} onLogout={vi.fn()} {...props} />
    </MemoryRouter>
  );

describe('UserMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockShouldAnimate = true;
    capturedMotionProps = {};
  });

  // ─── Avatar & Initials ────────────────────────────────────────────
  it('renders avatar button', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: /common\.userMenu/i })).toBeInTheDocument();
  });

  it('displays initials from user name', () => {
    renderMenu();
    expect(screen.getByText('MM')).toBeInTheDocument();
  });

  it('displays "U" for user without name', () => {
    renderMenu({ user: {} });
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('displays single initial for single-word name', () => {
    renderMenu({ user: { name: 'Admin', email: 'a@b.de' } });
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  // ─── Dropdown Toggle ──────────────────────────────────────────────
  it('starts with dropdown closed (aria-expanded=false)', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: /common\.userMenu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    expect(screen.getByText(defaultUser.name)).toBeInTheDocument();
    expect(screen.getByText(defaultUser.email)).toBeInTheDocument();
  });

  it('sets aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    expect(screen.getByRole('button', { name: /common\.userMenu/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('toggles dropdown closed on second click', async () => {
    const user = userEvent.setup();
    renderMenu();
    const btn = screen.getByRole('button', { name: /common\.userMenu/i });
    await user.click(btn);
    expect(screen.getByText(defaultUser.name)).toBeInTheDocument();
    await user.click(btn);
    expect(screen.queryByText(defaultUser.email)).toBeNull();
  });

  // ─── Dropdown Content ─────────────────────────────────────────────
  it('shows profile link pointing to /profile', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    const profileLink = screen.getByRole('link', { name: /nav\.profile/i });
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('shows logout button', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    expect(screen.getByText('nav.logout')).toBeInTheDocument();
  });

  // ─── Logout ───────────────────────────────────────────────────────
  it('calls onLogout and closes dropdown', async () => {
    const user = userEvent.setup();
    const handleLogout = vi.fn().mockResolvedValue();
    renderMenu({ onLogout: handleLogout });
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    await user.click(screen.getByText('nav.logout'));
    expect(handleLogout).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByText(defaultUser.email)).toBeNull();
    });
  });

  // ─── Close on Escape ──────────────────────────────────────────────
  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    expect(screen.getByText(defaultUser.name)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText(defaultUser.email)).toBeNull();
    });
  });

  // ─── Close on Click Outside ───────────────────────────────────────
  it('closes dropdown on click outside', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    expect(screen.getByText(defaultUser.name)).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText(defaultUser.email)).toBeNull();
    });
  });

  // ─── Profile link closes dropdown ─────────────────────────────────
  it('closes dropdown when profile link is clicked', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: /common\.userMenu/i }));
    await user.click(screen.getByRole('link', { name: /nav\.profile/i }));
    await waitFor(() => {
      expect(screen.queryByText(defaultUser.email)).toBeNull();
    });
  });

  // ─── shouldAnimate guard ──────────────────────────────────────────
  it('passes no motion props when shouldAnimate is false', () => {
    mockShouldAnimate = false;
    renderMenu();
    expect(capturedMotionProps.whileHover).toBeUndefined();
    expect(capturedMotionProps.whileTap).toBeUndefined();
  });

  it('passes motion props when shouldAnimate is true', () => {
    mockShouldAnimate = true;
    renderMenu();
    expect(capturedMotionProps.whileHover).toEqual({ scale: 1.02 });
    expect(capturedMotionProps.whileTap).toEqual({ scale: 0.98 });
  });
});
