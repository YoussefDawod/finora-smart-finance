/**
 * @fileoverview Tests für FooterNav Component
 * @description Testet Navigation-Links, Social Icons, Privacy-Notice-Button und shouldAnimate-Guard.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FooterNav from '../FooterNav';

// ── Mock State ───────────────────────────────────────────

let mockShouldAnimate = false;
const mockReopenNotice = vi.fn();

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: mockShouldAnimate }),
}));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    noticeSeen: true,
    showNotice: false,
    dismissNotice: vi.fn(),
    reopenNotice: mockReopenNotice,
    closeNotice: vi.fn(),
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

const renderFooterNav = () => {
  return render(
    <MemoryRouter>
      <FooterNav />
    </MemoryRouter>,
  );
};

// ── Tests ────────────────────────────────────────────────

describe('FooterNav', () => {
  beforeEach(() => {
    mockShouldAnimate = false;
    mockReopenNotice.mockClear();
  });

  describe('Navigation-Links', () => {
    it('rendert alle Navigations-Sektionen', () => {
      renderFooterNav();
      // 4 Sektions-Titel
      expect(screen.getByText('footer.sections.company')).toBeInTheDocument();
      expect(screen.getByText('footer.sections.product')).toBeInTheDocument();
      expect(screen.getByText('footer.sections.resources')).toBeInTheDocument();
      expect(screen.getByText('footer.sections.legal')).toBeInTheDocument();
    });

    it('rendert Company-Links (About, Contact, Blog)', () => {
      renderFooterNav();
      expect(screen.getByText('footer.links.about')).toBeInTheDocument();
      expect(screen.getByText('footer.links.contact')).toBeInTheDocument();
      expect(screen.getByText('footer.links.blog')).toBeInTheDocument();
    });

    it('rendert Product-Links (Features, Pricing)', () => {
      renderFooterNav();
      expect(screen.getByText('footer.links.features')).toBeInTheDocument();
      expect(screen.getByText('footer.links.pricing')).toBeInTheDocument();
    });

    it('rendert Resources-Links (Help, FAQ)', () => {
      renderFooterNav();
      expect(screen.getByText('footer.links.help')).toBeInTheDocument();
      expect(screen.getByText('footer.links.faq')).toBeInTheDocument();
    });

    it('rendert Legal-Links (Impressum, AGB, Datenschutz)', () => {
      renderFooterNav();
      expect(screen.getByText('footer.impressum')).toBeInTheDocument();
      expect(screen.getByText('footer.terms')).toBeInTheDocument();
      expect(screen.getByText('footer.privacy')).toBeInTheDocument();
    });
  });

  describe('Social Icons', () => {
    it('rendert GitHub und LinkedIn Social-Links', () => {
      renderFooterNav();
      const github = screen.getByLabelText('footer.social.ariaGithub');
      const linkedin = screen.getByLabelText('footer.social.ariaLinkedin');
      expect(github).toBeInTheDocument();
      expect(linkedin).toBeInTheDocument();
    });

    it('Social-Links öffnen in neuem Tab', () => {
      renderFooterNav();
      const github = screen.getByLabelText('footer.social.ariaGithub');
      expect(github).toHaveAttribute('target', '_blank');
      expect(github).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('Social-Links haben korrekte URLs', () => {
      renderFooterNav();
      const github = screen.getByLabelText('footer.social.ariaGithub');
      const linkedin = screen.getByLabelText('footer.social.ariaLinkedin');
      expect(github).toHaveAttribute('href', 'https://github.com/YoussefDawod');
      expect(linkedin).toHaveAttribute('href', expect.stringContaining('linkedin.com'));
    });
  });

  describe('Privacy Notice Button', () => {
    it('rendert den Datenschutzhinweis-Button in der Legal-Sektion', () => {
      renderFooterNav();
      const button = screen.getByText('footer.privacyNotice');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('ruft reopenNotice bei Klick auf den Datenschutzhinweis-Button auf', () => {
      renderFooterNav();
      const button = screen.getByText('footer.privacyNotice');
      fireEvent.click(button);
      expect(mockReopenNotice).toHaveBeenCalledTimes(1);
    });

    it('verhindert Default-Event beim Klick', () => {
      renderFooterNav();
      const button = screen.getByText('footer.privacyNotice');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      button.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('shouldAnimate Guard', () => {
    it('rendert korrekt wenn shouldAnimate=false', () => {
      mockShouldAnimate = false;
      renderFooterNav();
      expect(screen.getByLabelText('footer.social.ariaGithub')).toBeInTheDocument();
    });

    it('rendert korrekt wenn shouldAnimate=true', () => {
      mockShouldAnimate = true;
      renderFooterNav();
      expect(screen.getByLabelText('footer.social.ariaGithub')).toBeInTheDocument();
    });
  });
});
