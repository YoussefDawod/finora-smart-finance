/**
 * @fileoverview Newsletter Route Tests
 * @description Unit-Tests für Double-Opt-In Newsletter-Abonnement Routen
 */

const express = require('express');
const request = require('supertest');
const crypto = require('crypto');

// Mock dependencies BEFORE requiring the router
jest.mock('../../src/models/Subscriber');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/emailService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../src/config/env', () => ({
  nodeEnv: 'test',
  port: 3000,
  jwt: { secret: 'test-secret', expiresIn: '7d' },
  frontendUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3000',
}));
jest.mock('../../src/utils/emailTemplates/newsletterStatusPage', () => ({
  newsletterStatusPage: jest.fn((status) => `<html>${status}</html>`),
}));
// Mock authMiddleware
jest.mock('../../src/middleware/authMiddleware', () => {
  return (req, _res, next) => {
    req.user = req._mockUser || { _id: 'user-123', email: 'test@example.com' };
    next();
  };
});

const Subscriber = require('../../src/models/Subscriber');
const emailService = require('../../src/utils/emailService');
const { newsletterStatusPage } = require('../../src/utils/emailTemplates/newsletterStatusPage');

// Build test app
let app;

beforeAll(() => {
  // Rate limiter darf Tests nicht blockieren — wir patchen ihn weg
  jest.mock('express-rate-limit', () => {
    return () => (_req, _res, next) => next();
  });

  const newsletterRouter = require('../../src/routes/newsletter');
  app = express();
  app.use(express.json());
  // Middleware um MockUser zu injizieren
  app.use((req, _res, next) => {
    if (req.headers['x-mock-user']) {
      req._mockUser = JSON.parse(req.headers['x-mock-user']);
    }
    next();
  });
  app.use('/api/newsletter', newsletterRouter);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Newsletter Routes', () => {
  // ============================================
  // POST /api/newsletter/subscribe
  // ============================================
  describe('POST /subscribe', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_EMAIL');
    });

    it('should return 200 if subscriber is already confirmed', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue({
        email: 'exists@example.com',
        isConfirmed: true,
      });

      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'exists@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Keine Email-Versand bei bereits bestätigtem Subscriber
      expect(emailService.sendNewsletterConfirmation).not.toHaveBeenCalled();
    });

    it('should create new subscriber and send confirmation', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockGenerateConfirm = jest.fn().mockReturnValue('confirm-token');
      const mockGenerateUnsubscribe = jest.fn().mockReturnValue('unsub-token');

      Subscriber.mockImplementation(() => ({
        email: 'new@example.com',
        language: 'de',
        generateConfirmationToken: mockGenerateConfirm,
        generateUnsubscribeToken: mockGenerateUnsubscribe,
        save: mockSave,
      }));

      // optionalAuth: kein Token => User.findById wird nicht aufgerufen
      emailService.sendNewsletterConfirmation = jest.fn().mockResolvedValue(true);

      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'new@example.com', language: 'de' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
      expect(emailService.sendNewsletterConfirmation).toHaveBeenCalledWith(
        'new@example.com',
        'confirm-token',
        'unsub-token',
        'de'
      );
    });

    it('should update existing unconfirmed subscriber', async () => {
      const mockExisting = {
        email: 'pending@example.com',
        isConfirmed: false,
        language: 'de',
        generateConfirmationToken: jest.fn().mockReturnValue('new-confirm'),
        generateUnsubscribeToken: jest.fn().mockReturnValue('new-unsub'),
        save: jest.fn().mockResolvedValue(true),
      };
      Subscriber.findOne = jest.fn().mockResolvedValue(mockExisting);
      emailService.sendNewsletterConfirmation = jest.fn().mockResolvedValue(true);

      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'pending@example.com', language: 'en' });

      expect(res.status).toBe(200);
      expect(mockExisting.language).toBe('en');
      expect(mockExisting.save).toHaveBeenCalled();
    });

    it('should handle duplicate key errors gracefully', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);
      Subscriber.mockImplementation(() => ({
        generateConfirmationToken: jest.fn().mockReturnValue('t'),
        generateUnsubscribeToken: jest.fn().mockReturnValue('u'),
        save: jest.fn().mockRejectedValue({ code: 11000 }),
      }));

      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'race@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 500 on unexpected error', async () => {
      Subscriber.findOne = jest.fn().mockRejectedValue(new Error('DB down'));

      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'error@example.com' });

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('SERVER_ERROR');
    });

    it('should handle email sending failure gracefully', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);
      Subscriber.mockImplementation(() => ({
        email: 'test@example.com',
        language: 'de',
        generateConfirmationToken: jest.fn().mockReturnValue('ct'),
        generateUnsubscribeToken: jest.fn().mockReturnValue('ut'),
        save: jest.fn().mockResolvedValue(true),
      }));
      emailService.sendNewsletterConfirmation = jest.fn().mockRejectedValue(new Error('SMTP error'));

      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'test@example.com' });

      // Soll trotzdem 200 zurückgeben (Email-Fehler wird geloggt, nicht an User weitergegeben)
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // GET /api/newsletter/confirm
  // ============================================
  describe('GET /confirm', () => {
    it('should return 400 if no token provided', async () => {
      const res = await request(app).get('/api/newsletter/confirm');

      expect(res.status).toBe(400);
      expect(newsletterStatusPage).toHaveBeenCalledWith('invalid', 'de');
    });

    it('should confirm subscriber with valid token', async () => {
      const rawToken = 'valid-confirm-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockSubscriber = {
        email: 'new@example.com',
        language: 'de',
        isConfirmed: false,
        generateUnsubscribeToken: jest.fn().mockReturnValue('new-unsub-token'),
        save: jest.fn().mockResolvedValue(true),
      };

      Subscriber.findOne = jest.fn().mockResolvedValue(mockSubscriber);
      emailService.sendNewsletterWelcome = jest.fn().mockResolvedValue(true);

      const res = await request(app).get(`/api/newsletter/confirm?token=${rawToken}`);

      expect(res.status).toBe(200);
      expect(Subscriber.findOne).toHaveBeenCalledWith({
        confirmationToken: tokenHash,
        confirmationExpires: { $gt: expect.any(Date) },
      });
      expect(mockSubscriber.isConfirmed).toBe(true);
      expect(mockSubscriber.confirmationToken).toBeUndefined();
      expect(mockSubscriber.save).toHaveBeenCalled();
      expect(emailService.sendNewsletterWelcome).toHaveBeenCalledWith(
        'new@example.com',
        'new-unsub-token',
        'de'
      );
      expect(newsletterStatusPage).toHaveBeenCalledWith('confirmed', 'de');
    });

    it('should return 400 for invalid/expired token', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app).get('/api/newsletter/confirm?token=bad-token');

      expect(res.status).toBe(400);
      expect(newsletterStatusPage).toHaveBeenCalledWith('invalid', 'de');
    });

    it('should return 500 on server error', async () => {
      Subscriber.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/newsletter/confirm?token=some-token');

      expect(res.status).toBe(500);
      expect(newsletterStatusPage).toHaveBeenCalledWith('error', 'de');
    });
  });

  // ============================================
  // GET /api/newsletter/unsubscribe
  // ============================================
  describe('GET /unsubscribe', () => {
    it('should return 400 if no token provided', async () => {
      const res = await request(app).get('/api/newsletter/unsubscribe');

      expect(res.status).toBe(400);
      expect(newsletterStatusPage).toHaveBeenCalledWith('invalid', 'de');
    });

    it('should unsubscribe with valid token', async () => {
      const rawToken = 'valid-unsub-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockSubscriber = {
        _id: 'sub-123',
        email: 'bye@example.com',
        language: 'en',
      };

      Subscriber.findOne = jest.fn().mockResolvedValue(mockSubscriber);
      Subscriber.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
      emailService.sendNewsletterGoodbye = jest.fn().mockResolvedValue(true);

      const res = await request(app).get(`/api/newsletter/unsubscribe?token=${rawToken}`);

      expect(res.status).toBe(200);
      expect(Subscriber.findOne).toHaveBeenCalledWith({ unsubscribeToken: tokenHash });
      expect(Subscriber.deleteOne).toHaveBeenCalledWith({ _id: 'sub-123' });
      expect(emailService.sendNewsletterGoodbye).toHaveBeenCalledWith('bye@example.com', 'en');
      expect(newsletterStatusPage).toHaveBeenCalledWith('unsubscribed', 'en');
    });

    it('should return 400 for invalid unsubscribe token', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app).get('/api/newsletter/unsubscribe?token=invalid');

      expect(res.status).toBe(400);
    });

    it('should return 500 on server error', async () => {
      Subscriber.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/newsletter/unsubscribe?token=some-token');

      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // GET /api/newsletter/status (authentifiziert)
  // ============================================
  describe('GET /status', () => {
    it('should return subscribed:true for confirmed subscriber', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue({
        email: 'test@example.com',
        isConfirmed: true,
      });

      const res = await request(app).get('/api/newsletter/status');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, subscribed: true });
      expect(Subscriber.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        isConfirmed: true,
      });
    });

    it('should return subscribed:false for non-subscriber', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app).get('/api/newsletter/status');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, subscribed: false });
    });

    it('should return subscribed:false if user has no email', async () => {
      const res = await request(app)
        .get('/api/newsletter/status')
        .set('x-mock-user', JSON.stringify({ _id: 'u1', email: '' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, subscribed: false });
    });

    it('should return 500 on server error', async () => {
      Subscriber.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/newsletter/status');

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('SERVER_ERROR');
    });
  });

  // ============================================
  // POST /api/newsletter/toggle (authentifiziert)
  // ============================================
  describe('POST /toggle', () => {
    it('should return 400 if user has no email', async () => {
      const res = await request(app)
        .post('/api/newsletter/toggle')
        .set('x-mock-user', JSON.stringify({ _id: 'u1', email: '' }));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('NO_EMAIL');
    });

    it('should unsubscribe confirmed subscriber', async () => {
      const mockSubscriber = {
        _id: 'sub-123',
        email: 'test@example.com',
        isConfirmed: true,
        language: 'de',
      };

      Subscriber.findOne = jest.fn().mockResolvedValue(mockSubscriber);
      Subscriber.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
      emailService.sendNewsletterGoodbye = jest.fn().mockResolvedValue(true);

      const res = await request(app).post('/api/newsletter/toggle');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        subscribed: false,
        message: 'Newsletter abgemeldet',
      });
      expect(Subscriber.deleteOne).toHaveBeenCalledWith({ _id: 'sub-123' });
      expect(emailService.sendNewsletterGoodbye).toHaveBeenCalled();
    });

    it('should subscribe new user (create subscriber)', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockGenerateUnsub = jest.fn().mockReturnValue('unsub-token');

      Subscriber.mockImplementation(() => ({
        email: 'test@example.com',
        userId: 'user-123',
        isConfirmed: true,
        generateUnsubscribeToken: mockGenerateUnsub,
        save: mockSave,
      }));

      emailService.sendNewsletterWelcome = jest.fn().mockResolvedValue(true);

      const res = await request(app).post('/api/newsletter/toggle');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        subscribed: true,
        message: 'Newsletter abonniert',
      });
      expect(mockSave).toHaveBeenCalled();
      expect(emailService.sendNewsletterWelcome).toHaveBeenCalled();
    });

    it('should activate existing unconfirmed subscriber', async () => {
      const mockExisting = {
        email: 'test@example.com',
        isConfirmed: false,
        language: 'de',
        generateUnsubscribeToken: jest.fn().mockReturnValue('unsub-token'),
        save: jest.fn().mockResolvedValue(true),
      };

      Subscriber.findOne = jest.fn().mockResolvedValue(mockExisting);
      emailService.sendNewsletterWelcome = jest.fn().mockResolvedValue(true);

      const res = await request(app).post('/api/newsletter/toggle');

      expect(res.status).toBe(200);
      expect(res.body.subscribed).toBe(true);
      expect(mockExisting.isConfirmed).toBe(true);
      expect(mockExisting.subscribedAt).toBeDefined();
      expect(mockExisting.save).toHaveBeenCalled();
    });

    it('should handle duplicate key error gracefully', async () => {
      Subscriber.findOne = jest.fn().mockResolvedValue(null);
      Subscriber.mockImplementation(() => ({
        generateUnsubscribeToken: jest.fn().mockReturnValue('t'),
        save: jest.fn().mockRejectedValue({ code: 11000 }),
      }));

      const res = await request(app).post('/api/newsletter/toggle');

      expect(res.status).toBe(200);
      expect(res.body.subscribed).toBe(true);
    });

    it('should return 500 on unexpected error', async () => {
      Subscriber.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/api/newsletter/toggle');

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('SERVER_ERROR');
    });
  });
});
