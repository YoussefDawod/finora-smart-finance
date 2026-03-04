/**
 * @fileoverview ErrorBanner Component Tests
 * @description Tests for the shared auth error banner
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ErrorBanner from '../ErrorBanner';

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

describe('ErrorBanner', () => {
  // ─── Rendering ────────────────────────────────────────────────────

  it('renders nothing when error is empty', () => {
    const { container } = render(<ErrorBanner error="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when error is falsy', () => {
    const { container } = render(<ErrorBanner error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays the error message', () => {
    render(<ErrorBanner error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders the alert icon', () => {
    const { container } = render(<ErrorBanner error="Error" />);
    // FiAlertCircle renders as an SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  // ─── Dismiss Button ──────────────────────────────────────────────

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<ErrorBanner error="Error" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss is provided', () => {
    render(
      <ErrorBanner
        error="Error"
        onDismiss={() => {}}
        dismissAriaLabel="Dismiss"
      />
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    render(
      <ErrorBanner
        error="Error"
        onDismiss={handleDismiss}
        dismissAriaLabel="Dismiss"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  it('dismiss button has correct aria-label', () => {
    render(
      <ErrorBanner
        error="Error"
        onDismiss={() => {}}
        dismissAriaLabel="Fehler schließen"
      />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Fehler schließen');
  });

  it('dismiss button is type="button" (not submit)', () => {
    render(
      <ErrorBanner
        error="Error"
        onDismiss={() => {}}
        dismissAriaLabel="Dismiss"
      />
    );
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
