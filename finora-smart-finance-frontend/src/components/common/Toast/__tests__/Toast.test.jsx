/**
 * @fileoverview Toast Component Tests
 * @description Tests for Toast rendering, types, auto-dismiss, close
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Toast from '../Toast';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de' },
  }),
}));

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================
  // Rendering
  // ==========================================
  it('renders toast message', () => {
    render(<Toast id="1" message="Success!" type="success" onClose={vi.fn()} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders with default info type', () => {
    render(
      <Toast id="2" message="Info toast" onClose={vi.fn()} />
    );
    expect(screen.getByText('Info toast')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<Toast id="3" message="Alert" type="error" onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // ==========================================
  // Types
  // ==========================================
  it('renders success toast', () => {
    const { container } = render(
      <Toast id="4" message="Saved" type="success" onClose={vi.fn()} />
    );
    const toast = container.querySelector('[class*="toast"]');
    expect(toast.className).toContain('success');
  });

  it('renders error toast', () => {
    const { container } = render(
      <Toast id="5" message="Failed" type="error" onClose={vi.fn()} />
    );
    const toast = container.querySelector('[class*="toast"]');
    expect(toast.className).toContain('error');
  });

  it('renders warning toast', () => {
    const { container } = render(
      <Toast id="6" message="Warn" type="warning" onClose={vi.fn()} />
    );
    const toast = container.querySelector('[class*="toast"]');
    expect(toast.className).toContain('warning');
  });

  // ==========================================
  // Close Button
  // ==========================================
  it('renders close button', () => {
    render(<Toast id="7" message="Close me" onClose={vi.fn()} />);
    const closeBtn = screen.getByLabelText('common.closeNotification');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Toast id="8" message="Closable" onClose={onClose} />);
    const closeBtn = screen.getByLabelText('common.closeNotification');
    fireEvent.click(closeBtn);

    // onClose gets called after exit animation delay
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onClose).toHaveBeenCalled();
  });

  // ==========================================
  // Auto-dismiss
  // ==========================================
  it('auto-dismisses after duration', () => {
    const onClose = vi.fn();
    render(<Toast id="9" message="Auto" duration={3000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(onClose).toHaveBeenCalled();
  });

  // ==========================================
  // Action Button
  // ==========================================
  it('renders action button when provided', () => {
    const action = { label: 'Undo', onClick: vi.fn() };
    render(<Toast id="10" message="Deleted" action={action} onClose={vi.fn()} />);
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('calls action onClick when action button is clicked', () => {
    const actionClick = vi.fn();
    const action = { label: 'Retry', onClick: actionClick };
    render(<Toast id="11" message="Failed" action={action} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(actionClick).toHaveBeenCalledTimes(1);
  });
});
