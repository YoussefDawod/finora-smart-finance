#!/usr/bin/env node

/**
 * Admin CLI Tool für User-Verwaltung
 * Usage: node admin-cli.js [command] [options]
 *
 * Auth: API-Key (x-admin-key Header) oder JWT Bearer Token
 * Konfiguration via Environment-Variablen:
 *   API_URL       - Backend-URL (default: http://localhost:5000)
 *   ADMIN_API_KEY - API-Key für Admin-Zugriff
 *   ADMIN_TOKEN   - JWT Bearer Token (Alternative zu API-Key)
 */

const API_URL = process.env.API_URL
  ? `${process.env.API_URL}/api/v1`
  : 'http://localhost:5000/api/v1';

/**
 * Erstellt Auth-Headers basierend auf verfügbaren Credentials
 */
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  if (process.env.ADMIN_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.ADMIN_TOKEN}`;
  } else if (process.env.ADMIN_API_KEY) {
    headers['x-admin-key'] = process.env.ADMIN_API_KEY;
  }

  return headers;
}

const commands = {
  help: () => {
    console.log(`
Admin CLI - User Management Tool
=====================================

Verfügbare Befehle:

  Statistiken & Übersicht:
    stats                                    - Zeige User-Statistiken

  User-Verwaltung:
    list                                     - Zeige alle Users (max 50)
    list --search john                       - Suche nach Users
    list --verified                           - Nur verifizierte Users
    list --role admin                         - Nur Admins anzeigen
    list --banned                             - Nur gesperrte Users
    get <userId>                             - User Details anzeigen
    create <name> <pwd> [email] [--verified] [--admin] - User anlegen
    delete <userId>                          - User löschen

  Passwort & Sicherheit:
    reset-password <userId> [newPassword]    - Passwort zurücksetzen

  Rollen & Berechtigungen:
    promote <userId>                         - User zum Admin befördern
    demote <userId>                          - Admin zum User degradieren
    role <userId> <admin|user>               - Rolle direkt setzen

  Account-Sperre:
    ban <userId> [reason]                    - User sperren
    unban <userId>                           - Sperre aufheben

  Massenlöschung:
    clean-all                                - ALLE Users löschen (WARNUNG)

Auth-Konfiguration (Environment-Variablen):
    ADMIN_TOKEN=<jwt>   node admin-cli.js stats   - JWT Bearer Token
    ADMIN_API_KEY=<key> node admin-cli.js stats   - API-Key Auth
    (In Development-Modus ist keine Auth erforderlich)

Beispiele:
    node admin-cli.js stats
    node admin-cli.js list --search john --role admin
    node admin-cli.js create admin AdminPass123! admin@example.com --verified --admin
    node admin-cli.js ban 60d5ec49f1b2c72b8c8e4f1a "Spam-Account"
    node admin-cli.js promote 60d5ec49f1b2c72b8c8e4f1a
`);
  },

  stats: async () => {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: getAuthHeaders() });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    const { overview, recentUsers } = data.data;
    console.log('\nUser Statistics');
    console.log('==================');
    console.log(`Total Users:        ${overview.totalUsers}`);
    console.log(`Verified:           ${overview.verifiedUsers}`);
    console.log(`Unverified:         ${overview.unverifiedUsers}`);
    console.log(`Active:             ${overview.activeUsers}`);
    console.log(`Banned:             ${overview.bannedUsers}`);
    console.log(`Admins:             ${overview.adminUsers}`);
    console.log(`Last 7 days:        ${overview.usersLast7Days}`);
    console.log(`Last 30 days:       ${overview.usersLast30Days}`);
    console.log(`Total Transactions: ${overview.totalTransactions}`);

    console.log('\nRecent Users:');
    recentUsers.forEach((user, i) => {
      const role = user.role === 'admin' ? ' [ADMIN]' : '';
      const status = user.isActive === false ? ' [BANNED]' : '';
      console.log(
        `  ${i + 1}. ${user.name} (${user.email || 'no email'}) - ${user.isVerified ? 'verified' : 'pending'}${role}${status}`
      );
    });
    console.log('');
  },

  create: async args => {
    const name = args[0];
    const password = args[1];
    const email = args.find((a, i) => i === 2 && !a.startsWith('--'));
    const isVerified = args.includes('--verified');
    const isAdmin = args.includes('--admin');

    if (!name || !password) {
      console.error('Usage: node admin-cli.js create <name> <pwd> [email] [--verified] [--admin]');
      return;
    }

    const body = { name, password, isVerified };
    if (email) body.email = email;
    if (isAdmin) body.role = 'admin';

    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    const user = data.data;
    console.log('User erstellt:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email || 'keine'}`);
    console.log(`   Rolle: ${user.role || 'user'}`);
    console.log(`   Verifiziert: ${user.isVerified ? 'Ja' : 'Nein'}`);
  },

  list: async args => {
    const params = new URLSearchParams({
      limit: 50,
      showSensitive: false,
    });

    if (args.includes('--search')) {
      const searchIndex = args.indexOf('--search');
      params.set('search', args[searchIndex + 1] || '');
    }
    if (args.includes('--verified')) {
      params.set('isVerified', 'true');
    }
    if (args.includes('--role')) {
      const roleIndex = args.indexOf('--role');
      params.set('role', args[roleIndex + 1] || '');
    }
    if (args.includes('--banned')) {
      params.set('isActive', 'false');
    }

    const res = await fetch(`${API_URL}/admin/users?${params}`, { headers: getAuthHeaders() });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    const { users, pagination } = data.data;
    console.log(`\nUsers (${pagination.total} total)\n`);

    users.forEach((user, i) => {
      const role = user.role === 'admin' ? ' [ADMIN]' : '';
      const status = user.isActive === false ? ' [BANNED]' : '';
      console.log(`${i + 1}. [${user._id}]${role}${status}`);
      console.log(`   Name: ${user.name}${user.lastName ? ' ' + user.lastName : ''}`);
      console.log(`   Email: ${user.email || 'keine'}`);
      console.log(`   Rolle: ${user.role || 'user'}`);
      console.log(
        `   Status: ${user.isActive === false ? 'Gesperrt' : user.isVerified ? 'Verifiziert' : 'Nicht verifiziert'}`
      );
      console.log(`   Erstellt: ${new Date(user.createdAt).toLocaleDateString('de-DE')}`);
      console.log('');
    });
  },

  get: async args => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js get <userId>');
      return;
    }

    const res = await fetch(`${API_URL}/admin/users/${userId}`, { headers: getAuthHeaders() });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    const { user, stats } = data.data;
    console.log('\nUser Details');
    console.log('================');
    console.log('ID:           ', user._id);
    console.log('Name:         ', user.name, user.lastName || '');
    console.log('Email:        ', user.email || 'keine');
    console.log('Phone:        ', user.phone || 'keine');
    console.log('Rolle:        ', user.role || 'user');
    console.log('Aktiv:        ', user.isActive === false ? 'Nein (Gesperrt)' : 'Ja');
    if (user.isActive === false) {
      console.log('Sperrgrund:   ', user.banReason || 'Kein Grund angegeben');
      console.log(
        'Gesperrt am:  ',
        user.bannedAt ? new Date(user.bannedAt).toLocaleString('de-DE') : '-'
      );
    }
    console.log('Verified:     ', user.isVerified ? 'Ja' : 'Nein');
    console.log('Created:      ', new Date(user.createdAt).toLocaleString('de-DE'));
    console.log(
      'Last Login:   ',
      user.lastLogin ? new Date(user.lastLogin).toLocaleString('de-DE') : 'nie'
    );
    console.log('Transactions: ', stats.transactionCount);
    console.log('\nPreferences:');
    console.log('  Theme:      ', user.preferences.theme);
    console.log('  Currency:   ', user.preferences.currency);
    console.log('  Language:   ', user.preferences.language);
    console.log('');
  },

  delete: async args => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js delete <userId>');
      return;
    }

    console.log('WARNUNG: Lösche User und alle Transaktionen...');
    const res = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    console.log('Erfolgreich gelöscht:');
    console.log('   User:', data.data.deletedUser);
    console.log('   Transaktionen:', data.data.deletedTransactions);
  },

  'reset-password': async args => {
    const userId = args[0];
    let newPassword = args[1];

    if (!userId) {
      console.error(
        'User-ID fehlt! Usage: node admin-cli.js reset-password <userId> [newPassword]'
      );
      return;
    }

    // Wenn kein Passwort angegeben: sicheres zufälliges Passwort generieren
    const crypto = require('crypto');
    let generated = false;
    if (!newPassword) {
      newPassword = crypto.randomBytes(16).toString('hex');
      generated = true;
    }

    const res = await fetch(`${API_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    console.log('Passwort erfolgreich zurückgesetzt.');
    console.log('   Neues Passwort:', newPassword);
    if (generated) {
      console.log('\n   ⚠️  Dies ist ein automatisch generiertes Passwort.');
      console.log('   Bitte ändern Sie dieses Passwort umgehend!');
    }
  },

  'clean-all': async () => {
    console.log('\n⚠️  WARNUNG: Dies wird ALLE Users und Transaktionen unwiderruflich löschen!');

    // Interaktive Bestätigung via readline
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const answer = await new Promise(resolve => {
      rl.question('Tippen Sie "JA LÖSCHEN" ein um fortzufahren: ', resolve);
    });
    rl.close();

    if (answer !== 'JA LÖSCHEN') {
      console.log('Abgebrochen.');
      return;
    }

    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ confirm: 'DELETE_ALL_USERS', reason: 'CLI clean-all command' }),
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    console.log('Alle Daten gelöscht:');
    console.log('   Users:', data.data.deletedUsers);
    console.log('   Transaktionen:', data.data.deletedTransactions);
  },

  // =============================================
  // Account-Sperre
  // =============================================

  ban: async args => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js ban <userId> [reason]');
      return;
    }

    const reason = args.slice(1).join(' ') || '';

    const res = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    const user = data.data;
    console.log(`\nUser gesperrt:`);
    console.log(`   ID:     ${user._id}`);
    console.log(`   Name:   ${user.name}`);
    console.log(`   Aktiv:  ${user.isActive ? 'Ja' : 'Nein'}`);
    console.log(`   Grund:  ${user.banReason || 'Kein Grund angegeben'}`);
    console.log('');
  },

  unban: async args => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js unban <userId>');
      return;
    }

    const res = await fetch(`${API_URL}/admin/users/${userId}/unban`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    const user = data.data;
    console.log(`\nSperre aufgehoben:`);
    console.log(`   ID:     ${user._id}`);
    console.log(`   Name:   ${user.name}`);
    console.log(`   Aktiv:  ${user.isActive ? 'Ja' : 'Nein'}`);
    console.log('');
  },

  // =============================================
  // Rollen-Verwaltung
  // =============================================

  role: async args => {
    const userId = args[0];
    const newRole = args[1];

    if (!userId || !newRole) {
      console.error('Usage: node admin-cli.js role <userId> <admin|user>');
      return;
    }

    if (!['admin', 'user'].includes(newRole)) {
      console.error('Ungültige Rolle. Erlaubt: admin, user');
      return;
    }

    const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message || data.error);
      return;
    }

    const user = data.data;
    console.log(`\nRolle geändert:`);
    console.log(`   ID:     ${user._id}`);
    console.log(`   Name:   ${user.name}`);
    console.log(`   Rolle:  ${user.role}`);
    console.log('');
  },

  promote: async args => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js promote <userId>');
      return;
    }

    // Leitet an role-Befehl weiter
    await commands.role([userId, 'admin']);
  },

  demote: async args => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js demote <userId>');
      return;
    }

    // Leitet an role-Befehl weiter
    await commands.role([userId, 'user']);
  },
};

// Main
const main = async () => {
  const [, , command, ...args] = process.argv;

  if (!command || command === 'help') {
    commands.help();
    return;
  }

  const cmd = commands[command];
  if (!cmd) {
    console.error(`Unbekannter Befehl: ${command}`);
    console.log('Verwende "node admin-cli.js help" für Hilfe');
    return;
  }

  try {
    await cmd(args);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.cause?.code === 'ECONNREFUSED') {
      console.error('Tipp: Ist der API-Server gestartet? (npm run dev)');
    }
  }
};

main();
