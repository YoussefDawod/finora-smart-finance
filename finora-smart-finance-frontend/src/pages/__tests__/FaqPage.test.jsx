/**
 * @fileoverview FaqPage Tests
 * @description Seitenspezifische Tests für die FAQ-Seite (Accordion, aria-expanded, toggle)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockQuestions = [
  { question: 'Was ist Finora?', answer: 'Eine Finanz-App.' },
  { question: 'Ist es kostenlos?', answer: 'Ja, als Gastmodus.' },
  { question: 'Wie sicher?', answer: 'Sehr sicher.' },
];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'faq.questions' && opts?.returnObjects) return mockQuestions;
      return key;
    },
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    noticeSeen: true, showNotice: false,
    dismissNotice: vi.fn(), reopenNotice: vi.fn(), closeNotice: vi.fn(),
  }),
}));

import FaqPage from '@/pages/FaqPage';

describe('FaqPage — Accordion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(<MemoryRouter><FaqPage /></MemoryRouter>);

  it('rendert alle FAQ-Items', () => {
    renderPage();
    mockQuestions.forEach((q) => {
      expect(screen.getByText(q.question)).toBeInTheDocument();
    });
  });

  it('zeigt keine Antwort initial', () => {
    renderPage();
    mockQuestions.forEach((q) => {
      expect(screen.queryByText(q.answer)).not.toBeInTheDocument();
    });
  });

  it('öffnet die Antwort bei Klick auf Frage', () => {
    renderPage();
    fireEvent.click(screen.getByText(mockQuestions[0].question));
    expect(screen.getByText(mockQuestions[0].answer)).toBeInTheDocument();
  });

  it('schließt die Antwort bei erneutem Klick', () => {
    renderPage();
    fireEvent.click(screen.getByText(mockQuestions[0].question));
    expect(screen.getByText(mockQuestions[0].answer)).toBeInTheDocument();
    fireEvent.click(screen.getByText(mockQuestions[0].question));
    expect(screen.queryByText(mockQuestions[0].answer)).not.toBeInTheDocument();
  });

  it('schließt vorherige Frage bei Klick auf andere Frage', () => {
    renderPage();
    fireEvent.click(screen.getByText(mockQuestions[0].question));
    expect(screen.getByText(mockQuestions[0].answer)).toBeInTheDocument();

    fireEvent.click(screen.getByText(mockQuestions[1].question));
    expect(screen.queryByText(mockQuestions[0].answer)).not.toBeInTheDocument();
    expect(screen.getByText(mockQuestions[1].answer)).toBeInTheDocument();
  });

  it('setzt aria-expanded korrekt', () => {
    renderPage();
    const btn = screen.getByText(mockQuestions[0].question).closest('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('rendert Seitentitel und Untertitel', () => {
    renderPage();
    expect(screen.getByText('faq.title')).toBeInTheDocument();
    expect(screen.getByText('faq.subtitle')).toBeInTheDocument();
  });
});
