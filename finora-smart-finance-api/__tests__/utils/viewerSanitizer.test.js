/**
 * Tests for viewerSanitizer utility
 */
const {
  maskEmail,
  maskName,
  maskAmount,
  maskDescription,
  sanitizeUserForViewer,
  sanitizeTransactionForViewer,
  sanitizeSubscriberForViewer,
  sanitizeAuditLogForViewer,
  sanitizeTransactionUserForViewer,
} = require('../../src/utils/viewerSanitizer');

// ── maskEmail ──────────────────────────────────────
describe('maskEmail', () => {
  it('masks a standard email address', () => {
    expect(maskEmail('john@example.com')).toBe('j***@e***.com');
  });

  it('handles subdomains', () => {
    expect(maskEmail('alice@mail.example.co.uk')).toBe('a***@m***.example.co.uk');
  });

  it('returns null/undefined unchanged', () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail(undefined)).toBeUndefined();
  });

  it('returns non-string unchanged', () => {
    expect(maskEmail(42)).toBe(42);
  });

  it('returns "***" for email without @', () => {
    expect(maskEmail('invalid')).toBe('***');
  });

  it('returns empty string unchanged', () => {
    expect(maskEmail('')).toBe('');
  });
});

// ── maskName ───────────────────────────────────────
describe('maskName', () => {
  it('masks a normal name', () => {
    expect(maskName('John')).toBe('J***');
  });

  it('masks a single-char name', () => {
    expect(maskName('A')).toBe('A***');
  });

  it('returns null/undefined unchanged', () => {
    expect(maskName(null)).toBeNull();
    expect(maskName(undefined)).toBeUndefined();
  });

  it('returns non-string unchanged', () => {
    expect(maskName(123)).toBe(123);
  });

  it('returns empty string unchanged', () => {
    expect(maskName('')).toBe('');
  });

  it('returns whitespace-only string unchanged', () => {
    expect(maskName('   ')).toBe('   ');
  });
});

// ── maskAmount ─────────────────────────────────────
describe('maskAmount', () => {
  it('masks a number amount', () => {
    expect(maskAmount(1234.56)).toBe('***');
  });

  it('masks zero', () => {
    expect(maskAmount(0)).toBe('***');
  });

  it('returns null unchanged', () => {
    expect(maskAmount(null)).toBeNull();
  });

  it('returns undefined unchanged', () => {
    expect(maskAmount(undefined)).toBeUndefined();
  });
});

// ── maskDescription ────────────────────────────────
describe('maskDescription', () => {
  it('masks a description string', () => {
    expect(maskDescription('Gehalt Dezember')).toBe('***');
  });

  it('returns null unchanged', () => {
    expect(maskDescription(null)).toBeNull();
  });

  it('returns empty string unchanged', () => {
    expect(maskDescription('')).toBe('');
  });

  it('returns non-string unchanged', () => {
    expect(maskDescription(42)).toBe(42);
  });
});

// ── sanitizeUserForViewer ──────────────────────────
describe('sanitizeUserForViewer', () => {
  it('masks name, lastName, email, phone, and partial _id', () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+491234567',
      role: 'user',
      verified: true,
    };
    const result = sanitizeUserForViewer(user);
    expect(result.name).toBe('J***');
    expect(result.lastName).toBe('D***');
    expect(result.email).toBe('j***@e***.com');
    expect(result.phone).toBe('***');
    expect(result._id).toBe('***9011');
    // Non-sensitive fields stay intact
    expect(result.role).toBe('user');
    expect(result.verified).toBe(true);
  });

  it('handles Mongoose documents with toObject()', () => {
    const user = {
      toObject: () => ({
        _id: 'abc123456789',
        name: 'Alice',
        email: 'alice@test.com',
      }),
    };
    const result = sanitizeUserForViewer(user);
    expect(result.name).toBe('A***');
    expect(result.email).toBe('a***@t***.com');
  });

  it('returns null/undefined unchanged', () => {
    expect(sanitizeUserForViewer(null)).toBeNull();
    expect(sanitizeUserForViewer(undefined)).toBeUndefined();
  });
});

// ── sanitizeTransactionForViewer ───────────────────
describe('sanitizeTransactionForViewer', () => {
  it('masks amount, description, userName, and partial userId', () => {
    const tx = {
      _id: 'tx123',
      amount: 500,
      description: 'Miete',
      userName: 'Max',
      userId: 'user5678abcd',
      type: 'expense',
      category: 'rent',
    };
    const result = sanitizeTransactionForViewer(tx);
    expect(result.amount).toBe('***');
    expect(result.description).toBe('***');
    expect(result.userName).toBe('M***');
    expect(result.userId).toBe('***abcd');
    // Non-sensitive
    expect(result.type).toBe('expense');
    expect(result.category).toBe('rent');
  });

  it('returns null unchanged', () => {
    expect(sanitizeTransactionForViewer(null)).toBeNull();
  });
});

// ── sanitizeSubscriberForViewer ────────────────────
describe('sanitizeSubscriberForViewer', () => {
  it('masks only email', () => {
    const sub = {
      _id: 'sub123',
      email: 'reader@news.org',
      subscribedAt: '2024-01-01',
    };
    const result = sanitizeSubscriberForViewer(sub);
    expect(result.email).toBe('r***@n***.org');
    expect(result.subscribedAt).toBe('2024-01-01');
  });

  it('returns null unchanged', () => {
    expect(sanitizeSubscriberForViewer(null)).toBeNull();
  });
});

// ── sanitizeAuditLogForViewer ──────────────────────
describe('sanitizeAuditLogForViewer', () => {
  it('masks adminName, targetUserName, IDs, IP, and details', () => {
    const log = {
      _id: 'log999',
      adminName: 'Admin1',
      targetUserName: 'Target1',
      adminId: 'admin12345678',
      targetUserId: 'target87654321',
      ip: '192.168.1.100',
      action: 'BAN_USER',
      details: {
        email: 'test@mail.com',
        name: 'TestName',
        newEmail: 'new@mail.com',
        oldEmail: 'old@mail.com',
        reason: 'spam',
      },
    };
    const result = sanitizeAuditLogForViewer(log);
    expect(result.adminName).toBe('A***');
    expect(result.targetUserName).toBe('T***');
    expect(result.adminId).toBe('***5678');
    expect(result.targetUserId).toBe('***4321');
    expect(result.ip).toBe('***');
    expect(result.details.email).toBe('t***@m***.com');
    expect(result.details.name).toBe('T***');
    expect(result.details.newEmail).toBe('n***@m***.com');
    expect(result.details.oldEmail).toBe('o***@m***.com');
    // Non-sensitive detail fields
    expect(result.details.reason).toBe('spam');
    // Non-sensitive top-level
    expect(result.action).toBe('BAN_USER');
  });

  it('handles log without details', () => {
    const log = { adminName: 'X', ip: '10.0.0.1' };
    const result = sanitizeAuditLogForViewer(log);
    expect(result.adminName).toBe('X***');
    expect(result.ip).toBe('***');
    expect(result.details).toBeUndefined();
  });

  it('returns null unchanged', () => {
    expect(sanitizeAuditLogForViewer(null)).toBeNull();
  });
});

// ── sanitizeTransactionUserForViewer ───────────────
describe('sanitizeTransactionUserForViewer', () => {
  it('masks name, email, and partial _id', () => {
    const usr = {
      _id: 'u_abcdef1234',
      name: 'Lisa',
      email: 'lisa@bank.de',
      totalTransactions: 42,
    };
    const result = sanitizeTransactionUserForViewer(usr);
    expect(result.name).toBe('L***');
    expect(result.email).toBe('l***@b***.de');
    expect(result._id).toBe('***1234');
    expect(result.totalTransactions).toBe(42);
  });

  it('returns null unchanged', () => {
    expect(sanitizeTransactionUserForViewer(null)).toBeNull();
  });
});
