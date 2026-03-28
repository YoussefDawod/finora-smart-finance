/**
 * @fileoverview ErrorBoundary Component Tests
 * @description Full coverage: normal render, error catch, fallback, retry, console.error, onRetry
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

vi.mock('@/i18n', () => ({
  default: {
    t: key => {
      const map = {
        'common.errors.somethingWrong': 'Something went wrong',
        'common.retry': 'Try again',
      };
      return map[key] || key;
    },
  },
}));

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, transition, ...props }) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, animate, transition, ...props }) => <span {...props}>{children}</span>,
  },
}));
/* eslint-enable no-unused-vars */

const ThrowError = ({ shouldThrow = true }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  // ─── Normal rendering ─────────────────────────────────────────────
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  // ─── Error catching ───────────────────────────────────────────────
  it('shows default fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('logs caught error via console.error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom oops</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom oops')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  // ─── Retry ────────────────────────────────────────────────────────
  it('shows retry button in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('invokes onRetry callback and resets error state', () => {
    const onRetry = vi.fn();
    render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('re-renders children after retry (will re-catch if still throwing)', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    // ThrowError still throws → error caught again
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  // ─── No custom fallback → shows error string ─────────────────────
  it('displays the error message string in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
  });

  // ─── Chunk-load error detection & reload ──────────────────────────
  describe('chunk-load error handling', () => {
    const chunkMessages = [
      'Failed to fetch dynamically imported module: /src/pages/Dashboard.jsx',
      'Failed to fetch',
      'Loading chunk abc123 failed',
      'Loading CSS chunk styles-abc123 failed',
    ];

    let reloadSpy;

    beforeEach(() => {
      // Mock window.location.reload
      reloadSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadSpy },
        writable: true,
        configurable: true,
      });
    });

    it.each(chunkMessages)('calls window.location.reload() for chunk error: "%s"', msg => {
      const ChunkError = () => {
        throw new Error(msg);
      };

      render(
        <ErrorBoundary>
          <ChunkError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT call reload for a normal error', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });
});
