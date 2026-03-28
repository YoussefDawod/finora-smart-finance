/**
 * @fileoverview AdminErrorBoundary Tests
 * @description Tests für die AdminErrorBoundary-Komponente –
 *              Error-Auslösung, Rendering, Retry, Details-Toggle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminErrorBoundary from '../AdminErrorBoundary';

// ── Mock t() Funktion ────────────────────────────
const mockT = key => {
  const translations = {
    'admin.errorBoundary.title': 'Etwas ist schiefgelaufen',
    'admin.errorBoundary.message': 'Beim Laden ist ein Fehler aufgetreten.',
    'admin.errorBoundary.retry': 'Erneut versuchen',
    'admin.errorBoundary.details': 'Technische Details',
  };
  return translations[key] || key;
};

// ── Fehler-auslösende Komponente ─────────────────
function BrokenChild() {
  throw new Error('Test Error: Component crashed');
}

function GoodChild() {
  return <div data-testid="good-child">Alles OK</div>;
}

// Console-Error unterdrücken (React Error Boundary loggt Fehler)
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ============================================
// Tests
// ============================================
describe('AdminErrorBoundary', () => {
  // ── Normal Rendering ────────────────────────────

  describe('Normal Rendering', () => {
    it('rendert Kinder wenn kein Fehler', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <GoodChild />
        </AdminErrorBoundary>
      );
      expect(screen.getByTestId('good-child')).toBeInTheDocument();
      expect(screen.getByText('Alles OK')).toBeInTheDocument();
    });

    it('zeigt keine Fehler-UI im Normalzustand', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <GoodChild />
        </AdminErrorBoundary>
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ── Error State ─────────────────────────────────

  describe('Error State', () => {
    it('fängt Rendering-Fehler ab und zeigt Fallback', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
    });

    it('zeigt Fehlermeldung', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );
      expect(screen.getByText('Beim Laden ist ein Fehler aufgetreten.')).toBeInTheDocument();
    });

    it('versteckt die Kinder-Komponente', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );
      expect(screen.queryByTestId('good-child')).not.toBeInTheDocument();
    });

    it('zeigt Retry-Button', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );
      expect(screen.getByText('Erneut versuchen')).toBeInTheDocument();
    });
  });

  // ── Retry ───────────────────────────────────────

  describe('Retry', () => {
    it('setzt Error-State zurück bei Klick auf Retry', () => {
      // Wir verwenden eine Komponente die beim ersten Render crashed,
      // aber nach dem Reset nicht mehr
      let shouldCrash = true;

      function ConditionalCrash() {
        if (shouldCrash) throw new Error('Crash');
        return <div data-testid="recovered">Wiederhergestellt</div>;
      }

      render(
        <AdminErrorBoundary t={mockT}>
          <ConditionalCrash />
        </AdminErrorBoundary>
      );

      // Error State sichtbar
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Fix den Crash-Zustand
      shouldCrash = false;

      // Retry klicken
      fireEvent.click(screen.getByText('Erneut versuchen'));

      // Kinder werden wieder gerendert
      expect(screen.getByTestId('recovered')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ── Details ─────────────────────────────────────

  describe('Technische Details', () => {
    it('zeigt Details-Toggle-Button', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );
      expect(screen.getByText('Technische Details')).toBeInTheDocument();
    });

    it('zeigt Fehlermeldung nach Toggle-Klick', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );

      // Details sind initial versteckt
      expect(screen.queryByText('Test Error: Component crashed')).not.toBeInTheDocument();

      // Klick auf Details
      fireEvent.click(screen.getByText('Technische Details'));

      // Details sichtbar
      expect(screen.getByText('Test Error: Component crashed')).toBeInTheDocument();
    });

    it('versteckt Details bei erneutem Klick', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );

      const toggle = screen.getByText('Technische Details');

      // Öffnen
      fireEvent.click(toggle);
      expect(screen.getByText('Test Error: Component crashed')).toBeInTheDocument();

      // Schließen
      fireEvent.click(toggle);
      expect(screen.queryByText('Test Error: Component crashed')).not.toBeInTheDocument();
    });

    it('setzt aria-expanded korrekt', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );

      const toggle = screen.getByText('Technische Details');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ── Fallback-Texte ──────────────────────────────

  describe('Fallback-Texte (ohne t)', () => {
    it('zeigt Fallback-Texte wenn t nicht vorhanden', () => {
      render(
        <AdminErrorBoundary>
          <BrokenChild />
        </AdminErrorBoundary>
      );
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
      expect(screen.getByText('Erneut versuchen')).toBeInTheDocument();
    });
  });

  // ── Console Logging ─────────────────────────────

  describe('Console Logging', () => {
    it('loggt Fehler in console.error', () => {
      render(
        <AdminErrorBoundary t={mockT}>
          <BrokenChild />
        </AdminErrorBoundary>
      );

      // React selbst loggt Fehler + unsere componentDidCatch
      expect(console.error).toHaveBeenCalled();
    });
  });
});
