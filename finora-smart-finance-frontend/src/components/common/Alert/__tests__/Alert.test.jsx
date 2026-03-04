/**
 * @fileoverview Alert Component Tests
 * @description Full coverage: types, title/message/children, close, icon override, a11y
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Alert from '../Alert';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'de' } }),
}));

describe('Alert', () => {
  // ─── Rendering ────────────────────────────────────────────────────
  it('renders message text', () => {
    render(<Alert message="Something happened" />);
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('renders title and message together', () => {
    render(<Alert title="Warning" message="Details here" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('renders children as content', () => {
    render(<Alert><span>Custom child</span></Alert>);
    expect(screen.getByText('Custom child')).toBeInTheDocument();
  });

  it('renders message and children together', () => {
    render(<Alert message="Msg"><span>Extra</span></Alert>);
    expect(screen.getByText('Msg')).toBeInTheDocument();
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it('renders no content div when neither message nor children given', () => {
    const { container } = render(<Alert title="Title only" />);
    expect(container.querySelector('[class*="message"]')).not.toBeInTheDocument();
  });

  // ─── Alert Types ──────────────────────────────────────────────────
  it.each(['info', 'success', 'warning', 'error'])(
    'applies "%s" type class',
    (type) => {
      const { container } = render(<Alert type={type} message="T" />);
      expect(container.querySelector('[role="alert"]').className).toContain(type);
    },
  );

  it('defaults to info type', () => {
    const { container } = render(<Alert message="Default" />);
    expect(container.querySelector('[role="alert"]').className).toContain('info');
  });

  // ─── Custom Icon Override ─────────────────────────────────────────
  it('renders custom icon when icon prop is provided', () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />;
    render(<Alert message="Custom" icon={CustomIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  // ─── Close button ─────────────────────────────────────────────────
  it('shows close button only when onClose is provided', () => {
    const { rerender } = render(<Alert message="No close" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<Alert message="Closeable" onClose={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClose on close button click', () => {
    const onClose = vi.fn();
    render(<Alert message="Close me" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button has correct aria-label', () => {
    render(<Alert message="A" onClose={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'common.closeNotification',
    );
  });

  // ─── Accessibility ────────────────────────────────────────────────
  it('has role="alert" and aria-live="polite"', () => {
    render(<Alert message="A11y" />);
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('icon is aria-hidden', () => {
    const { container } = render(<Alert message="Icon" />);
    const icon = container.querySelector('[class*="iconWrapper"] svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  // ─── className merge ──────────────────────────────────────────────
  it('merges custom className', () => {
    const { container } = render(<Alert message="C" className="extra" />);
    expect(container.querySelector('[role="alert"]').className).toContain('extra');
  });
});
