/**
 * @fileoverview ToastContainer Component Tests
 * @description Coverage: portal rendering, empty state, toast mapping, a11y
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock useToast hook
const mockRemoveToast = vi.fn();
let mockToasts = [];

vi.mock('@/hooks', () => ({
  useToast: () => ({
    toasts: mockToasts,
    removeToast: mockRemoveToast,
  }),
}));

// Mock Toast component to simplify
vi.mock('../../Toast/Toast', () => ({
  default: ({ message, onClose, id }) => (
    <div data-testid={`toast-${id}`} role="alert">
      {message}
      <button onClick={() => onClose(id)}>close</button>
    </div>
  ),
}));

import ToastContainer from '../ToastContainer';

describe('ToastContainer', () => {
  let portalRoot;

  beforeEach(() => {
    // Create portal root
    portalRoot = document.createElement('div');
    portalRoot.id = 'toast-portal-root';
    document.body.appendChild(portalRoot);
    mockToasts = [];
    mockRemoveToast.mockClear();
  });

  afterEach(() => {
    if (portalRoot && portalRoot.parentNode) {
      portalRoot.parentNode.removeChild(portalRoot);
    }
  });

  it('returns null when no toasts', () => {
    mockToasts = [];
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when toasts is empty array', () => {
    mockToasts = [];
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders toasts into portal root', () => {
    mockToasts = [
      { id: '1', message: 'Saved' },
      { id: '2', message: 'Deleted' },
    ];
    render(<ToastContainer />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  it('renders inside the portal root element (not in component tree)', () => {
    mockToasts = [{ id: '1', message: 'Note' }];
    render(<ToastContainer />);
    expect(portalRoot.querySelector('[data-testid="toast-1"]')).toBeInTheDocument();
  });

  it('sets aria-live="polite" on the container', () => {
    mockToasts = [{ id: '1', message: 'X' }];
    render(<ToastContainer />);
    const container = portalRoot.querySelector('[aria-live="polite"]');
    expect(container).toBeInTheDocument();
  });

  it('sets aria-atomic="false"', () => {
    mockToasts = [{ id: '1', message: 'X' }];
    render(<ToastContainer />);
    const container = portalRoot.querySelector('[aria-atomic="false"]');
    expect(container).toBeInTheDocument();
  });

  it('passes removeToast as onClose to each Toast', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    mockToasts = [{ id: '42', message: 'Hello' }];
    render(<ToastContainer />);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(mockRemoveToast).toHaveBeenCalledWith('42');
  });

  it('logs error and returns null when portal root is missing', () => {
    // Remove portal root
    portalRoot.parentNode.removeChild(portalRoot);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockToasts = [{ id: '1', message: 'X' }];
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('toast-portal-root')
    );
    errorSpy.mockRestore();
    // Re-create for afterEach cleanup
    portalRoot = document.createElement('div');
    portalRoot.id = 'toast-portal-root';
    document.body.appendChild(portalRoot);
  });
});
