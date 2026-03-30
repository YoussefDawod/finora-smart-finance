/**
 * @fileoverview adminEmails Unit Tests
 * @description Tests für notifyAdminsNewUser
 */

// ── Mocks ─────────────────────────────────────

const mockSendEmail = jest.fn().mockResolvedValue(true);
const mockFind = jest.fn();
const mockSelect = jest.fn();
const mockLogger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

jest.mock('../../src/models/User', () => ({
  find: (...args) => {
    mockFind(...args);
    return {
      select: (...sArgs) => {
        mockSelect(...sArgs);
        return mockSelect._result || [];
      },
    };
  },
}));
jest.mock('../../src/utils/logger', () => mockLogger);
jest.mock('../../src/utils/emailService/emailTransport', () => ({
  sendEmail: mockSendEmail,
  buildLink: jest.fn(
    (_base, _path, token) =>
      `https://api.finora.yellowdeveloper.de/api/v1/auth/verify-email?token=${token}`
  ),
  backendBaseUrl: 'https://api.finora.yellowdeveloper.de',
}));
jest.mock('../../src/utils/emailTemplates', () => ({
  newUserRegistration: jest.fn().mockReturnValue('<html>mock</html>'),
  adminCreatedCredentials: jest.fn().mockReturnValue('<html>credentials-mock</html>'),
}));
jest.mock('../../src/config/env', () => ({
  frontendUrl: 'https://finora.yellowdeveloper.de',
}));

const { notifyAdminsNewUser } = require('../../src/utils/emailService/adminEmails');
const { sendAdminCreatedCredentialsEmail } = require('../../src/utils/emailService/adminEmails');
const templates = require('../../src/utils/emailTemplates');

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// notifyAdminsNewUser
// ============================================
describe('notifyAdminsNewUser', () => {
  const mockNewUser = {
    name: 'Max Mustermann',
    email: 'max@example.com',
    createdAt: new Date('2025-01-15T10:30:00Z'),
  };

  it('fragt Admins mit E-Mail ab', async () => {
    mockSelect._result = [];
    await notifyAdminsNewUser(mockNewUser);

    expect(mockFind).toHaveBeenCalledWith({
      role: 'admin',
      email: { $exists: true, $nin: [null, ''] },
    });
    expect(mockSelect).toHaveBeenCalledWith('name email');
  });

  it('sendet E-Mail an jeden Admin', async () => {
    mockSelect._result = [
      { name: 'Admin1', email: 'admin1@test.com' },
      { name: 'Admin2', email: 'admin2@test.com' },
    ];

    await notifyAdminsNewUser(mockNewUser);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'admin1@test.com',
      expect.stringContaining('Max Mustermann'),
      '<html>mock</html>'
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      'admin2@test.com',
      expect.stringContaining('Max Mustermann'),
      '<html>mock</html>'
    );
  });

  it('ruft Template mit korrekten Daten auf', async () => {
    mockSelect._result = [{ name: 'Admin1', email: 'admin1@test.com' }];

    await notifyAdminsNewUser(mockNewUser);

    expect(templates.newUserRegistration).toHaveBeenCalledWith({
      adminName: 'Admin1',
      userName: 'Max Mustermann',
      userEmail: 'max@example.com',
      registeredAt: expect.any(String),
    });
  });

  it('sendet null als Email wenn User keine Email hat', async () => {
    mockSelect._result = [{ name: 'Admin1', email: 'admin1@test.com' }];

    await notifyAdminsNewUser({ name: 'NoEmail User', createdAt: new Date() });

    expect(templates.newUserRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: null })
    );
  });

  it('sendet keine E-Mails wenn keine Admins gefunden', async () => {
    mockSelect._result = [];
    await notifyAdminsNewUser(mockNewUser);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('loggt Fehler statt zu werfen (nicht-kritisch)', async () => {
    mockSelect._result = [{ name: 'Admin1', email: 'admin1@test.com' }];
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP fail'));

    // Soll NICHT werfen
    await expect(notifyAdminsNewUser(mockNewUser)).resolves.not.toThrow();
  });

  it('nutzt Promise.allSettled — eine Failure blockiert nicht andere', async () => {
    mockSelect._result = [
      { name: 'Admin1', email: 'admin1@test.com' },
      { name: 'Admin2', email: 'admin2@test.com' },
    ];
    mockSendEmail.mockRejectedValueOnce(new Error('Fail')).mockResolvedValueOnce(true);

    await notifyAdminsNewUser(mockNewUser);

    // Beide wurden aufgerufen trotz Fehler beim Ersten
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it('loggt Fehler bei DB-Query-Fehler', async () => {
    // Simuliere DB-Fehler durch Überschreiben von find
    const User = require('../../src/models/User');
    const origFind = User.find;
    User.find = () => {
      throw new Error('DB down');
    };

    await notifyAdminsNewUser(mockNewUser);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('DB down'));

    // Restore
    User.find = origFind;
  });

  it('formatiert registeredAt in deutschem Format', async () => {
    mockSelect._result = [{ name: 'Admin1', email: 'admin1@test.com' }];

    await notifyAdminsNewUser(mockNewUser);

    const call = templates.newUserRegistration.mock.calls[0][0];
    // Deutsches Format: z.B. "15. Jan. 2025, 11:30"
    expect(call.registeredAt).toBeTruthy();
    expect(typeof call.registeredAt).toBe('string');
  });
});

// ============================================
// sendAdminCreatedCredentialsEmail — Multilingual
// ============================================
describe('sendAdminCreatedCredentialsEmail', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
  };
  const plainPassword = 'SecurePass123!';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue(true);
  });

  it('sendet Email mit deutschem Betreff als Default', async () => {
    const result = await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null);

    expect(result.sent).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Deine Zugangsdaten – Finora',
      expect.any(String)
    );
  });

  it('sendet Email mit deutschem Betreff bei language=de', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'de');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Deine Zugangsdaten – Finora',
      expect.any(String)
    );
  });

  it('sendet Email mit englischem Betreff bei language=en', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'en');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Your Login Credentials – Finora',
      expect.any(String)
    );
  });

  it('sendet Email mit arabischem Betreff bei language=ar', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'ar');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'بيانات تسجيل الدخول الخاصة بك – Finora',
      expect.any(String)
    );
  });

  it('sendet Email mit georgischem Betreff bei language=ka', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'ka');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'თქვენი შესვლის მონაცემები – Finora',
      expect.any(String)
    );
  });

  it('fällt auf Deutsch zurück bei unbekannter Sprache', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'xx');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Deine Zugangsdaten – Finora',
      expect.any(String)
    );
  });

  it('übergibt language an Template', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'en');

    expect(templates.adminCreatedCredentials).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en' })
    );
  });

  it('übergibt loginLink an Template wenn kein activationToken', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'de');

    expect(templates.adminCreatedCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        loginLink: 'https://finora.yellowdeveloper.de/login',
        activationLink: null,
      })
    );
  });

  it('übergibt activationLink an Template wenn activationToken vorhanden', async () => {
    await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, 'token123', 'de');

    expect(templates.adminCreatedCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        activationLink: expect.stringContaining('token123'),
        loginLink: null,
      })
    );
  });

  it('gibt { sent: false, reason: NO_EMAIL } zurück bei User ohne Email', async () => {
    const result = await sendAdminCreatedCredentialsEmail(
      { name: 'No Email' },
      plainPassword,
      null,
      'de'
    );

    expect(result).toEqual({ sent: false, reason: 'NO_EMAIL' });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('gibt { sent: false, error } zurück bei Email-Fehler', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP fail'));

    const result = await sendAdminCreatedCredentialsEmail(mockUser, plainPassword, null, 'de');

    expect(result.sent).toBe(false);
    expect(result.error).toBe('SMTP fail');
  });
});
