/**
 * @fileoverview Tests für CookieConsentProvider (Privacy Notice Context)
 * @description Testet localStorage-Integration, State-Management und alle Actions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import { useCookieConsent } from '@/hooks/useCookieConsent';

// Manuell den globalen useMotion-Mock überschreiben (Setup mockt ihn global)
// Hier brauchen wir ihn nicht — die Context-Tests nutzen keine Komponenten mit useMotion.

// ── Test-Komponente ──────────────────────────────────────

function TestConsumer() {
  const { noticeSeen, showNotice, dismissNotice, reopenNotice, closeNotice } = useCookieConsent();

  return (
    <div>
      <span data-testid="noticeSeen">{String(noticeSeen)}</span>
      <span data-testid="showNotice">{String(showNotice)}</span>
      <button data-testid="dismiss" onClick={dismissNotice}>Dismiss</button>
      <button data-testid="reopen" onClick={reopenNotice}>Reopen</button>
      <button data-testid="close" onClick={closeNotice}>Close</button>
    </div>
  );
}

// ── Tests ────────────────────────────────────────────────

describe('CookieConsentProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.getItem.mockReturnValue(null);
  });

  const renderWithProvider = () => {
    return render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>,
    );
  };

  describe('Initialization', () => {
    it('startet mit noticeSeen=false wenn localStorage leer', () => {
      window.localStorage.getItem.mockReturnValue(null);
      renderWithProvider();
      expect(screen.getByTestId('noticeSeen').textContent).toBe('false');
      expect(screen.getByTestId('showNotice').textContent).toBe('false');
    });

    it('startet mit noticeSeen=true wenn localStorage "true" hat', () => {
      window.localStorage.getItem.mockReturnValue('true');
      renderWithProvider();
      expect(screen.getByTestId('noticeSeen').textContent).toBe('true');
    });

    it('startet mit noticeSeen=false wenn localStorage "false" hat', () => {
      window.localStorage.getItem.mockReturnValue('false');
      renderWithProvider();
      expect(screen.getByTestId('noticeSeen').textContent).toBe('false');
    });
  });

  describe('dismissNotice', () => {
    it('setzt noticeSeen=true und showNotice=false', () => {
      window.localStorage.getItem.mockReturnValue(null);
      renderWithProvider();

      fireEvent.click(screen.getByTestId('dismiss'));

      expect(screen.getByTestId('noticeSeen').textContent).toBe('true');
      expect(screen.getByTestId('showNotice').textContent).toBe('false');
    });

    it('speichert "true" in localStorage', () => {
      window.localStorage.getItem.mockReturnValue(null);
      renderWithProvider();

      fireEvent.click(screen.getByTestId('dismiss'));

      expect(window.localStorage.setItem).toHaveBeenCalledWith('privacyNoticeSeen', 'true');
    });
  });

  describe('reopenNotice', () => {
    it('setzt showNotice=true', () => {
      window.localStorage.getItem.mockReturnValue('true');
      renderWithProvider();

      fireEvent.click(screen.getByTestId('reopen'));

      expect(screen.getByTestId('showNotice').textContent).toBe('true');
    });
  });

  describe('closeNotice', () => {
    it('setzt showNotice=false', () => {
      window.localStorage.getItem.mockReturnValue('true');
      renderWithProvider();

      // Erst reopen, dann close
      fireEvent.click(screen.getByTestId('reopen'));
      expect(screen.getByTestId('showNotice').textContent).toBe('true');

      fireEvent.click(screen.getByTestId('close'));
      expect(screen.getByTestId('showNotice').textContent).toBe('false');
    });
  });

  describe('Vollständiger Workflow', () => {
    it('Erstbesuch → Dismiss → Reopen → Close', () => {
      window.localStorage.getItem.mockReturnValue(null);
      renderWithProvider();

      // Erstbesuch: noticeSeen=false
      expect(screen.getByTestId('noticeSeen').textContent).toBe('false');

      // Dismiss: noticeSeen=true
      fireEvent.click(screen.getByTestId('dismiss'));
      expect(screen.getByTestId('noticeSeen').textContent).toBe('true');
      expect(screen.getByTestId('showNotice').textContent).toBe('false');

      // Reopen: showNotice=true
      fireEvent.click(screen.getByTestId('reopen'));
      expect(screen.getByTestId('showNotice').textContent).toBe('true');

      // Close: showNotice=false
      fireEvent.click(screen.getByTestId('close'));
      expect(screen.getByTestId('showNotice').textContent).toBe('false');
    });
  });
});

describe('useCookieConsent', () => {
  it('wirft Error wenn außerhalb des Providers verwendet', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useCookieConsent must be used within CookieConsentProvider');

    consoleSpy.mockRestore();
  });
});
