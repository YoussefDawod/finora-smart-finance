/**
 * @fileoverview Toast Component Tests
 * @description Full coverage: types, auto-dismiss, close, action, swipe, duration=0, progress
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Toast from '../Toast';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key, i18n: { language: 'de' } }),
}));

const renderToast = (props = {}) =>
  render(<Toast id="t1" message="Hello" onClose={vi.fn()} {...props} />);

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // ─── Rendering ────────────────────────────────────────────────────
  it('renders message text', () => {
    renderToast({ message: 'Saved!' });
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('has role="alert" + aria-live="polite"', () => {
    renderToast();
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  // ─── All types ────────────────────────────────────────────────────
  it.each(['success', 'error', 'warning', 'info'])('applies "%s" type class', type => {
    const { container } = renderToast({ type });
    expect(container.querySelector('[role="alert"]').className).toContain(type);
  });

  it('defaults to info type', () => {
    const { container } = renderToast();
    expect(container.querySelector('[role="alert"]').className).toContain('info');
  });

  // ─── Close button ─────────────────────────────────────────────────
  it('has close button with correct aria-label', () => {
    renderToast();
    expect(screen.getByLabelText('common.closeNotification')).toBeInTheDocument();
  });

  it('triggers exit-up phase on close click, then calls onClose after delay', () => {
    const onClose = vi.fn();
    renderToast({ onClose });
    fireEvent.click(screen.getByLabelText('common.closeNotification'));
    expect(onClose).not.toHaveBeenCalled(); // not yet
    act(() => vi.advanceTimersByTime(300)); // EXIT_DURATION
    expect(onClose).toHaveBeenCalledWith('t1');
  });

  // ─── Auto-dismiss ─────────────────────────────────────────────────
  it('auto-dismisses after duration', () => {
    const onClose = vi.fn();
    renderToast({ onClose, duration: 2000 });
    act(() => vi.advanceTimersByTime(2500));
    expect(onClose).toHaveBeenCalledWith('t1');
  });

  it('does NOT auto-dismiss when duration=0', () => {
    const onClose = vi.fn();
    renderToast({ onClose, duration: 0 });
    act(() => vi.advanceTimersByTime(10000));
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Progress bar ─────────────────────────────────────────────────
  it('renders progress bar when duration > 0', () => {
    const { container } = renderToast({ duration: 5000 });
    expect(container.querySelector('[class*="progressBar"]')).toBeInTheDocument();
  });

  it('does NOT render progress bar when duration=0', () => {
    const { container } = renderToast({ duration: 0 });
    expect(container.querySelector('[class*="progressBar"]')).not.toBeInTheDocument();
  });

  // ─── Action button ────────────────────────────────────────────────
  it('renders action button with label', () => {
    renderToast({ action: { label: 'Undo', onClick: vi.fn() } });
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('calls action onClick, then triggers exit', () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    renderToast({ action: { label: 'Retry', onClick }, onClose });
    fireEvent.click(screen.getByText('Retry'));
    expect(onClick).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render action button when no action prop', () => {
    renderToast();
    expect(screen.queryByRole('button', { name: /undo|retry/i })).not.toBeInTheDocument();
  });

  // ─── Swipe-to-dismiss (touch events) ──────────────────────────────
  it('dismisses on swipe left exceeding threshold (80px)', () => {
    const onClose = vi.fn();
    const { container } = renderToast({ onClose, duration: 0 });
    const toast = container.querySelector('[role="alert"]');

    fireEvent.touchStart(toast, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(toast, { touches: [{ clientX: 100 }] }); // -100px
    fireEvent.touchEnd(toast);

    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledWith('t1');
  });

  it('dismisses on swipe right exceeding threshold', () => {
    const onClose = vi.fn();
    const { container } = renderToast({ onClose, duration: 0 });
    const toast = container.querySelector('[role="alert"]');

    fireEvent.touchStart(toast, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(toast, { touches: [{ clientX: 200 }] }); // +100px
    fireEvent.touchEnd(toast);

    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledWith('t1');
  });

  it('snaps back on short swipe (< 80px)', () => {
    const onClose = vi.fn();
    const { container } = renderToast({ onClose, duration: 0 });
    const toast = container.querySelector('[role="alert"]');

    fireEvent.touchStart(toast, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(toast, { touches: [{ clientX: 160 }] }); // -40px
    fireEvent.touchEnd(toast);

    act(() => vi.advanceTimersByTime(500));
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Icon rendering ──────────────────────────────────────────────
  it('renders icon with aria-hidden', () => {
    const { container } = renderToast();
    const icon = container.querySelector('[class*="icon"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  // ─── Double-exit guard ────────────────────────────────────────────
  it('only calls onClose once even with multiple close triggers', () => {
    const onClose = vi.fn();
    renderToast({ onClose, duration: 0 });
    const closeBtn = screen.getByLabelText('common.closeNotification');

    fireEvent.click(closeBtn);
    fireEvent.click(closeBtn); // second click should be ignored

    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
