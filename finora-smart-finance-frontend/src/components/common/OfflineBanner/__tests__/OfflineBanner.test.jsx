/**
 * @fileoverview Tests für OfflineBanner Component
 * @description Testet das Offline-Banner: Anzeige, Verschwinden, i18n, a11y.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../OfflineBanner';

// ── Mocks ──────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// ── Mock useOnlineStatus ──────────────────────────
let mockIsOnline = true;
vi.mock('@/hooks', () => ({
  useOnlineStatus: () => mockIsOnline,
}));

describe('OfflineBanner', () => {
  afterEach(() => {
    mockIsOnline = true;
  });

  it('rendert nichts wenn online', () => {
    mockIsOnline = true;
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt Banner wenn offline', () => {
    mockIsOnline = false;
    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('hat role="alert" für Screenreader', () => {
    mockIsOnline = false;
    render(<OfflineBanner />);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  it('zeigt WiFi-Off Icon', () => {
    mockIsOnline = false;
    render(<OfflineBanner />);

    const banner = screen.getByRole('alert');
    const icon = banner.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('zeigt den Fallback-Text an', () => {
    mockIsOnline = false;
    render(<OfflineBanner />);

    expect(
      screen.getByText('Du bist offline – einige Funktionen sind eingeschränkt'),
    ).toBeInTheDocument();
  });
});
