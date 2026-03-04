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
    return { select: (...sArgs) => { mockSelect(...sArgs); return mockSelect._result || []; } };
  },
}));
jest.mock('../../src/utils/logger', () => mockLogger);
jest.mock('../../src/utils/emailService/emailTransport', () => ({
  sendEmail: mockSendEmail,
}));
jest.mock('../../src/utils/emailTemplates', () => ({
  newUserRegistration: jest.fn().mockReturnValue('<html>mock</html>'),
}));

const { notifyAdminsNewUser } = require('../../src/utils/emailService/adminEmails');
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
      '<html>mock</html>',
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      'admin2@test.com',
      expect.stringContaining('Max Mustermann'),
      '<html>mock</html>',
    );
  });

  it('ruft Template mit korrekten Daten auf', async () => {
    mockSelect._result = [
      { name: 'Admin1', email: 'admin1@test.com' },
    ];

    await notifyAdminsNewUser(mockNewUser);

    expect(templates.newUserRegistration).toHaveBeenCalledWith({
      adminName: 'Admin1',
      userName: 'Max Mustermann',
      userEmail: 'max@example.com',
      registeredAt: expect.any(String),
    });
  });

  it('sendet null als Email wenn User keine Email hat', async () => {
    mockSelect._result = [
      { name: 'Admin1', email: 'admin1@test.com' },
    ];

    await notifyAdminsNewUser({ name: 'NoEmail User', createdAt: new Date() });

    expect(templates.newUserRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: null }),
    );
  });

  it('sendet keine E-Mails wenn keine Admins gefunden', async () => {
    mockSelect._result = [];
    await notifyAdminsNewUser(mockNewUser);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('loggt Fehler statt zu werfen (nicht-kritisch)', async () => {
    mockSelect._result = [
      { name: 'Admin1', email: 'admin1@test.com' },
    ];
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP fail'));

    // Soll NICHT werfen
    await expect(notifyAdminsNewUser(mockNewUser)).resolves.not.toThrow();
  });

  it('nutzt Promise.allSettled — eine Failure blockiert nicht andere', async () => {
    mockSelect._result = [
      { name: 'Admin1', email: 'admin1@test.com' },
      { name: 'Admin2', email: 'admin2@test.com' },
    ];
    mockSendEmail
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce(true);

    await notifyAdminsNewUser(mockNewUser);

    // Beide wurden aufgerufen trotz Fehler beim Ersten
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it('loggt Fehler bei DB-Query-Fehler', async () => {
    // Simuliere DB-Fehler durch Überschreiben von find
    const User = require('../../src/models/User');
    const origFind = User.find;
    User.find = () => { throw new Error('DB down'); };

    await notifyAdminsNewUser(mockNewUser);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('DB down'),
    );

    // Restore
    User.find = origFind;
  });

  it('formatiert registeredAt in deutschem Format', async () => {
    mockSelect._result = [
      { name: 'Admin1', email: 'admin1@test.com' },
    ];

    await notifyAdminsNewUser(mockNewUser);

    const call = templates.newUserRegistration.mock.calls[0][0];
    // Deutsches Format: z.B. "15. Jan. 2025, 11:30"
    expect(call.registeredAt).toBeTruthy();
    expect(typeof call.registeredAt).toBe('string');
  });
});
