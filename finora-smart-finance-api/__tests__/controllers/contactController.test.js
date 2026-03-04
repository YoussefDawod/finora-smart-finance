/**
 * @fileoverview contactController Tests
 * @description Tests für den Contact Controller –
 *              Validierung, Erfolg, E-Mail-Versand, Fehlerbehandlung.
 */

const { submitContact } = require('../../src/controllers/contactController');

// ── Mocks ──────────────────────────────────────────
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../src/utils/responseHelper', () => ({
  sendError: jest.fn((res, _req, { status }) => {
    res.status(status).json({ success: false });
    return res;
  }),
}));

const logger = require('../../src/utils/logger');
const { sendError } = require('../../src/utils/responseHelper');

// ── Helpers ────────────────────────────────────────
function mockReq(body = {}) {
  return { body, requestId: 'test-123' };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('contactController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Validierung ─────────────────────────────────

  describe('Validierung', () => {
    it('gibt 400 zurück wenn Name fehlt', async () => {
      const req = mockReq({ email: 'test@test.com', message: 'Hi' });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'VALIDATION_ERROR',
        status: 400,
      }));
    });

    it('gibt 400 zurück wenn E-Mail fehlt', async () => {
      const req = mockReq({ name: 'Max', message: 'Hi' });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'VALIDATION_ERROR',
        status: 400,
      }));
    });

    it('gibt 400 zurück wenn Nachricht fehlt', async () => {
      const req = mockReq({ name: 'Max', email: 'test@test.com' });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'VALIDATION_ERROR',
        status: 400,
      }));
    });

    it('gibt 400 zurück bei ungültigem E-Mail-Format', async () => {
      const req = mockReq({ name: 'Max', email: 'invalid', message: 'Hi' });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'INVALID_EMAIL',
        status: 400,
      }));
    });

    it('gibt 400 zurück wenn Name zu lang ist (> 100 Zeichen)', async () => {
      const req = mockReq({ name: 'A'.repeat(101), email: 'test@test.com', message: 'Hi' });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'VALIDATION_ERROR',
        status: 400,
      }));
    });

    it('gibt 400 zurück wenn Email zu lang ist (> 254 Zeichen)', async () => {
      const req = mockReq({ name: 'Max', email: 'a'.repeat(250) + '@b.de', message: 'Hi' });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'VALIDATION_ERROR',
        status: 400,
      }));
    });

    it('gibt 400 zurück wenn Nachricht zu lang ist (> 2000 Zeichen)', async () => {
      const req = mockReq({ name: 'Max', email: 'test@test.com', message: 'X'.repeat(2001) });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'VALIDATION_ERROR',
        status: 400,
      }));
    });

    it('gibt 400 zurück wenn Kategorie zu lang ist (> 50 Zeichen)', async () => {
      const req = mockReq({ name: 'Max', email: 'test@test.com', message: 'Hi', category: 'K'.repeat(51) });
      const res = mockRes();

      await submitContact(req, res);

      expect(sendError).toHaveBeenCalledWith(res, req, expect.objectContaining({
        code: 'VALIDATION_ERROR',
        status: 400,
      }));
    });
  });

  // ── Erfolgreicher Submit ────────────────────────

  describe('Erfolgreicher Submit', () => {
    it('gibt 200 zurück bei gültigen Daten', async () => {
      const req = mockReq({
        name: 'Max',
        email: 'max@test.com',
        category: 'support',
        message: 'Hilfe!',
      });
      const res = mockRes();

      await submitContact(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contact request received',
      });
    });

    it('loggt die Kontaktanfrage', async () => {
      const req = mockReq({
        name: 'Max',
        email: 'max@test.com',
        category: 'feedback',
        message: 'Gute App!',
      });
      const res = mockRes();

      await submitContact(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('feedback'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('max@test.com'),
      );
    });

    it('funktioniert auch ohne Kategorie', async () => {
      const req = mockReq({
        name: 'Max',
        email: 'max@test.com',
        message: 'Ohne Kategorie',
      });
      const res = mockRes();

      await submitContact(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('general'),
      );
    });
  });
});
