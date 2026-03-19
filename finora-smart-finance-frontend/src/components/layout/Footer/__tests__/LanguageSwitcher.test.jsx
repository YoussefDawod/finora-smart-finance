import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';

// ── Mocks ────────────────────────────────────────────────

const mockChangeLanguage = vi.fn();
let mockCurrentLanguage = 'de';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: {
      get language() {
        return mockCurrentLanguage;
      },
      changeLanguage: mockChangeLanguage,
      dir: () => 'ltr',
    },
  }),
}));

// ── Tests ────────────────────────────────────────────────

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockCurrentLanguage = 'de';
    mockChangeLanguage.mockClear();
  });

  it('rendert 4 Sprach-Buttons', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('hat role="group" mit aria-label', () => {
    render(<LanguageSwitcher />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'footer.languageSwitcher.label');
  });

  it('markiert die aktive Sprache mit aria-current', () => {
    mockCurrentLanguage = 'en';
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    const enButton = buttons.find(
      b => b.getAttribute('aria-label') === 'footer.languageSwitcher.en'
    );
    expect(enButton).toHaveAttribute('aria-current', 'true');
  });

  it('setzt aria-current nicht für inaktive Sprachen', () => {
    mockCurrentLanguage = 'de';
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    const enButton = buttons.find(
      b => b.getAttribute('aria-label') === 'footer.languageSwitcher.en'
    );
    expect(enButton).not.toHaveAttribute('aria-current');
  });

  it('aktive Sprache hat langPillActive-Klasse', () => {
    mockCurrentLanguage = 'de';
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    const deButton = buttons.find(
      b => b.getAttribute('aria-label') === 'footer.languageSwitcher.de'
    );
    expect(deButton.className).toContain('langPillActive');
  });

  it('ruft changeLanguage auf bei Klick auf inaktive Sprache', () => {
    mockCurrentLanguage = 'de';
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    const enButton = buttons.find(
      b => b.getAttribute('aria-label') === 'footer.languageSwitcher.en'
    );
    fireEvent.click(enButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('ruft changeLanguage NICHT auf bei Klick auf aktive Sprache', () => {
    mockCurrentLanguage = 'de';
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    const deButton = buttons.find(
      b => b.getAttribute('aria-label') === 'footer.languageSwitcher.de'
    );
    fireEvent.click(deButton);
    expect(mockChangeLanguage).not.toHaveBeenCalled();
  });

  it('zeigt korrekte aria-label für jede Sprache', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByLabelText('footer.languageSwitcher.de')).toBeInTheDocument();
    expect(screen.getByLabelText('footer.languageSwitcher.en')).toBeInTheDocument();
    expect(screen.getByLabelText('footer.languageSwitcher.ar')).toBeInTheDocument();
    expect(screen.getByLabelText('footer.languageSwitcher.ka')).toBeInTheDocument();
  });
});
