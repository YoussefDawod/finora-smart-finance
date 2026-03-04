/**
 * @fileoverview Admin CLI Unit Tests
 * @description Tests für admin-cli.js — HTTP-Client gemockt, kein echter Server
 */

// ── Setup: fetch + readline + crypto mocken ───────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// readline mock
const mockQuestion = jest.fn();
const mockClose = jest.fn();
jest.mock('readline', () => ({
  createInterface: () => ({
    question: (prompt, cb) => mockQuestion(prompt, cb),
    close: mockClose,
  }),
}));

// Console-Spies
let logSpy, errorSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  // Reset environment
  delete process.env.ADMIN_TOKEN;
  delete process.env.ADMIN_API_KEY;
  delete process.env.API_URL;
});

// ── Hilfsfunktion: CLI ausführen ──────────────────────────
// CLI läuft über process.argv → wir müssen es als Modul laden
// Da die CLI `main()` sofort aufruft, müssen wir require + process.argv patchen

function runCli(command, ...args) {
  // Reset module cache
  jest.resetModules();
  global.fetch = mockFetch;

  // Set process.argv
  const originalArgv = process.argv;
  process.argv = ['node', 'admin-cli.js', command, ...args];

  // Require — das löst main() aus
  require('../admin-cli.js');

  // Restore
  process.argv = originalArgv;

  // main() ist async und returned nichts direkt,
  // aber wir können auf die Promise warten
  // Da require die main() aufruft, müssen wir kurz warten
  return new Promise((resolve) => setTimeout(resolve, 50));
}

// ── Helper: Successful API Response ───────────────────────
function mockApiSuccess(data) {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: true, data }),
  });
}

function mockApiError(message = 'Something went wrong') {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: false, message }),
  });
}

// ============================================
// AUTH HEADERS
// ============================================
describe('Admin CLI — Auth Headers', () => {
  it('verwendet JWT Bearer Token wenn ADMIN_TOKEN gesetzt', async () => {
    process.env.ADMIN_TOKEN = 'my-jwt-token';
    mockApiSuccess({
      overview: {
        totalUsers: 0, verifiedUsers: 0, unverifiedUsers: 0,
        activeUsers: 0, bannedUsers: 0, adminUsers: 0,
        usersLast7Days: 0, usersLast30Days: 0, totalTransactions: 0,
      },
      recentUsers: [],
    });

    await runCli('stats');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt-token',
        }),
      }),
    );
  });

  it('verwendet x-admin-key wenn ADMIN_API_KEY gesetzt', async () => {
    process.env.ADMIN_API_KEY = 'my-api-key';
    mockApiSuccess({
      overview: {
        totalUsers: 0, verifiedUsers: 0, unverifiedUsers: 0,
        activeUsers: 0, bannedUsers: 0, adminUsers: 0,
        usersLast7Days: 0, usersLast30Days: 0, totalTransactions: 0,
      },
      recentUsers: [],
    });

    await runCli('stats');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-admin-key': 'my-api-key',
        }),
      }),
    );
  });

  it('bevorzugt JWT Token über API-Key', async () => {
    process.env.ADMIN_TOKEN = 'jwt';
    process.env.ADMIN_API_KEY = 'key';
    mockApiSuccess({
      overview: {
        totalUsers: 0, verifiedUsers: 0, unverifiedUsers: 0,
        activeUsers: 0, bannedUsers: 0, adminUsers: 0,
        usersLast7Days: 0, usersLast30Days: 0, totalTransactions: 0,
      },
      recentUsers: [],
    });

    await runCli('stats');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer jwt');
    expect(headers['x-admin-key']).toBeUndefined();
  });
});

// ============================================
// STATS COMMAND
// ============================================
describe('Admin CLI — stats', () => {
  it('ruft /admin/stats auf und zeigt Daten an', async () => {
    mockApiSuccess({
      overview: {
        totalUsers: 42, verifiedUsers: 30, unverifiedUsers: 12,
        activeUsers: 40, bannedUsers: 2, adminUsers: 3,
        usersLast7Days: 5, usersLast30Days: 15, totalTransactions: 200,
      },
      recentUsers: [
        { name: 'Alice', email: 'alice@test.com', isVerified: true, role: 'admin' },
        { name: 'Bob', email: 'bob@test.com', isVerified: false, role: 'user', isActive: false },
      ],
    });

    await runCli('stats');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/stats'),
      expect.any(Object),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('User Statistics'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('42'));
  });

  it('zeigt Fehler bei API-Fehler', async () => {
    mockApiError('Unauthorized');
    await runCli('stats');
    expect(errorSpy).toHaveBeenCalledWith('Error:', 'Unauthorized');
  });
});

// ============================================
// LIST COMMAND
// ============================================
describe('Admin CLI — list', () => {
  const mockUsers = {
    users: [
      { _id: '1', name: 'Alice', email: 'alice@test.com', role: 'admin', isVerified: true, createdAt: '2025-01-01' },
    ],
    pagination: { total: 1 },
  };

  it('ruft /admin/users auf', async () => {
    mockApiSuccess(mockUsers);
    await runCli('list');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users'),
      expect.any(Object),
    );
  });

  it('übergibt --search Parameter', async () => {
    mockApiSuccess(mockUsers);
    await runCli('list', '--search', 'john');

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('search=john');
  });

  it('übergibt --verified Filter', async () => {
    mockApiSuccess(mockUsers);
    await runCli('list', '--verified');

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('isVerified=true');
  });

  it('übergibt --role Filter', async () => {
    mockApiSuccess(mockUsers);
    await runCli('list', '--role', 'admin');

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('role=admin');
  });

  it('übergibt --banned Filter', async () => {
    mockApiSuccess(mockUsers);
    await runCli('list', '--banned');

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('isActive=false');
  });
});

// ============================================
// CREATE COMMAND
// ============================================
describe('Admin CLI — create', () => {
  it('erstellt User mit Name, Passwort, Email', async () => {
    mockApiSuccess({ _id: '123', name: 'Test', email: 'test@test.com', role: 'user', isVerified: false });

    await runCli('create', 'Test', 'Pass123!', 'test@test.com');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"name":"Test"'),
      }),
    );
  });

  it('setzt --verified und --admin Flags', async () => {
    mockApiSuccess({ _id: '123', name: 'Admin', role: 'admin', isVerified: true });

    await runCli('create', 'Admin', 'Pass123!', 'admin@test.com', '--verified', '--admin');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.isVerified).toBe(true);
    expect(body.role).toBe('admin');
  });

  it('zeigt Fehler wenn Name/Passwort fehlen', async () => {
    await runCli('create');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ============================================
// GET COMMAND
// ============================================
describe('Admin CLI — get', () => {
  it('ruft User-Details ab', async () => {
    mockApiSuccess({
      user: {
        _id: '123', name: 'Alice', email: 'alice@test.com', role: 'user',
        isActive: true, isVerified: true, createdAt: '2025-01-01', lastLogin: null,
        preferences: { theme: 'dark', currency: 'EUR', language: 'de' },
      },
      stats: { transactionCount: 5 },
    });

    await runCli('get', '123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users/123'),
      expect.any(Object),
    );
  });

  it('zeigt Fehler wenn User-ID fehlt', async () => {
    await runCli('get');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('User-ID fehlt'));
  });
});

// ============================================
// DELETE COMMAND
// ============================================
describe('Admin CLI — delete', () => {
  it('löscht User', async () => {
    mockApiSuccess({ deletedUser: 'Alice', deletedTransactions: 10 });

    await runCli('delete', '123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users/123'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('zeigt Fehler wenn User-ID fehlt', async () => {
    await runCli('delete');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('User-ID fehlt'));
  });
});

// ============================================
// RESET-PASSWORD COMMAND
// ============================================
describe('Admin CLI — reset-password', () => {
  it('setzt Passwort mit angegebenem Passwort zurück', async () => {
    mockApiSuccess({});

    await runCli('reset-password', '123', 'NewPass123!');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.newPassword).toBe('NewPass123!');
  });

  it('generiert zufälliges Passwort wenn keins angegeben', async () => {
    mockApiSuccess({});

    await runCli('reset-password', '123');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Generiertes Passwort ist 32 Hex-Zeichen (16 Bytes)
    expect(body.newPassword).toMatch(/^[a-f0-9]{32}$/);
  });

  it('zeigt Warnung bei generiertem Passwort', async () => {
    mockApiSuccess({});

    await runCli('reset-password', '123');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('automatisch generiertes Passwort'));
  });

  it('zeigt Fehler wenn User-ID fehlt', async () => {
    await runCli('reset-password');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('User-ID fehlt'));
  });
});

// ============================================
// BAN / UNBAN COMMANDS
// ============================================
describe('Admin CLI — ban/unban', () => {
  it('sperrt User mit Grund', async () => {
    mockApiSuccess({ _id: '123', name: 'Alice', isActive: false, banReason: 'Spam' });

    await runCli('ban', '123', 'Spam', 'Account');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reason).toBe('Spam Account');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users/123/ban'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('entsperrt User', async () => {
    mockApiSuccess({ _id: '123', name: 'Alice', isActive: true });

    await runCli('unban', '123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users/123/unban'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('zeigt Fehler wenn User-ID fehlt bei ban', async () => {
    await runCli('ban');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('User-ID fehlt'));
  });

  it('zeigt Fehler wenn User-ID fehlt bei unban', async () => {
    await runCli('unban');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('User-ID fehlt'));
  });
});

// ============================================
// ROLE / PROMOTE / DEMOTE COMMANDS
// ============================================
describe('Admin CLI — role/promote/demote', () => {
  it('setzt Rolle direkt', async () => {
    mockApiSuccess({ _id: '123', name: 'Alice', role: 'admin' });

    await runCli('role', '123', 'admin');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.role).toBe('admin');
  });

  it('lehnt ungültige Rolle ab', async () => {
    await runCli('role', '123', 'superadmin');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Ungültige Rolle'));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('promote ruft role mit admin auf', async () => {
    mockApiSuccess({ _id: '123', name: 'Alice', role: 'admin' });

    await runCli('promote', '123');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.role).toBe('admin');
  });

  it('demote ruft role mit user auf', async () => {
    mockApiSuccess({ _id: '123', name: 'Alice', role: 'user' });

    await runCli('demote', '123');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.role).toBe('user');
  });
});

// ============================================
// CLEAN-ALL COMMAND
// ============================================
describe('Admin CLI — clean-all', () => {
  it('löscht alle User bei korrekter Bestätigung', async () => {
    mockQuestion.mockImplementation((prompt, cb) => cb('JA LÖSCHEN'));
    mockApiSuccess({ deletedUsers: 5, deletedTransactions: 50 });

    await runCli('clean-all');

    expect(mockQuestion).toHaveBeenCalledWith(
      expect.stringContaining('JA LÖSCHEN'),
      expect.any(Function),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users'),
      expect.objectContaining({ method: 'DELETE' }),
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.confirm).toBe('DELETE_ALL_USERS');
    expect(body.reason).toBeDefined();
    expect(mockClose).toHaveBeenCalled();
  });

  it('bricht ab bei falscher Bestätigung', async () => {
    mockQuestion.mockImplementation((prompt, cb) => cb('nein'));

    await runCli('clean-all');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Abgebrochen.');
  });
});

// ============================================
// HELP & UNKNOWN COMMANDS
// ============================================
describe('Admin CLI — help & unknown', () => {
  it('zeigt Hilfe bei help Befehl', async () => {
    await runCli('help');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Admin CLI'));
  });

  it('zeigt Hilfe wenn kein Befehl angegeben', async () => {
    jest.resetModules();
    global.fetch = mockFetch;
    const originalArgv = process.argv;
    process.argv = ['node', 'admin-cli.js'];
    require('../admin-cli.js');
    process.argv = originalArgv;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Admin CLI'));
  });

  it('zeigt Fehler bei unbekanntem Befehl', async () => {
    await runCli('unknown-cmd');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Unbekannter Befehl'));
  });
});

// ============================================
// ERROR HANDLING
// ============================================
describe('Admin CLI — Error Handling', () => {
  it('fängt Netzwerkfehler ab', async () => {
    const err = new Error('fetch failed');
    err.cause = { code: 'ECONNREFUSED' };
    mockFetch.mockRejectedValueOnce(err);

    await runCli('stats');

    expect(errorSpy).toHaveBeenCalledWith('Error:', 'fetch failed');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('API-Server'));
  });

  it('fängt allgemeine Fehler ab', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));

    await runCli('stats');

    expect(errorSpy).toHaveBeenCalledWith('Error:', 'timeout');
  });
});
