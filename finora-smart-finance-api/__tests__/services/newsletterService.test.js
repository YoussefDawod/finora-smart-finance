/**
 * @fileoverview Newsletter Service Tests
 * @description Unit-Tests für newsletterService – insb. unsubscribeByToken (Dual-Pfad)
 */

const crypto = require('crypto');

// Mocks VOR require des Service
jest.mock('../../src/models/Subscriber');
jest.mock('../../src/utils/emailService', () => ({
  sendNewsletterWelcome: jest.fn().mockResolvedValue(true),
  sendNewsletterGoodbye: jest.fn().mockResolvedValue(true),
  sendNewsletterConfirmation: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const Subscriber = require('../../src/models/Subscriber');
const emailService = require('../../src/utils/emailService');
const newsletterService = require('../../src/services/newsletterService');

// ──────────────────────────────────────────────────────────────────────────────
// Hilfsfunktion: Hash berechnen (spiegelt den Service-Code wider)
// ──────────────────────────────────────────────────────────────────────────────
const sha256 = val => crypto.createHash('sha256').update(val).digest('hex');

describe('newsletterService', () => {
  beforeEach(() => {
    // resetAllMocks: leert Mock-Queues (mockResolvedValueOnce-Reste) zwischen Tests
    jest.resetAllMocks();
    // Email-Mocks müssen nach Reset Promises zurückgeben (fire-and-forget .catch())
    emailService.sendNewsletterWelcome.mockResolvedValue(true);
    emailService.sendNewsletterGoodbye.mockResolvedValue(true);
    emailService.sendNewsletterConfirmation.mockResolvedValue(true);
    // deleteOne nach Reset neu setzen, damit es ein jest.fn() bleibt
    Subscriber.deleteOne = jest.fn().mockResolvedValue({});
  });

  // ============================================================
  // unsubscribeByToken – Dual-Pfad-Logik
  // ============================================================
  describe('unsubscribeByToken', () => {
    const rawToken = 'raw-secret-token-abc123';
    const tokenHash = sha256(rawToken);

    const mockSubscriber = {
      _id: 'sub-1',
      email: 'test@example.com',
      language: 'de',
      unsubscribeToken: tokenHash,
    };

    // ── Pfad 1: RAW-Token (Welcome- / Bestätigungs-E-Mails) ──────────────
    it('(Pfad 1) findet Abonnenten wenn RAW-Token übergeben wird', async () => {
      // Pfad 1 trifft → findOne gibt Ergebnis beim Hash-Lookup zurück
      Subscriber.findOne
        .mockResolvedValueOnce(mockSubscriber) // erster Aufruf → Hash-Lookup
        .mockResolvedValueOnce(null); // zweiter Aufruf nie erreicht
      Subscriber.deleteOne = jest.fn().mockResolvedValue({});

      const result = await newsletterService.unsubscribeByToken(rawToken);

      expect(result).toEqual({ unsubscribed: true, lang: 'de' });
      // Erster findOne muss mit dem Hash aufgerufen worden sein
      expect(Subscriber.findOne).toHaveBeenCalledWith({ unsubscribeToken: tokenHash });
      expect(Subscriber.deleteOne).toHaveBeenCalledWith({ _id: 'sub-1' });
      expect(emailService.sendNewsletterGoodbye).toHaveBeenCalledWith('test@example.com', 'de');
    });

    // ── Pfad 2: HASH direkt (Kampagnen-E-Mails) ──────────────────────────
    it('(Pfad 2) findet Abonnenten wenn HASH direkt übergeben wird', async () => {
      // Pfad 1 schlägt fehl (doppeltes Hashen findet nichts) → Pfad 2 greift
      Subscriber.findOne
        .mockResolvedValueOnce(null) // Hash-Lookup → nicht gefunden
        .mockResolvedValueOnce(mockSubscriber); // direkter Hash-Lookup → gefunden
      Subscriber.deleteOne = jest.fn().mockResolvedValue({});

      const result = await newsletterService.unsubscribeByToken(tokenHash);

      expect(result).toEqual({ unsubscribed: true, lang: 'de' });
      // Zweiter findOne muss mit dem Hash (= dem übergebenen Token) sein
      expect(Subscriber.findOne).toHaveBeenNthCalledWith(2, { unsubscribeToken: tokenHash });
      expect(Subscriber.deleteOne).toHaveBeenCalledWith({ _id: 'sub-1' });
    });

    // ── Kein Abonnent gefunden ─────────────────────────────────────────────
    it('gibt null zurück wenn Token ungültig ist', async () => {
      Subscriber.findOne.mockResolvedValue(null);

      const result = await newsletterService.unsubscribeByToken('unbekannter-token');

      expect(result).toBeNull();
      expect(Subscriber.deleteOne).not.toHaveBeenCalled();
    });

    // ── Fallback-Sprache ───────────────────────────────────────────────────
    it('verwendet "de" als Fallback-Sprache wenn language fehlt', async () => {
      const subNoLang = { ...mockSubscriber, language: undefined };
      Subscriber.findOne.mockResolvedValueOnce(subNoLang);
      Subscriber.deleteOne = jest.fn().mockResolvedValue({});

      const result = await newsletterService.unsubscribeByToken(rawToken);

      expect(result).toEqual({ unsubscribed: true, lang: 'de' });
    });

    // ── Goodbye-E-Mail-Fehler wird nur geloggt, nicht geworfen ───────────
    it('gibt { unsubscribed: true } zurück auch wenn goodbye-E-Mail fehlschlägt', async () => {
      Subscriber.findOne.mockResolvedValueOnce(mockSubscriber);
      Subscriber.deleteOne = jest.fn().mockResolvedValue({});
      emailService.sendNewsletterGoodbye.mockRejectedValueOnce(new Error('SMTP-Fehler'));

      const logger = require('../../src/utils/logger');
      const result = await newsletterService.unsubscribeByToken(rawToken);

      expect(result).toEqual({ unsubscribed: true, lang: 'de' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ============================================================
  // getStatus
  // ============================================================
  describe('getStatus', () => {
    it('gibt subscribed: false wenn kein userEmail übergeben wird', async () => {
      const result = await newsletterService.getStatus(null);
      expect(result).toEqual({ subscribed: false });
    });

    it('gibt subscribed: true wenn bestätigter Abonnent gefunden', async () => {
      Subscriber.findOne.mockResolvedValue({ _id: 'sub-1' });
      const result = await newsletterService.getStatus('user@example.com');
      expect(result).toEqual({ subscribed: true });
    });

    it('gibt subscribed: false wenn kein bestätigter Abonnent gefunden', async () => {
      Subscriber.findOne.mockResolvedValue(null);
      const result = await newsletterService.getStatus('user@example.com');
      expect(result).toEqual({ subscribed: false });
    });
  });
});
