/**
 * @fileoverview Alert Component Tests
 * @description Tests for Alert rendering, types, close functionality
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Alert from '../Alert';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de' },
  }),
}));

describe('Alert', () => {
  // ==========================================
  // Rendering
  // ==========================================
  it('renders with message', () => {
    render(<Alert message="Test alert message" />);
    expect(screen.getByText('Test alert message')).toBeInTheDocument();
  });

  it('renders with title and message', () => {
    render(<Alert title="Warning" message="Something happened" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Alert>
        <span>Custom content</span>
      </Alert>
    );
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<Alert message="Accessible alert" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<Alert message="Polite alert" />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  // ==========================================
  // Types / Variants
  // ==========================================
  it('applies info type class by default', () => {
    const { container } = render(<Alert message="Info" />);
    const alert = container.querySelector('[class*="alert"]');
    expect(alert.className).toContain('info');
  });

  it('applies success type class', () => {
    const { container } = render(<Alert type="success" message="Success!" />);
    const alert = container.querySelector('[class*="alert"]');
    expect(alert.className).toContain('success');
  });

  it('applies error type class', () => {
    const { container } = render(<Alert type="error" message="Error!" />);
    const alert = container.querySelector('[class*="alert"]');
    expect(alert.className).toContain('error');
  });

  it('applies warning type class', () => {
    const { container } = render(<Alert type="warning" message="Warning!" />);
    const alert = container.querySelector('[class*="alert"]');
    expect(alert.className).toContain('warning');
  });

  // ==========================================
  // Close Button
  // ==========================================
  it('shows close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(<Alert message="Closeable" onClose={onClose} />);
    const closeBtn = screen.getByRole('button');
    expect(closeBtn).toBeInTheDocument();
  });

  it('does not show close button when onClose is not provided', () => {
    render(<Alert message="Not closeable" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Alert message="Close me" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ==========================================
  // Custom className
  // ==========================================
  it('applies additional className', () => {
    const { container } = render(<Alert message="Custom" className="my-class" />);
    const alert = container.querySelector('[class*="alert"]');
    expect(alert.className).toContain('my-class');
  });
});
