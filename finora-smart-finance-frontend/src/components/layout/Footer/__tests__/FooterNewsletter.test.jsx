import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FooterNewsletter from '../FooterNewsletter';

// ── Mocks ────────────────────────────────────────────────

let mockShouldAnimate = false;

vi.mock('@/hooks/useMotion', () => ({
  useMotion: () => ({ shouldAnimate: mockShouldAnimate }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
  Trans: ({ i18nKey, components }) => {
    if (components?.link) {
      return (
        <span>
          {i18nKey} <span data-testid="privacy-link">{components.link}</span>
        </span>
      );
    }
    return <span>{i18nKey}</span>;
  },
}));

const mockPost = vi.fn();
vi.mock('@/api/client', () => ({
  default: { post: (...args) => mockPost(...args) },
}));

vi.mock('@/api/endpoints', () => ({
  ENDPOINTS: {
    newsletter: { subscribe: '/newsletter/subscribe' },
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

const renderNewsletter = () => {
  return render(
    <MemoryRouter>
      <FooterNewsletter />
    </MemoryRouter>
  );
};

// ── Tests ────────────────────────────────────────────────

describe('FooterNewsletter', () => {
  beforeEach(() => {
    mockShouldAnimate = false;
    mockPost.mockClear();
  });

  it('rendert Titel, Input und Submit-Button', () => {
    renderNewsletter();
    expect(screen.getByText('footer.newsletter.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('footer.newsletter.placeholder')).toBeInTheDocument();
    expect(screen.getByText('footer.newsletter.button')).toBeInTheDocument();
  });

  it('rendert Email-Input mit aria-label', () => {
    renderNewsletter();
    const input = screen.getByPlaceholderText('footer.newsletter.placeholder');
    expect(input).toHaveAttribute('aria-label', 'footer.newsletter.placeholder');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('rendert die DSGVO Consent-Checkbox', () => {
    renderNewsletter();
    expect(screen.getByText(/footer\.newsletter\.consent/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('zeigt emailRequired-Meldung bei leerem E-Mail-Feld mit role="alert"', async () => {
    renderNewsletter();
    fireEvent.click(screen.getByText('footer.newsletter.button'));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('footer.newsletter.emailRequired');
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('zeigt Fehlermeldung bei ungültiger E-Mail mit role="alert"', async () => {
    renderNewsletter();
    const input = screen.getByPlaceholderText('footer.newsletter.placeholder');
    const checkbox = screen.getByRole('checkbox');

    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.click(checkbox);

    const form = input.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('footer.newsletter.error');
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('zeigt consentRequired-Meldung wenn Consent fehlt mit role="alert"', async () => {
    renderNewsletter();
    const input = screen.getByPlaceholderText('footer.newsletter.placeholder');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('footer.newsletter.button'));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('footer.newsletter.consentRequired');
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('sendet API-Request mit gültiger E-Mail und Consent', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    renderNewsletter();

    const input = screen.getByPlaceholderText('footer.newsletter.placeholder');
    const button = screen.getByText('footer.newsletter.button');
    const checkbox = screen.getByRole('checkbox');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(checkbox);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/newsletter/subscribe', {
        email: 'test@example.com',
        language: 'de',
      });
    });
  });

  it('leert Email und Consent nach erfolgreichem Subscribe', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    renderNewsletter();

    const input = screen.getByPlaceholderText('footer.newsletter.placeholder');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('footer.newsletter.button'));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('deaktiviert Button während isSubmitting', async () => {
    let resolvePost;
    mockPost.mockReturnValue(
      new Promise(r => {
        resolvePost = r;
      })
    );
    renderNewsletter();

    const input = screen.getByPlaceholderText('footer.newsletter.placeholder');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('footer.newsletter.button'));

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    resolvePost({ data: { success: true } });
  });

  it('zeigt serverError bei API-Fehler mit role="alert"', async () => {
    mockPost.mockRejectedValue(new Error('Server Error'));
    renderNewsletter();

    const input = screen.getByPlaceholderText('footer.newsletter.placeholder');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('footer.newsletter.button'));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('footer.newsletter.serverError');
    });
  });
});
