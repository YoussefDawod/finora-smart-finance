/**
 * @fileoverview AuthRequiredOverlay Component Tests
 * @description Coverage: children rendering, overlay content, a11y, login link
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AuthRequiredOverlay from '../AuthRequiredOverlay';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de' },
  }),
}));

const renderOverlay = (children = <p>Protected content</p>) =>
  render(
    <MemoryRouter>
      <AuthRequiredOverlay>{children}</AuthRequiredOverlay>
    </MemoryRouter>
  );

describe('AuthRequiredOverlay', () => {
  it('renders children', () => {
    renderOverlay(<p>My Dashboard</p>);
    expect(screen.getByText('My Dashboard')).toBeInTheDocument();
  });

  it('wraps children in aria-hidden="true" container', () => {
    renderOverlay();
    const hidden = screen.getByText('Protected content').closest('[aria-hidden="true"]');
    expect(hidden).toBeInTheDocument();
  });

  it('renders lock icon', () => {
    const { container } = renderOverlay();
    // FiLock renders as SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays auth required message from i18n', () => {
    renderOverlay();
    expect(screen.getByText('auth.requiredMessage')).toBeInTheDocument();
  });

  it('renders login/register link', () => {
    renderOverlay();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/login');
    expect(link).toHaveTextContent('auth.loginOrRegister');
  });

  it('renders a wrapper div', () => {
    const { container } = renderOverlay();
    expect(container.firstChild).toBeInTheDocument();
  });
});
