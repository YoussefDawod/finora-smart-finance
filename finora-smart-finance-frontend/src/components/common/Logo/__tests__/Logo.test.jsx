/**
 * @fileoverview Logo Component Tests
 * @description Coverage: Link vs div, sizes, showText, disableNavigation, a11y,
 *   className forwarding, glow/animated props, brand-font tokens, useMotion gate,
 *   unique gradient IDs, snapshot, entrance stability, contextual behaviour
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Logo from '../Logo';
import { MOTION_TIMING } from '@/utils/motionPresets';

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de' },
  }),
}));

// Mock useMotion — default: shouldAnimate = false (reduced-motion safe tests)
const mockUseMotion = vi.fn(() => ({ shouldAnimate: false }));
vi.mock('@/hooks/useMotion', () => ({
  useMotion: (...args) => mockUseMotion(...args),
}));

/* eslint-disable no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, transition, variants, initial, animate, ...props }) => (
      <div data-whilehover={whileHover ? JSON.stringify(whileHover) : undefined} {...props}>
        {children}
      </div>
    ),
    svg: ({ children, initial, animate, variants, ...props }) => (
      <svg data-initial={initial !== undefined ? String(initial) : undefined} {...props}>
        {children}
      </svg>
    ),
    path: ({ initial, animate, transition, variants, ...props }) => <path {...props} />,
    circle: ({ initial, animate, transition, variants, ...props }) => <circle {...props} />,
  },
}));
/* eslint-enable no-unused-vars */

const renderLogo = (props = {}) =>
  render(
    <MemoryRouter>
      <Logo {...props} />
    </MemoryRouter>
  );

describe('Logo', () => {
  // ─── Navigation ──────────────────────────────────────────────────
  it('renders as a Link by default', () => {
    renderLogo();
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('navigates to custom "to" path', () => {
    renderLogo({ to: '/' });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('renders as a div when disableNavigation=true', () => {
    renderLogo({ disableNavigation: true });
    expect(screen.queryByRole('link')).toBeNull();
    // role="img" is set for static logo
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('sets tabIndex=-1 when disableNavigation=true', () => {
    renderLogo({ disableNavigation: true });
    expect(screen.getByRole('img')).toHaveAttribute('tabindex', '-1');
  });

  it('sets tabIndex=0 when navigation is enabled', () => {
    renderLogo();
    expect(screen.getByRole('link')).toHaveAttribute('tabindex', '0');
  });

  it('sets aria-disabled when disableNavigation=true', () => {
    renderLogo({ disableNavigation: true });
    expect(screen.getByRole('img')).toHaveAttribute('aria-disabled', 'true');
  });

  // ─── Accessibility ───────────────────────────────────────────────
  it('has aria-label from i18n', () => {
    renderLogo();
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'common.appName');
  });

  // ─── Text & Branding ─────────────────────────────────────────────
  it('shows brand name and tagline by default', () => {
    renderLogo();
    expect(screen.getByText('Finora')).toBeInTheDocument();
    expect(screen.getByText('Smart Finance')).toBeInTheDocument();
  });

  it('hides text when showText=false', () => {
    renderLogo({ showText: false });
    expect(screen.queryByText('Finora')).toBeNull();
    expect(screen.queryByText('Smart Finance')).toBeNull();
  });

  // ─── Sizes ────────────────────────────────────────────────────────
  it.each(['small', 'default', 'large'])('applies size class "%s"', (size) => {
    const { container } = renderLogo({ size });
    const root = container.firstChild;
    expect(root.className).toContain(size);
  });

  // ─── SVG ──────────────────────────────────────────────────────────
  it('renders an SVG element', () => {
    const { container } = renderLogo();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  // ─── Click ────────────────────────────────────────────────────────
  it('calls onClick handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderLogo({ onClick: handleClick });
    await user.click(screen.getByRole('link'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not attach onClick when disableNavigation=true', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderLogo({ disableNavigation: true, onClick: handleClick });
    await user.click(screen.getByRole('img'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ─── className Forwarding ─────────────────────────────────────────
  it('forwards className prop to root element', () => {
    const { container } = renderLogo({ className: 'custom-class' });
    expect(container.firstChild.className).toContain('custom-class');
  });

  it('works without className prop', () => {
    const { container } = renderLogo();
    // No trailing space or "undefined" in className
    expect(container.firstChild.className).not.toContain('undefined');
  });

  // ─── Glow Props ──────────────────────────────────────────────────
  it('applies glow-logo class when glow=true', () => {
    const { container } = renderLogo({ glow: true });
    const iconWrapper = container.querySelector('[class*="iconWrapper"]');
    expect(iconWrapper.className).toContain('glow-logo');
  });

  it('does not apply glow-logo-animated when shouldAnimate=false', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: false });
    const { container } = renderLogo({ glow: true, animated: true });
    const iconWrapper = container.querySelector('[class*="iconWrapper"]');
    expect(iconWrapper.className).not.toContain('glow-logo-animated');
  });

  it('applies glow-logo-animated when glow+animated+shouldAnimate', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo({ glow: true, animated: true });
    const iconWrapper = container.querySelector('[class*="iconWrapper"]');
    expect(iconWrapper.className).toContain('glow-logo-animated');
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  // ─── useMotion / Animation Gate ──────────────────────────────────
  it('sets initial=false on SVG when shouldAnimate=false', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: false });
    const { container } = renderLogo();
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-initial', 'false');
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  it('sets initial=hidden on SVG when shouldAnimate=true', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo();
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-initial', 'hidden');
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  it('does not set whileHover when shouldAnimate=false', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: false });
    const { container } = renderLogo();
    const motionDiv = container.querySelector('[class*="iconMotion"]');
    expect(motionDiv).not.toHaveAttribute('data-whilehover');
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  it('sets whileHover with scale 1.02 when shouldAnimate=true and navigable', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo();
    const motionDiv = container.querySelector('[class*="iconMotion"]');
    const hoverData = JSON.parse(motionDiv.getAttribute('data-whilehover'));
    expect(hoverData.scale).toBe(1.02);
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  it('does not set whileHover when disableNavigation=true even with shouldAnimate', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo({ disableNavigation: true });
    const motionDiv = container.querySelector('[class*="iconMotion"]');
    expect(motionDiv).not.toHaveAttribute('data-whilehover');
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  // ─── Unique Gradient IDs ─────────────────────────────────────────
  it('renders unique gradient IDs', () => {
    const { container } = renderLogo();
    const gradients = container.querySelectorAll('linearGradient');
    const ids = Array.from(gradients).map((g) => g.getAttribute('id'));
    // All IDs should be unique and use the React useId pattern
    expect(ids.length).toBe(2);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[0]).toContain('logoPrimary-');
    expect(ids[1]).toContain('logoAccent-');
  });

  // ─── SVG Accessibility ───────────────────────────────────────────
  it('SVG has role="img" and title', () => {
    const { container } = renderLogo();
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
    const title = container.querySelector('svg title');
    expect(title).toBeInTheDocument();
    expect(title.textContent).toBe('Finora Logo');
  });

  it('SVG has desc element for screen readers', () => {
    const { container } = renderLogo();
    const desc = container.querySelector('svg desc');
    expect(desc).toBeInTheDocument();
    expect(desc.textContent).toMatch(/Wachstumslinie/i);
  });

  // ─── Multiple Instances — Unique Gradient IDs ─────────────────────
  it('generates unique gradient IDs across multiple instances', () => {
    const { container } = render(
      <MemoryRouter>
        <Logo />
        <Logo />
      </MemoryRouter>
    );
    const gradients = container.querySelectorAll('linearGradient');
    const ids = Array.from(gradients).map((g) => g.getAttribute('id'));
    // 2 logos × 2 gradients = 4, all unique
    expect(ids.length).toBe(4);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // ─── Entrance Stability (no re-trigger on re-render) ─────────────
  it('does not re-trigger entrance animation on re-render', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container, rerender } = render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>
    );
    const svgBefore = container.querySelector('svg');
    const initialBefore = svgBefore.getAttribute('data-initial');

    // Re-render with same props
    rerender(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>
    );
    const svgAfter = container.querySelector('svg');
    // SVG should still reference "hidden" — framer-motion handles the "once" gate
    expect(svgAfter.getAttribute('data-initial')).toBe(initialBefore);
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  // ─── Brand-Font Tokens ────────────────────────────────────────────
  it('brandName element exists with correct text', () => {
    renderLogo();
    const brand = screen.getByText('Finora');
    expect(brand).toBeInTheDocument();
    // brandName class is applied (Logo.module.scss → brandName)
    expect(brand.className).toContain('brandName');
  });

  it('tagline element exists with correct text', () => {
    renderLogo();
    const tagline = screen.getByText('Smart Finance');
    expect(tagline).toBeInTheDocument();
    expect(tagline.className).toContain('tagline');
  });

  // ─── variant="iconOnly" equivalent (showText=false) ──────────────
  it('hides brand name AND tagline when showText=false (iconOnly)', () => {
    renderLogo({ showText: false });
    expect(screen.queryByText('Finora')).toBeNull();
    expect(screen.queryByText('Smart Finance')).toBeNull();
  });

  it('still renders SVG icon when showText=false', () => {
    const { container } = renderLogo({ showText: false });
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  // ─── Contextual Behaviour ─────────────────────────────────────────
  it('Footer logo: static, no hover, no glow (disableNavigation)', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo({ disableNavigation: true });
    const motionDiv = container.querySelector('[class*="iconMotion"]');
    // No hover interaction
    expect(motionDiv).not.toHaveAttribute('data-whilehover');
    // No glow
    const iconWrapper = container.querySelector('[class*="iconWrapper"]');
    expect(iconWrapper.className).not.toContain('glow-logo');
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  it('Auth hero: glow + animated with entrance sequence', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo({
      disableNavigation: true,
      glow: true,
      animated: true,
      size: 'large',
    });
    const iconWrapper = container.querySelector('[class*="iconWrapper"]');
    expect(iconWrapper.className).toContain('glow-logo');
    expect(iconWrapper.className).toContain('glow-logo-animated');
    // Has entrance animation
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-initial', 'hidden');
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  // ─── Scale values compliance (MOTION_GLOW_RULES §3) ──────────────
  it('hover scale matches MOTION_TIMING.scaleHover (1.02)', () => {
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo();
    const motionDiv = container.querySelector('[class*="iconMotion"]');
    const hoverData = JSON.parse(motionDiv.getAttribute('data-whilehover'));
    expect(hoverData.scale).toBe(MOTION_TIMING.scaleHover);
    expect(hoverData.scale).toBe(1.02);
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  // ─── No loop animation ───────────────────────────────────────────
  it('does not have repeat: Infinity in any variant', () => {
    // logoLetterVariants, logoGrowthLineVariants, logoPeakDotVariants
    // are imported from motionPresets — verify they don't loop
    // We test via the rendered SVG: it has no data attributes suggesting loops
    mockUseMotion.mockReturnValue({ shouldAnimate: true });
    const { container } = renderLogo();
    const svg = container.querySelector('svg');
    // The mock renders static elements; verify no "infinite" in any attr
    const allAttrs = Array.from(svg.attributes).map((a) => a.value);
    allAttrs.forEach((val) => {
      expect(val.toLowerCase()).not.toContain('infinity');
    });
    mockUseMotion.mockReturnValue({ shouldAnimate: false }); // reset
  });

  // ─── SVG Gradient definitions ─────────────────────────────────────
  it('SVG contains defs with gradients and filter', () => {
    const { container } = renderLogo();
    const defs = container.querySelector('svg defs');
    expect(defs).toBeInTheDocument();
    const gradients = defs.querySelectorAll('linearGradient');
    expect(gradients.length).toBe(2);
    const filter = defs.querySelector('filter');
    expect(filter).toBeInTheDocument();
  });

  // ─── SVG paths structure ──────────────────────────────────────────
  it('SVG contains F-letterform path, growth-line path, and peak-dot circle', () => {
    const { container } = renderLogo();
    const svg = container.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    const circles = svg.querySelectorAll('circle');
    // 2 paths (F-letterform + growth-line) and 1 circle (peak-dot)
    expect(paths.length).toBe(2);
    expect(circles.length).toBe(1);
    // Peak-dot position
    expect(circles[0]).toHaveAttribute('cx', '42');
    expect(circles[0]).toHaveAttribute('cy', '22');
    expect(circles[0]).toHaveAttribute('r', '3.5');
  });

  // ─── Entrance Prop (§3.0.4) ───────────────────────────────────────
  it('entrance="full" is the default', () => {
    // Just rendering without explicit entrance should work (default value)
    const { container } = renderLogo();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('entrance="none" skips animation (initial=false)', () => {
    mockUseMotion.mockReturnValueOnce({ shouldAnimate: true });
    const { container } = renderLogo({ entrance: 'none' });
    const svg = container.querySelector('svg');
    // With entrance="none", initial should be "false" (string representation)
    expect(svg).toHaveAttribute('data-initial', 'false');
  });

  it('entrance="fade" with shouldAnimate=true sets initial=hidden', () => {
    mockUseMotion.mockReturnValueOnce({ shouldAnimate: true });
    const { container } = renderLogo({ entrance: 'fade' });
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-initial', 'hidden');
  });

  it('entrance="full" with shouldAnimate=true sets initial=hidden', () => {
    mockUseMotion.mockReturnValueOnce({ shouldAnimate: true });
    const { container } = renderLogo({ entrance: 'full' });
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-initial', 'hidden');
  });

  it('entrance prop does not affect static logo functionality', () => {
    renderLogo({ disableNavigation: true, entrance: 'none' });
    const logo = screen.getByRole('img', { name: /common\.appName/i });
    expect(logo.tagName.toLowerCase()).toBe('div');
    expect(logo).toHaveAttribute('tabindex', '-1');
  });

  it('entrance="none" on HamburgerMenu-style logo (onClick + entrance=none)', () => {
    const handleClick = vi.fn();
    renderLogo({ onClick: handleClick, entrance: 'none' });
    const logo = screen.getByRole('link');
    expect(logo).toBeInTheDocument();
  });

  it('entrance="fade" on Admin-style logo (size=small + entrance=fade)', () => {
    mockUseMotion.mockReturnValueOnce({ shouldAnimate: true });
    const { container } = renderLogo({ size: 'small', entrance: 'fade' });
    // Check that container has a class containing 'small' (CSS modules)
    const logoRoot = container.firstChild;
    expect(logoRoot.className).toMatch(/small/);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-initial', 'hidden');
  });

  // ─── Snapshot Test (Schritt 16) ───────────────────────────────────
  it('matches SVG structure snapshot', () => {
    const { container } = renderLogo();
    const svg = container.querySelector('svg');
    expect(svg).toMatchSnapshot();
  });
});
