/**
 * @fileoverview Modal Component Tests
 * @description Full coverage: open/close, ESC, overlay click, size, scroll lock,
 *              showCloseButton, closeOnOverlayClick, closeOnEsc, a11y, footer
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Modal from '../Modal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key, i18n: { language: 'de' } }),
}));

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, variants, initial, animate, exit, onClick, ...props }) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));
/* eslint-enable no-unused-vars */

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return { ...actual, createPortal: node => node };
});

afterEach(() => {
  document.body.style.overflow = '';
});

const renderModal = (props = {}) =>
  render(
    <Modal isOpen onClose={vi.fn()} title="Test" {...props}>
      <p>Body</p>
    </Modal>
  );

describe('Modal', () => {
  // ─── Visibility ───────────────────────────────────────────────────
  it('renders nothing when isOpen=false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        <p>X</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders title + children when isOpen=true', () => {
    renderModal();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  // ─── Close button ─────────────────────────────────────────────────
  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByLabelText('common.closeModal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides close button when showCloseButton=false', () => {
    renderModal({ showCloseButton: false });
    expect(screen.queryByLabelText('common.closeModal')).not.toBeInTheDocument();
  });

  // ─── ESC key ──────────────────────────────────────────────────────
  it('calls onClose on Escape when closeOnEsc=true (default)', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose on Escape when closeOnEsc=false', () => {
    const onClose = vi.fn();
    renderModal({ onClose, closeOnEsc: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Overlay click ────────────────────────────────────────────────
  it('calls onClose on overlay click when closeOnOverlayClick=true', () => {
    const onClose = vi.fn();
    const { container } = renderModal({ onClose, closeOnOverlayClick: true });
    // Overlay is the outermost motion.div with the overlay class
    const overlay = container.querySelector('[class*="overlay"]');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose on overlay click when closeOnOverlayClick=false', () => {
    const onClose = vi.fn();
    const { container } = renderModal({ onClose, closeOnOverlayClick: false });
    const overlay = container.querySelector('[class*="overlay"]');
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when clicking modal content (stopPropagation)', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Body scroll lock ─────────────────────────────────────────────
  it('sets body overflow hidden when open', () => {
    renderModal();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    const { unmount } = renderModal();
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  // ─── Size variants ───────────────────────────────────────────────
  it.each(['small', 'medium', 'large', 'fullWidth'])('applies "%s" size class', size => {
    renderModal({ size });
    expect(screen.getByRole('dialog').className).toContain(size);
  });

  // ─── Accessibility ────────────────────────────────────────────────
  it('has role="dialog", aria-modal, aria-labelledby', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  // ─── Footer ───────────────────────────────────────────────────────
  it('renders footer when provided', () => {
    renderModal({ footer: <button>Save</button> });
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('does not render footer div when no footer', () => {
    const { container } = renderModal();
    expect(container.querySelector('[class*="footer"]')).not.toBeInTheDocument();
  });

  // ─── className merge ──────────────────────────────────────────────
  it('merges custom className', () => {
    renderModal({ className: 'custom' });
    expect(screen.getByRole('dialog').className).toContain('custom');
  });
});
