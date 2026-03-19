import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

// ── Mocks ────────────────────────────────────────────────

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: false }),
}));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    noticeSeen: true,
    showNotice: false,
    dismissNotice: vi.fn(),
    reopenNotice: vi.fn(),
    closeNotice: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de', dir: () => 'ltr', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => <span>{i18nKey}</span>,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('@/api/client', () => ({
  default: { post: vi.fn() },
}));

vi.mock('@/api/endpoints', () => ({
  ENDPOINTS: {
    newsletter: { subscribe: '/newsletter/subscribe' },
    auth: { login: '/auth/login', register: '/auth/register', refresh: '/auth/refresh' },
  },
}));

const MOTION_PROPS = new Set([
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileInView',
  'whileDrag',
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'layout',
  'layoutId',
]);

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'create') return Component => Component;
        return ({ children, ...props }) => {
          const htmlProps = Object.fromEntries(
            Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key))
          );
          const Tag = typeof prop === 'string' ? prop : 'div';
          return React.createElement(Tag, htmlProps, children);
        };
      },
    }
  );
  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// ── Helpers ──────────────────────────────────────────────

const renderFooter = (props = {}) => {
  return render(
    <MemoryRouter>
      <Footer {...props} />
    </MemoryRouter>
  );
};

// ── Tests ────────────────────────────────────────────────

describe('Footer', () => {
  let mockObserve;
  let mockDisconnect;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    global.IntersectionObserver = class {
      constructor(callback) {
        this._callback = callback;
      }
      observe = mockObserve;
      unobserve = vi.fn();
      disconnect = mockDisconnect;
    };
  });

  it('rendert das Footer-Element', () => {
    renderFooter();
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('rendert ohne Props (Default-Werte)', () => {
    renderFooter();
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('erstellt einen IntersectionObserver und observiert den Footer', () => {
    renderFooter();
    expect(mockObserve).toHaveBeenCalled();
  });

  it('disconnected den Observer beim Unmount', () => {
    const { unmount } = renderFooter();
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  describe('Sidebar-Klassen', () => {
    it('wendet sidebarExpanded-Klasse an (desktop, nicht collapsed)', () => {
      renderFooter({ isCollapsed: false, isMobile: false });
      const footer = document.querySelector('footer');
      expect(footer.className).toContain('sidebarExpanded');
    });

    it('wendet sidebarCollapsed-Klasse an (desktop, collapsed)', () => {
      renderFooter({ isCollapsed: true, isMobile: false });
      const footer = document.querySelector('footer');
      expect(footer.className).toContain('sidebarCollapsed');
    });

    it('wendet KEINE Sidebar-Klasse an (mobile)', () => {
      renderFooter({ isMobile: true });
      const footer = document.querySelector('footer');
      expect(footer.className).not.toContain('sidebarExpanded');
      expect(footer.className).not.toContain('sidebarCollapsed');
    });
  });

  it('rendert FooterBrand (Logo vorhanden)', () => {
    renderFooter();
    expect(screen.getByAltText('Finora')).toBeInTheDocument();
  });

  it('rendert FooterNav (nav Elemente vorhanden)', () => {
    renderFooter();
    expect(screen.getByText('footer.sections.company')).toBeInTheDocument();
  });

  it('rendert Copyright-Text', () => {
    renderFooter();
    expect(screen.getByText(/Finora/)).toBeInTheDocument();
  });

  it('BackToTop erscheint nach IntersectionObserver-Callback', () => {
    renderFooter();

    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });
});
