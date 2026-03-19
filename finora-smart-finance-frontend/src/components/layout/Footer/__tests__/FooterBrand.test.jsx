import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterBrand from '../FooterBrand';

// ── Mocks ────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

// ── Tests ────────────────────────────────────────────────

describe('FooterBrand', () => {
  it('rendert Logo mit alt="Finora"', () => {
    render(<FooterBrand />);
    const logo = screen.getByAltText('Finora');
    expect(logo).toBeInTheDocument();
    expect(logo.tagName).toBe('IMG');
  });

  it('Logo hat CSS-Klasse app-logo', () => {
    render(<FooterBrand />);
    const logo = screen.getByAltText('Finora');
    expect(logo.className).toContain('app-logo');
  });

  it('rendert Brand-Description-Text', () => {
    render(<FooterBrand />);
    expect(screen.getByText('footer.brand.description')).toBeInTheDocument();
  });
});
