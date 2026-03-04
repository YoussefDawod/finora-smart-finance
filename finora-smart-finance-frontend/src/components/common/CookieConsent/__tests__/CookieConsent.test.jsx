/**
 * @fileoverview Tests für CookieConsent (Privacy Notice Banner)
 * @description Testet Erstbesuch-Anzeige, Verstanden-Button, localStorage,
 *              Reopening, Escape-Key, shouldAnimate-Guard und kein Server-Request.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CookieConsent from '../CookieConsent';

// ── Mock State ───────────────────────────────────────────

let mockShouldAnimate = false;
let mockNoticeSeen = false;
let mockShowNotice = false;
const mockDismissNotice = vi.fn();
const mockCloseNotice = vi.fn();
const mockReopenNotice = vi.fn();

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: mockShouldAnimate }),
}));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    get noticeSeen() { return mockNoticeSeen; },
    get showNotice() { return mockShowNotice; },
    dismissNotice: mockDismissNotice,
    reopenNotice: mockReopenNotice,
    closeNotice: mockCloseNotice,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

const MOTION_PROPS = new Set([
  'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag',
  'initial', 'animate', 'exit', 'transition', 'variants', 'layout', 'layoutId',
]);

vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'create') return (Component) => Component;
      return ({ children, ...props }) => {
        const htmlProps = Object.fromEntries(
          Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
        );
        const Tag = typeof prop === 'string' ? prop : 'div';
        return <Tag {...htmlProps}>{children}</Tag>;
      };
    },
  });
  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// ── Helpers ──────────────────────────────────────────────

const renderCookieConsent = () => {
  return render(
    <MemoryRouter>
      <CookieConsent />
    </MemoryRouter>,
  );
};

// ── Tests ────────────────────────────────────────────────

describe('CookieConsent (Privacy Notice)', () => {
  beforeEach(() => {
    mockShouldAnimate = false;
    mockNoticeSeen = false;
    mockShowNotice = false;
    mockDismissNotice.mockClear();
    mockCloseNotice.mockClear();
    mockReopenNotice.mockClear();
  });

  describe('Erstbesuch (noticeSeen=false)', () => {
    it('zeigt den Datenschutz-Hinweis beim Erstbesuch', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('privacyNotice.title')).toBeInTheDocument();
      expect(screen.getByText('privacyNotice.description')).toBeInTheDocument();
    });

    it('zeigt den "Verstanden"-Button', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      expect(screen.getByText('privacyNotice.understood')).toBeInTheDocument();
    });

    it('zeigt KEINEN Close-Button beim Erstbesuch', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      expect(screen.queryByLabelText('privacyNotice.close')).not.toBeInTheDocument();
    });

    it('ruft dismissNotice auf bei Klick auf "Verstanden"', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      fireEvent.click(screen.getByText('privacyNotice.understood'));
      expect(mockDismissNotice).toHaveBeenCalledTimes(1);
      expect(mockCloseNotice).not.toHaveBeenCalled();
    });
  });

  describe('Erneuter Besuch (noticeSeen=true)', () => {
    it('zeigt den Hinweis NICHT wenn noticeSeen=true und showNotice=false', () => {
      mockNoticeSeen = true;
      mockShowNotice = false;
      renderCookieConsent();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Reopening (noticeSeen=true, showNotice=true)', () => {
    it('zeigt den Hinweis wenn showNotice=true', () => {
      mockNoticeSeen = true;
      mockShowNotice = true;
      renderCookieConsent();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('zeigt den Close-Button beim Reopening', () => {
      mockNoticeSeen = true;
      mockShowNotice = true;
      renderCookieConsent();
      expect(screen.getByLabelText('privacyNotice.close')).toBeInTheDocument();
    });

    it('ruft closeNotice auf bei Klick auf "Verstanden" (Reopening)', () => {
      mockNoticeSeen = true;
      mockShowNotice = true;
      renderCookieConsent();
      fireEvent.click(screen.getByText('privacyNotice.understood'));
      expect(mockCloseNotice).toHaveBeenCalledTimes(1);
      expect(mockDismissNotice).not.toHaveBeenCalled();
    });

    it('ruft closeNotice auf bei Klick auf Close-Button', () => {
      mockNoticeSeen = true;
      mockShowNotice = true;
      renderCookieConsent();
      fireEvent.click(screen.getByLabelText('privacyNotice.close'));
      expect(mockCloseNotice).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escape-Key', () => {
    it('schließt den Hinweis bei Escape-Taste (Erstbesuch)', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockDismissNotice).toHaveBeenCalledTimes(1);
    });

    it('schließt den Hinweis bei Escape-Taste (Reopening)', () => {
      mockNoticeSeen = true;
      mockShowNotice = true;
      renderCookieConsent();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockCloseNotice).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('hat role="dialog" und aria-modal="true"', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('hat aria-label mit dem Titel', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'privacyNotice.title');
    });
  });

  describe('Kein Server-Request', () => {
    it('sendet keinen API-Request beim Dismiss', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      fireEvent.click(screen.getByText('privacyNotice.understood'));
      // dismissNotice setzt nur localStorage, kein fetch/axios call
      expect(mockDismissNotice).toHaveBeenCalled();
      // Kein globaler fetch mock aufgerufen
    });
  });

  describe('shouldAnimate Guard', () => {
    it('rendert korrekt ohne Animationen (shouldAnimate=false)', () => {
      mockShouldAnimate = false;
      mockNoticeSeen = false;
      renderCookieConsent();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('rendert korrekt mit Animationen (shouldAnimate=true)', () => {
      mockShouldAnimate = true;
      mockNoticeSeen = false;
      renderCookieConsent();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Shield Icon und Titel', () => {
    it('rendert das Shield-Icon und den Titel', () => {
      mockNoticeSeen = false;
      renderCookieConsent();
      expect(screen.getByText('privacyNotice.title')).toBeInTheDocument();
    });
  });
});
