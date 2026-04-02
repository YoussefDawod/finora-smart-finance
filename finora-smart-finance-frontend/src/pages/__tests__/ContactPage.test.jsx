/**
 * @fileoverview ContactPage Tests
 * @description Umfassende Tests für das Kontaktformular (Felder, Submit, Honeypot, Consent, API)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
  Trans: ({ i18nKey }) => <span>{i18nKey}</span>,
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

// Mock für API Client
const mockPost = vi.fn();
vi.mock('@/api/client', () => ({
  default: { post: (...args) => mockPost(...args) },
}));

vi.mock('@/api/endpoints', () => ({
  ENDPOINTS: { contact: '/api/contact' },
}));

import ContactPage from '@/pages/ContactPage';

describe('ContactPage — Kontaktformular', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: { success: true } });
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

  // ── Rendering ────────────────────────────────
  it('rendert alle Formularfelder', () => {
    renderPage();
    expect(screen.getByLabelText(/contact\.form\.name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact\.form\.email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact\.form\.message/)).toBeInTheDocument();
  });

  it('rendert Seitentitel und Untertitel', () => {
    renderPage();
    expect(screen.getByText('contact.title')).toBeInTheDocument();
    expect(screen.getByText('contact.subtitle')).toBeInTheDocument();
  });

  it('rendert den Submit-Button', () => {
    renderPage();
    const submitButton = screen.getByRole('button', { name: /contact\.form\.submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  // ── autocomplete-Attribute ──────────────────
  it('hat autocomplete-Attribute auf Name und Email', () => {
    renderPage();
    const nameInput = screen.getByLabelText(/contact\.form\.name/);
    const emailInput = screen.getByLabelText(/contact\.form\.email/);
    expect(nameInput).toHaveAttribute('autocomplete', 'name');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
  });

  // ── Checkbox / DSGVO ────────────────────────
  it('zeigt Fehlermeldung wenn Checkbox nicht markiert bei Submit', async () => {
    renderPage();
    const nameInput = screen.getByLabelText(/contact\.form\.name/);
    const emailInput = screen.getByLabelText(/contact\.form\.email/);
    const messageInput = screen.getByLabelText(/contact\.form\.message/);

    fireEvent.change(nameInput, { target: { value: 'Max', name: 'name' } });
    fireEvent.change(emailInput, { target: { value: 'max@test.de', name: 'email' } });
    fireEvent.change(messageInput, { target: { value: 'Hallo', name: 'message' } });

    const form = screen.getByRole('button', { name: /contact\.form\.submit/i }).closest('form');
    fireEvent.submit(form);

    expect(await screen.findByText('contact.privacyRequired')).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  // ── Honeypot ────────────────────────────────
  it('blockiert Submit wenn Honeypot-Feld gefüllt ist', async () => {
    renderPage();
    // Fill honeypot
    const honeypot = document.querySelector('input[name="_hp_field"]');
    fireEvent.change(honeypot, { target: { value: 'bot-entry' } });

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/contact\.form\.name/), {
      target: { value: 'Bot', name: 'name' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.email/), {
      target: { value: 'bot@spam.com', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.message/), {
      target: { value: 'Spam', name: 'message' },
    });

    // Check consent checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const form = screen.getByRole('button', { name: /contact\.form\.submit/i }).closest('form');
    fireEvent.submit(form);

    // Should silently fail — no API call
    expect(mockPost).not.toHaveBeenCalled();
  });

  // ── Erfolgreicher Submit ─────────────────────
  it('zeigt Erfolgsanzeige nach erfolgreichem Submit', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    renderPage();

    fireEvent.change(screen.getByLabelText(/contact\.form\.name/), {
      target: { value: 'Max', name: 'name' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.email/), {
      target: { value: 'max@test.de', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.message/), {
      target: { value: 'Nachricht', name: 'message' },
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const form = screen.getByRole('button', { name: /contact\.form\.submit/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('contact.success')).toBeInTheDocument();
    });
    expect(mockPost).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        name: 'Max',
        email: 'max@test.de',
        message: 'Nachricht',
      })
    );
  });

  // ── API-Fehler ──────────────────────────────
  it('zeigt Fehlermeldung bei API-Fehler', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: 'Server-Fehler' } },
    });
    renderPage();

    fireEvent.change(screen.getByLabelText(/contact\.form\.name/), {
      target: { value: 'Max', name: 'name' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.email/), {
      target: { value: 'max@test.de', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.message/), {
      target: { value: 'Nachricht', name: 'message' },
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const form = screen.getByRole('button', { name: /contact\.form\.submit/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Server-Fehler')).toBeInTheDocument();
    });
  });

  // ── Loading State ───────────────────────────
  it('deaktiviert Submit-Button während Laden', async () => {
    let resolvePost;
    mockPost.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolvePost = resolve;
        })
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/contact\.form\.name/), {
      target: { value: 'Max', name: 'name' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.email/), {
      target: { value: 'max@test.de', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText(/contact\.form\.message/), {
      target: { value: 'Nachricht', name: 'message' },
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const form = screen.getByRole('button', { name: /contact\.form\.submit/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /contact\.form\.sending/i });
      expect(btn).toBeDisabled();
    });

    // Cleanup
    resolvePost({ data: { success: true } });
  });
});
