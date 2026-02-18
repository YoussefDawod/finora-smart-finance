/**
 * @fileoverview Modal Component Tests
 * @description Tests for Modal open/close, keyboard, accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from '../Modal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

// Mock framer-motion
/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, variants, initial, animate, exit, onClick, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));
/* eslint-enable no-unused-vars */

// Mock createPortal to render inline
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children) => children,
  };
});

describe('Modal', () => {
  // ==========================================
  // Rendering
  // ==========================================
  it('renders nothing when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  // ==========================================
  // Close Behavior
  // ==========================================
  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Closeable">
        <p>Content</p>
      </Modal>
    );
    // Find close button by aria-label
    const closeButton = screen.getByLabelText('common.closeModal');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ==========================================
  // Accessibility
  // ==========================================
  it('has role="dialog" and aria-modal', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="A11y Test">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Labeled">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  // ==========================================
  // Children & Footer
  // ==========================================
  it('renders children content', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Children">
        <div data-testid="custom-child">Custom</div>
      </Modal>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Footer" footer={<button>Save</button>}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
